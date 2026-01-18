import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import toast from 'react-hot-toast';
import { BusinessCategory } from '../../types.ts';

// Helper to parse CSV manually to avoid dependencies
const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = (lines[0] ?? '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Robust CSV line splitter that handles quoted commas
    const splitLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, '')); // Trim and remove surrounding quotes
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim().replace(/^"|"$/g, ''));
        return result;
    };

    return lines.slice(1).map(line => {
        const values = splitLine(line);
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
        }, {} as any);
    });
};

const BusinessBulkImporter: React.FC = () => {
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importLog, setImportLog] = useState<string[]>([]);
    const [fileKey, setFileKey] = useState(Date.now()); // Force reset file input

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                if (!text) return;
                const data = parseCSV(text);
                setPreviewData(data);
                toast.success(`Loaded ${data.length} rows for preview.`);
            } catch (err) {
                toast.error("Failed to parse CSV file.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        if (!window.confirm(`Are you sure you want to import ${previewData.length} businesses?`)) return;

        setIsImporting(true);
        setImportLog([]);
        const log: string[] = [];
        let successCount = 0;
        let failCount = 0;

        for (const row of previewData) {
            try {
                // generate slug
                const slug = `${row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-6)}`;

                // Map CSV fields to DB columns
                // Handle category mapping (fuzzy or exact)
                // Note: DB expects valid enum value in array.
                // Simple mapping: Capitalize first letter or use as-is if matches enum. 
                // For robustness, defaulting to 'Spa & Massage' if unknown could be risky, but better than fail?
                // For now, let's assume input matches enum string or close to it.

                const businessData = {
                    name: row.name,
                    slug: slug,
                    categories: [row.category || 'Spa & Massage'], // Use Array for new data model
                    address: row.address,
                    ward: row.ward || '', // Default to empty string if missing
                    city: row.city,
                    district: row.district,
                    phone: row.phone,
                    email: row.email,
                    website: row.website,
                    latitude: row.latitude ? parseFloat(row.latitude) : null,
                    longitude: row.longitude ? parseFloat(row.longitude) : null,
                    description: row.description,
                    is_active: true, // Auto-activate
                    is_verified: true, // Auto-verify
                    joined_date: new Date().toISOString(),
                    membership_tier: 'FREE', // Default
                    membership_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
                    working_hours: { "Thứ 2 - Thứ 6": `${row.working_hours_start || '09:00'} - ${row.working_hours_end || '20:00'}` }
                };

                const { error } = await supabase.from('businesses').insert(businessData);

                if (error) throw error;

                log.push(`✅ Imported: ${row.name}`);
                successCount++;
            } catch (err: any) {
                log.push(`❌ Failed: ${row.name} - ${err.message}`);
                failCount++;
            }
            // Update log every 10 items or so to avoid React state spam if needed, 
            // but for <500 items, direct update is okay ish, or batch it.
        }
        setImportLog(log);
        setIsImporting(false);
        setPreviewData([]);
        setFileKey(Date.now());
        toast.success(`Import complete! Success: ${successCount}, Failed: ${failCount}`);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <div className="border-b pb-4">
                <h3 className="text-xl font-bold text-neutral-dark mb-2">Import Doanh Nghiệp (CSV)</h3>
                <p className="text-sm text-gray-500">
                    Tải lên file CSV chứa danh sách doanh nghiệp để nhập liệu hàng loạt.
                    <br />
                    Định dạng file: `name`, `category`, `city`, `district`, `address`, `phone`, `email`, `website`, `latitude`, `longitude`, `description`, `working_hours_start`, `working_hours_end`...
                </p>
                <div className="mt-4">
                    <a href="/template_businesses.csv" download className="text-primary hover:underline text-sm font-semibold">
                        ⬇ Tải file mẫu CSV
                    </a>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <input
                    key={fileKey}
                    id="bulk-import-csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    title="Chọn file CSV để import"
                    placeholder="Chọn file CSV"
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-white
                        hover:file:bg-primary-dark"
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
                            {isImporting ? 'Importing...' : 'Start Import'}
                        </button>
                    </div>

                    <div className="max-h-64 overflow-auto border rounded">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-gray-100 font-bold sticky top-0">
                                <tr>
                                    <th className="p-2 border">Name</th>
                                    <th className="p-2 border">Category</th>
                                    <th className="p-2 border">City/District</th>
                                    <th className="p-2 border">Phone</th>
                                    <th className="p-2 border">Lat/Lng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 10).map((row, i) => (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                        <td className="p-2">{row.name}</td>
                                        <td className="p-2">{row.category}</td>
                                        <td className="p-2">{row.city} - {row.district}</td>
                                        <td className="p-2">{row.phone}</td>
                                        <td className="p-2">{row.latitude}, {row.longitude}</td>
                                    </tr>
                                ))}
                                {previewData.length > 10 && (
                                    <tr>
                                        <td colSpan={5} className="p-2 text-center text-gray-500 italic">... and {previewData.length - 10} more ...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {importLog.length > 0 && (
                <div className="bg-gray-900 text-green-400 p-4 rounded text-xs font-mono max-h-60 overflow-auto">
                    {importLog.map((line, i) => <div key={i}>{line}</div>)}
                </div>
            )}
        </div>
    );
};

export default BusinessBulkImporter;
