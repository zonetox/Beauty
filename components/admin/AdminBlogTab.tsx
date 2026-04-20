import React from 'react';
import { BlogPost } from '../../types.ts';
import { useBlogData } from '../../contexts/BusinessDataContext.tsx';
import BlogManagementTable from '../BlogManagementTable.tsx';
import BlogBulkUpload from './BlogBulkUpload.tsx';
import AIBlogIdeaGenerator from './AIBlogIdeaGenerator.tsx';
import AdminCategoryManager from './AdminCategoryManager.tsx';

interface AdminBlogTabProps {
    onEdit: (post: BlogPost) => void;
    onDelete: (postId: number) => void;
    onAddNew: () => void;
    setConfirmDialog: (dialog: any) => void;
}

const AdminBlogTab: React.FC<AdminBlogTabProps> = ({
    onEdit,
    onDelete,
    onAddNew,
    setConfirmDialog
}) => {
    const { blogPosts, loading: blogLoading, updateBlogPost } = useBlogData();

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Blog Management</h2>
                <button
                    onClick={onAddNew}
                    className="bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-primary-dark transition-colors"
                >
                    + Add New Post
                </button>
            </div>

            {blogLoading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <BlogManagementTable
                    posts={blogPosts}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdate={updateBlogPost}
                />
            )}

            <AIBlogIdeaGenerator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <BlogBulkUpload />
                <AdminCategoryManager setConfirmDialog={setConfirmDialog} />
            </div>
        </div>
    );
};

export default AdminBlogTab;
