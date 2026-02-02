import React, { useState, useMemo } from 'react';
import { useAdminPlatform } from '../contexts/AdminPlatformContext.tsx';
import { useAdminAuth } from '../contexts/AdminContext.tsx';

const AdminActivityLog: React.FC = () => {
    const { logs, clearLogs } = useAdminPlatform();
    const { adminUsers } = useAdminAuth();
    const [selectedAdmin, setSelectedAdmin] = useState<string>('all');
    const [searchAction, setSearchAction] = useState<string>('');

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesAdmin = selectedAdmin === 'all' || log.admin_username === selectedAdmin;
            const matchesAction = searchAction.trim() === '' || log.action.toLowerCase().includes(searchAction.toLowerCase());
            return matchesAdmin && matchesAction;
        });
    }, [logs, selectedAdmin, searchAction]);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Admin Activity Log</h2>

            <div className="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-gray-50 rounded-md border">
                <div className="flex-1">
                    <label htmlFor="admin-filter" className="block text-sm font-medium text-gray-700">Filter by Admin</label>
                    <select
                        id="admin-filter"
                        value={selectedAdmin}
                        onChange={e => setSelectedAdmin(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm"
                    >
                        <option value="all">All Admins</option>
                        {adminUsers.map(user => (
                            <option key={user.id} value={user.admin_username}>{user.admin_username}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label htmlFor="action-search" className="block text-sm font-medium text-gray-700">Search by Action Type</label>
                    <input
                        id="action-search"
                        type="text"
                        value={searchAction}
                        onChange={e => setSearchAction(e.target.value)}
                        placeholder="e.g., 'Confirm Payment', 'Lock User'"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>
                <div className="self-end">
                    <button
                        onClick={clearLogs}
                        className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors text-sm"
                    >
                        Clear Log
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">Admin</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 font-medium">{log.admin_username}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">{log.action}</span>
                                </td>
                                <td className="px-6 py-4">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLogs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No activity logs found matching your criteria.</p>
                )}
            </div>
        </div>
    );
};

export default AdminActivityLog;
