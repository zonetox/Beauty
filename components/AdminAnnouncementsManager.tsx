import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAdminPlatform } from '../contexts/AdminPlatformContext.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';

const AdminAnnouncementsManager: React.FC = () => {
    const { announcements, addAnnouncement, deleteAnnouncement } = useAdminPlatform();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success'>('info');
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; announcementId: string | null }>({ isOpen: false, announcementId: null });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required.');
            return;
        }
        addAnnouncement(title, content, type);
        toast.success('Announcement sent successfully!');
        setTitle('');
        setContent('');
        setType('info');
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-neutral-dark mb-4">Create New Announcement</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Content</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            rows={4}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value as any)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
                        >
                            <option value="info">Info (Blue)</option>
                            <option value="success">Success (Green)</option>
                            <option value="warning">Warning (Yellow)</option>
                        </select>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">
                            Send Announcement
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                 <h2 className="text-xl font-semibold text-neutral-dark mb-4">Sent Announcements</h2>
                 <div className="space-y-4">
                    {announcements.map(ann => (
                        <div key={ann.id} className="p-4 border rounded-md bg-gray-50 flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-neutral-dark">{ann.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Sent on {new Date(ann.created_at).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={() => setConfirmDelete({ isOpen: true, announcementId: ann.id })}
                                className="text-red-500 hover:text-red-700 font-semibold text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                    {announcements.length === 0 && <p className="text-center text-gray-500 py-4">No announcements sent yet.</p>}
                 </div>
            </div>
            <ConfirmDialog
                isOpen={confirmDelete.isOpen}
                title="Delete Announcement"
                message={confirmDelete.announcementId ? `Are you sure you want to delete this announcement?` : ''}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => {
                  if (confirmDelete.announcementId) {
                    deleteAnnouncement(confirmDelete.announcementId);
                    setConfirmDelete({ isOpen: false, announcementId: null });
                  }
                }}
                onCancel={() => setConfirmDelete({ isOpen: false, announcementId: null })}
            />
        </div>
    );
};

export default AdminAnnouncementsManager;
