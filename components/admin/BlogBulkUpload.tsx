import React, { useState } from 'react';
import { useBlogData } from '../../contexts/BlogDataContext.tsx';
import toast from 'react-hot-toast';
import ConfirmDialog from '../ConfirmDialog.tsx';

// Helper to parse CSV manually to avoid dependencies
const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = (lines[0] ?? '').split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    const splitLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
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
        const values = splitLine(line);
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
        }, {} as any);
    });
};

const BlogBulkUpload: React.FC = () => {
    const { blogCategories, addBlogCategory, bulkAddBlogPosts } = useBlogData();
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [fileKey, setFileKey] = useState(Date.now());
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const text = evt.target?.result as string;
                if (!text) return;
                const data = parseCSV(text);

                // Basic validation of required headers
                const requiredHeaders = ['title', 'content', 'category'];
                const headers = Object.keys(data[0] || {});
                const missing = requiredHeaders.filter(h => !headers.includes(h));

                if (missing.length > 0) {
                    toast.error(`Thiếu cột bắt buộc: ${missing.join(', ')}`);
                    return;
                }

                setPreviewData(data);
                toast.success(`Đã tải ${data.length} hàng dữ liệu.`);
            } catch (err) {
                toast.error("Lỗi khi đọc file CSV.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        setShowConfirmDialog(true);
    };

    const confirmImport = async () => {
        setShowConfirmDialog(false);
        setIsImporting(true);

        try {
            // 1. Ensure categories exist
            const uniqueCategories = Array.from(new Set(previewData.map(p => p.category.trim()).filter(Boolean)));
            for (const catName of uniqueCategories) {
                const exists = blogCategories.some(c => c.name.toLowerCase() === (catName as string).toLowerCase());
                if (!exists) {
                    await addBlogCategory(catName as string);
                }
            }

            // 2. Prepare posts for bulk add
            const postsToImport = previewData.map(row => ({
                title: row.title,
                excerpt: row.excerpt || row.title,
                author: row.author || 'Admin',
                category: row.category,
                imageUrl: row.imageUrl || 'https://placehold.co/800x400/E6A4B4/FFFFFF?text=Blog+Image',
                content: row.content,
                status: (row.status === 'Published' || row.status === 'Draft') ? row.status : 'Published',
                isFeatured: row.isFeatured === 'TRUE' || row.isFeatured === 'true' || row.isFeatured === '1',
                seo: {
                    title: row.seoTitle || row.title,
                    description: row.seoDescription || row.excerpt || '',
                    keywords: row.seoKeywords || row.category || ''
                }
            }));

            const result = await bulkAddBlogPosts(postsToImport);
            toast.success(`Import thành công: ${result.success} bài viết.`);

            setPreviewData([]);
            setFileKey(Date.now());
        } catch (error) {
            console.error("Bulk import failed:", error);
            toast.error("Import thất bại. Vui lòng kiểm tra lại file.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="mt-8 bg-gray-50 border rounded-lg p-6">
            <h3 className="text-xl font-bold text-neutral-dark mb-4">Bulk Blog Post Upload</h3>
            <div className="flex flex-col gap-4">
                <div className="text-sm text-gray-600">
                    <p>Tải lên file CSV để thêm nhanh nhiều bài viết. Tự động tạo danh mục nếu chưa có.</p>
                    <a
                        href="/templates/blog_upload_template.csv"
                        download
                        className="text-primary hover:underline font-semibold flex items-center gap-1 mt-2"
                    >
                        ⬇ Tải file mẫu CSV chuẩn
                    </a>
                </div>

                <div className="flex items-center gap-4">
                    <input
                        key={fileKey}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary file:text-white
                            hover:file:bg-primary-dark cursor-pointer"
                    />
                </div>

                {previewData.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-lg">Xem trước ({previewData.length} bài viết)</h4>
                            <button
                                onClick={handleImport}
                                disabled={isImporting}
                                className={`px-6 py-2 rounded text-white font-bold transition-all shadow-md ${isImporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700 active:scale-95'
                                    }`}
                            >
                                {isImporting ? 'Đang Import...' : 'Bắt đầu Import'}
                            </button>
                        </div>

                        <div className="max-h-60 overflow-auto border rounded bg-white">
                            <table className="min-w-full text-xs text-left">
                                <thead className="bg-gray-100 font-bold sticky top-0">
                                    <tr>
                                        <th className="p-2 border">Title</th>
                                        <th className="p-2 border">Category</th>
                                        <th className="p-2 border">Author</th>
                                        <th className="p-2 border">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td className="p-2 font-medium">{row.title}</td>
                                            <td className="p-2">{row.category}</td>
                                            <td className="p-2">{row.author}</td>
                                            <td className="p-2">
                                                <span className={`px-2 py-0.5 rounded-full ${row.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {row.status || 'Published'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {previewData.length > 10 && (
                                        <tr>
                                            <td colSpan={4} className="p-2 text-center text-gray-500 italic bg-gray-50 uppercase tracking-widest text-[10px]">
                                                ... và {previewData.length - 10} bài viết khác ...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={showConfirmDialog}
                title="Xác nhận Import"
                message={`Bạn có chắc chắn muốn tải lên ${previewData.length} bài viết blog?`}
                confirmText="Import ngay"
                cancelText="Hủy"
                variant="info"
                onConfirm={confirmImport}
                onCancel={() => setShowConfirmDialog(false)}
            />
        </div>
    );
};

export default BlogBulkUpload;
