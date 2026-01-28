import React, { useState, useMemo } from 'react';
import { useAdminPlatform } from '../contexts/AdminPlatformContext.tsx';

const AdminNotificationLog: React.FC = () => {
    const { notifications, markNotificationAsRead } = useAdminPlatform();
    const [searchEmail, setSearchEmail] = useState<string>('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => 
            searchEmail.trim() === '' || n.recipient_email.toLowerCase().includes(searchEmail.toLowerCase())
        );
    }, [notifications, searchEmail]);

    const handleToggleExpand = (id: string) => {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            markNotificationAsRead(id);
        }
        setExpandedId(prev => (prev === id ? null : id));
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Email Log (Simulated)</h2>
            
            <div className="mb-4">
                <input
                    type="text"
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    placeholder="Search by recipient email..."
                    className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                />
            </div>

            <div className="space-y-3">
                {filteredNotifications.map(notification => (
                    <div key={notification.id} className="border rounded-lg overflow-hidden">
                        <button 
                            onClick={() => handleToggleExpand(notification.id)}
                            className={`w-full text-left p-3 flex justify-between items-center ${notification.read ? 'bg-gray-50' : 'bg-blue-50 font-semibold'}`}
                        >
                            <div className="flex-1 truncate pr-4">
                                <span className="text-primary">{notification.recipient_email}</span>
                                <span className="text-neutral-dark"> - {notification.subject}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                                <span>{new Date(notification.sent_at).toLocaleString()}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedId === notification.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </button>
                        {expandedId === notification.id && (
                            <div className="p-4 bg-white border-t">
                                <h4 className="font-semibold text-sm mb-2">Email Body:</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{notification.body}</p>
                            </div>
                        )}
                    </div>
                ))}
                 {filteredNotifications.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No notifications found.</p>
                )}
            </div>
        </div>
    );
};

export default AdminNotificationLog;
