import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BlogCategory } from '../../types.ts';
import { useBlogData } from '../../contexts/BusinessDataContext.tsx';

interface AdminCategoryManagerProps {
    setConfirmDialog: (dialog: any) => void;
}

const AdminCategoryManager: React.FC<AdminCategoryManagerProps> = ({ setConfirmDialog }) => {
    const { categories: blogCategories, addCategory: addBlogCategory, updateCategory: updateBlogCategory } = useBlogData();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        const trimmedName = newCategoryName.trim();
        if (!trimmedName) {
            toast.error('Vui lòng nhập tên danh mục');
            return;
        }
        const isDuplicate = blogCategories.some(
            (cat: BlogCategory) => cat.name.toLowerCase().trim() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
            toast.error(`Danh mục "${trimmedName}" đã tồn tại`);
            return;
        }

        setIsAdding(true);
        try {
            await addBlogCategory(trimmedName);
            setNewCategoryName('');
            toast.success('Đã thêm danh mục mới');
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Lỗi khi thêm danh mục');
        } finally {
            setIsAdding(false);
        }
    };

    const handleUpdate = async () => {
        if (editingCategory) {
            try {
                await updateBlogCategory(editingCategory.id, editingCategory.name);
                setEditingCategory(null);
                toast.success('Đã cập nhật danh mục');
            } catch (err) {
                toast.error('Lỗi khi cập nhật danh mục');
            }
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmDialog({ isOpen: true, type: 'deleteCategory', data: { id } });
    };

    return (
        <div className="mt-6 border-t pt-6">
            <h3 className="text-md font-semibold mb-3 text-neutral-dark">Quản lý chuyên mục Blog</h3>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isAdding && newCategoryName.trim() && handleAdd()}
                    placeholder="Tên danh mục mới"
                    className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <button
                    onClick={handleAdd}
                    disabled={isAdding || !newCategoryName.trim()}
                    className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
                >
                    {isAdding ? '...' : '+ Thêm'}
                </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {blogCategories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                        {editingCategory?.id === cat.id ? (
                            <input
                                type="text"
                                value={editingCategory.name}
                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                className="flex-grow px-2 py-1 border border-primary rounded-md text-sm"
                                autoFocus
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdate()}
                            />
                        ) : (<p className="text-sm flex-grow">{cat.name}</p>)}
                        <div className="flex gap-2">
                            {editingCategory?.id === cat.id ? (
                                <button onClick={handleUpdate} className="text-green-600 font-semibold text-sm hover:underline">Lưu</button>
                            ) : (<button onClick={() => setEditingCategory(cat)} className="text-blue-600 font-semibold text-sm hover:underline">Sửa</button>)}
                            <button onClick={() => handleDelete(cat.id)} className="text-red-600 font-semibold text-sm hover:underline">Xóa</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCategoryManager;
