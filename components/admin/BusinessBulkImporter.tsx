import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import { createClient } from '@supabase/supabase-js'; // Import createClient for direct admin connection
import toast from 'react-hot-toast';
import ConfirmDialog from '../ConfirmDialog.tsx';

// Helper to parse CSV manually to avoid dependencies
const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== ''); // Handle CRLF or LF
    if (lines.length === 0) return [];

    const headers = (lines[0] ?? '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Robust CSV line splitter that handles quoted commas
    const splitLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    // specific for double quotes in CSV "This is ""quoted"""
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    };

    return lines.slice(1).map(line => {
        // Skip empty lines
        if (!line.trim()) return null;
        const values = splitLine(line);
        // Create object based on headers
        const row: any = {};
        headers.forEach((header, index) => {
            // Normalize header key
            const key = header.toLowerCase().replace(/[\s\W_]+/g, '_');
            // Map known variations
            const mappedKey =
                key.includes('pass') ? 'password' :
                    key.includes('lat') ? 'latitude' :
                        key.includes('lng') || key.includes('long') || key.includes('lon') ? 'longitude' :
                            key.includes('photo') || key.includes('image') || key.includes('gallery') ? 'images_str' :
                                key.includes('hour') && key.includes('start') ? 'working_hours_start' :
                                    key.includes('hour') && key.includes('end') ? 'working_hours_end' :
                                        key;

            row[mappedKey] = values[index] || '';
        });
        return row;
    }).filter(r => r !== null);
};

const BusinessBulkImporter: React.FC = () => {
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importLog, setImportLog] = useState<string[]>([]);
    const [fileKey, setFileKey] = useState(Date.now());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [serviceRoleKey, setServiceRoleKey] = useState(''); // New State for Direct Key
    const [useDirectMode, setUseDirectMode] = useState(false); // Toggle mode

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                if (!text) return;
                const data = parseCSV(text);

                // Validate required fields
                const validRows = data.filter(row => row.name && row.email && row.password);

                if (validRows.length < data.length) {
                    toast.error(`Warning: ${data.length - validRows.length} rows missing name/email/password.`);
                }

                setPreviewData(validRows);
                toast.success(`Loaded ${validRows.length} valid rows for preview.`);
            } catch (err) {
                toast.error("Failed to parse CSV file.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        if (!previewData.length) return;
        if (useDirectMode && !serviceRoleKey) {
            toast.error("Please enter your Service Role Key for Direct Import.");
            return;
        }
        setShowConfirmDialog(true);
    };

    const confirmImport = async () => {
        setShowConfirmDialog(false);
        setIsImporting(true);
        setImportLog(prev => []); // Clear logs

        if (useDirectMode) {
            await handleDirectImport();
        } else {
            await handleEdgeFunctionImport();
        }
    };

    // --- OPTION 1: EDGE FUNCTION IMPORT ---
    const handleEdgeFunctionImport = async () => {
        setImportLog(['🚀 Starting bulk import via Edge Function...']);
        try {
            const { data, error } = await supabase.functions.invoke('bulk-import-businesses', {
                body: { businesses: previewData }
            });

            if (error) throw error;

            const logs = [
                `✅ Success: ${data.success?.length || 0}`,
                `❌ Failed: ${data.failed?.length || 0}`,
                ...(data.failed || []).map((f: any) => `⚠️ Fail detail (${f.name}): ${f.error || 'Unknown'}`)
            ];

            setImportLog(prev => [...prev, ...logs]);
            if (!data.failed || data.failed.length === 0) {
                toast.success('All businesses imported successfully!');
            } else {
                toast.error(`Import completed with ${data.failed.length} errors.`);
            }

        } catch (err) {
            console.error(err);
            setImportLog(prev => [...prev, `❌ CRITICAL ERROR: ${err instanceof Error ? err.message : 'Unknown network error'}`]);
            toast.error('Import process failed to start.');
        } finally {
            setIsImporting(false);
            setPreviewData([]);
            setFileKey(Date.now());
        }
    };

    // --- OPTION 2: DIRECT ADMIN IMPORT (Client-Side) ---
    const handleDirectImport = async () => {
        setImportLog(['🚀 Starting DIRECT import using Service Key...']);

        let adminClient;
        try {
            // Create a temporary client with the service role key
            adminClient = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                serviceRoleKey,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
        } catch (e) {
            setImportLog(prev => [...prev, `❌ Invalid Configuration: Could not create Supabase Client.`]);
            setIsImporting(false);
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const row of previewData) {
            const { name, email, password, address, phone, city, district, ward, latitude, longitude, category, description, images_str, working_hours_start, working_hours_end, website } = row;
            try {
                setImportLog(prev => [...prev, `Processing: ${name}...`]);

                // 1. Check or Create User
                let user_id: string | null = null;
                const { data: { users } } = await adminClient.auth.admin.listUsers();
                const existingUser = users.find(u => u.email === email);

                if (existingUser) {
                    user_id = existingUser.id;
                    setImportLog(prev => [...prev, `   ℹ️ User ${email} already exists.`]);
                } else {
                    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
                        email,
                        password,
                        email_confirm: true,
                        user_metadata: { full_name: name, role: 'business_owner' }
                    });
                    if (createError) throw createError;
                    user_id = userData.user.id;
                    setImportLog(prev => [...prev, `   ✅ User created: ${email}`]);
                }

                if (!user_id) throw new Error("Failed to resolve User ID");

                // 2. Prepare Business Data
                const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

                const gallery = images_str
                    ? images_str.split(',').map((url: string) => url.trim()).filter((url: string) => url.length > 0)
                    : [];

                const image_url = gallery.length > 0
                    ? gallery[0]
                    : `https://via.placeholder.com/800x600?text=${encodeURIComponent(name)}`;

                const working_hours = {
                    "Thứ 2 - Thứ 6": `${working_hours_start || '09:00'} - ${working_hours_end || '20:00'}`,
                    "Thứ 7 - Chủ Nhật": "09:00 - 21:00"
                };

                const businessData = {
                    owner_id: user_id,
                    name,
                    slug,
                    email,
                    phone: String(phone),
                    address,
                    city: city || 'Hồ Chí Minh',
                    district: district || '',
                    ward: ward || '',
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                    description: description || '',
                    categories: [category || 'Spa & Massage'],
                    image_url: image_url,
                    gallery: gallery,
                    working_hours: working_hours,
                    website,
                    is_active: true,
                    is_verified: true,
                    membership_tier: 'Free',
                    joined_date: new Date().toISOString()
                };

                // 3. Insert Business
                const { error: insertError } = await adminClient
                    .from('businesses')
                    .insert(businessData);

                if (insertError) throw insertError;

                setImportLog(prev => [...prev, `   ✅ Business created: ${name}`]);
                successCount++;

            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                setImportLog(prev => [...prev, `   ❌ Failed ${name}: ${msg}`]);
                failCount++;
            }
        }

        setImportLog(prev => [...prev, `🏁 DONE. Success: ${successCount}, Failed: ${failCount}`]);
        setIsImporting(false);
        setPreviewData([]);
        setFileKey(Date.now());
        if (failCount === 0) toast.success("Batch import completed successfully!");
        else toast.error("Import finished with some errors.");
    };

    // Generate Template Blob
    const downloadTemplate = () => {
        const headers = [
            'Name', 'Email', 'Password', 'Phone', 'Address', 'City', 'District', 'Latitude', 'Longitude',
            'Category', 'Description', 'working_hours_Start', 'working_hours_End', 'Website', 'Images_Comma_Separated'
        ];
        const sample = [
            'Spa Hà Nội 123,spa123@example.com,ChangeMe123,0909123456,123 Kim Mã,Hà Nội,Ba Đình,21.0285,105.8542,Spa & Massage,"Spa uy tín hàng đầu",09:00,21:00,https://spa.com,"https://img1.com/a.jpg,https://img2.com/b.jpg"'
        ];
        const csvContent = "\uFEFF" + [headers.join(','), ...sample].join('\n'); // Add BOM for Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "template_businesses_full.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div className="border-b pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-neutral-dark mb-2">Import Doanh Nghiệp</h3>
                        <p className="text-sm text-gray-500">
                            Nhập liệu hàng loạt kèm tạo tài khoản login.
                            <br />
                            <strong>Yêu cầu bắt buộc:</strong> Name, Email, Password.
                        </p>
                    </div>
                    <button onClick={downloadTemplate} className="text-primary hover:underline text-sm font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Tải file mẫu Excel (CSV)
                    </button>
                </div>
            </div>

            {/* Mode Toggle and Key Input */}
            <div className="bg-gray-50 p-4 rounded border">
                <div className="flex items-center gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useDirectMode}
                            onChange={(e) => setUseDirectMode(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <span className="font-semibold text-sm">Chế độ Direct Service Key (Khuyên dùng nếu Edge Function lỗi)</span>
                    </label>
                </div>
                {useDirectMode && (
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">SUPABASE SERVICE ROLE KEY (Bắt buộc cho tạo user):</label>
                        <input
                            type="password"
                            value={serviceRoleKey}
                            onChange={(e) => setServiceRoleKey(e.target.value)}
                            placeholder="eyJh... (Paste key vào đây, không lưu server)"
                            className="w-full text-sm p-2 border rounded"
                        />
                        <p className="text-xs text-red-500 mt-1">⚠️ Key này có quyền admin tối cao. Chỉ paste khi bạn là admin và đang thao tác trên máy cá nhân.</p>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                <input
                    key={fileKey}
                    id="bulk-import-csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                />
            </div>

            {previewData.length > 0 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">Preview ({previewData.length} records)</span>
                        <button
                            onClick={handleImport}
                            disabled={isImporting}
                            className={`px-6 py-2 rounded text-white font-bold transition-colors ${isImporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {isImporting ? 'Processing...' : 'Start Import'}
                        </button>
                    </div>

                    <div className="max-h-64 overflow-auto border rounded">
                        <table className="min-w-full text-xs text-left whitespace-nowrap">
                            <thead className="bg-gray-100 font-bold sticky top-0 z-10">
                                <tr>
                                    <th className="p-2 border">Name</th>
                                    <th className="p-2 border">Credentials</th>
                                    <th className="p-2 border">Location</th>
                                    <th className="p-2 border">Images</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 10).map((row, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-2 font-medium">{row.name}</td>
                                        <td className="p-2 text-blue-600">{row.email} | {row.password}</td>
                                        <td className="p-2">{row.latitude}, {row.longitude}</td>
                                        <td className="p-2 truncate max-w-[200px]">{row.images_str}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {importLog.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono max-h-60 overflow-auto whitespace-pre-line">
                    {importLog.map((line, i) => <div key={i}>{line}</div>)}
                </div>
            )}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                title="Confirm Import"
                message={`This will create ${previewData.length} User Accounts and Business Profiles. Are you sure?`}
                confirmText={useDirectMode ? "Run Direct Import" : "Run Helper Function"}
                cancelText="Cancel"
                variant="info"
                onConfirm={confirmImport}
                onCancel={() => setShowConfirmDialog(false)}
            />
        </div>
    );
};

export default BusinessBulkImporter;
