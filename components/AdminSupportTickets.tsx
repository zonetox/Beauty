import React, { useState, useMemo } from 'react';
import { useAdminPlatform } from '../contexts/AdminPlatformContext.tsx';
import { SupportTicket, TicketStatus } from '../types.ts';

const statusStyles: { [key in TicketStatus]: string } = {
    [TicketStatus.OPEN]: 'bg-red-100 text-red-800',
    [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TicketStatus.CLOSED]: 'bg-green-100 text-green-800',
};

const TicketDetailModal: React.FC<{ ticket: SupportTicket; onClose: () => void; onReply: (ticketId: string, content: string) => void; onStatusChange: (ticketId: string, status: TicketStatus) => void; }> = ({ ticket, onClose, onReply, onStatusChange }) => {
    const [replyContent, setReplyContent] = useState('');

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        onReply(ticket.id, replyContent);
        setReplyContent('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-dark">{ticket.subject}</h3>
                        <p className="text-sm text-gray-500">From: {ticket.businessName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </header>
                <main className="p-6 overflow-y-auto space-y-4">
                    <div className="p-3 bg-gray-100 rounded-md">
                        <p className="text-sm text-gray-800">{ticket.message}</p>
                        <p className="text-xs text-gray-400 text-right mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>
                    {ticket.replies.map(reply => (
                        <div key={reply.id} className={`p-3 rounded-md ${reply.author === 'Admin' ? 'bg-blue-50' : 'bg-green-50'}`}>
                            <p className="text-sm font-semibold">{reply.author}</p>
                            <p className="text-sm text-gray-800 mt-1">{reply.content}</p>
                            <p className="text-xs text-gray-400 text-right mt-2">{new Date(reply.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </main>
                <footer className="p-4 border-t bg-gray-50 space-y-3">
                    <form onSubmit={handleReplySubmit}>
                        <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={3} className="w-full p-2 border rounded-md" placeholder="Type your reply..." required />
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="status-select" className="text-sm font-medium">Status:</label>
                                <select id="status-select" title="Ticket Status" value={ticket.status} onChange={e => onStatusChange(ticket.id, e.target.value as TicketStatus)} className="p-1 border rounded-md text-sm">
                                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md text-sm">Send Reply</button>
                        </div>
                    </form>
                </footer>
            </div>
        </div>
    );
};


const AdminSupportTickets: React.FC = () => {
    const { tickets, addReply, updateTicketStatus } = useAdminPlatform();
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    const filteredTickets = useMemo(() => {
        if (statusFilter === 'all') return tickets;
        return tickets.filter(t => t.status === statusFilter);
    }, [tickets, statusFilter]);

    const handleReply = (ticketId: string, content: string) => {
        addReply(ticketId, { author: 'Admin', content });
        setSelectedTicket(prev => prev ? { ...prev, replies: [...prev.replies, { id: '', author: 'Admin', content, createdAt: new Date().toISOString() }] } : null);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onReply={handleReply}
                    onStatusChange={updateTicketStatus}
                />
            )}

            <h2 className="text-xl font-semibold text-neutral-dark mb-4">Support Tickets</h2>
            <div className="mb-4">
                <label htmlFor="status-filter-select" className="text-sm font-medium">Filter by status: </label>
                <select id="status-filter-select" title="Filter tickets by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border rounded-md bg-gray-50">
                    <option value="all">All</option>
                    {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Subject</th>
                            <th className="px-6 py-3">Business</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Last Updated</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map(ticket => (
                            <tr key={ticket.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-neutral-dark">{ticket.subject}</td>
                                <td className="px-6 py-4">{ticket.businessName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[ticket.status]}`}>{ticket.status}</span>
                                </td>
                                <td className="px-6 py-4">{new Date(ticket.lastReplyAt).toLocaleString()}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => setSelectedTicket(ticket)} className="font-medium text-secondary hover:underline">
                                        View & Reply
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredTickets.length === 0 && <p className="text-center text-gray-500 py-8">No tickets found.</p>}
            </div>
        </div>
    );
};

export default AdminSupportTickets;
