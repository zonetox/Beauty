
import React, { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { SupportTicket, TicketStatus, TicketReply } from '../types.ts';

const statusStyles: { [key in TicketStatus]: string } = {
    [TicketStatus.OPEN]: 'bg-red-100 text-red-800',
    [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TicketStatus.CLOSED]: 'bg-green-100 text-green-800',
};

const BusinessSupportCenter: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getTicketsForBusiness, addTicket, addReply } = useAdmin();
    
    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [newTicketSubject, setNewTicketSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [replyContent, setReplyContent] = useState('');

    if (!currentBusiness) return null;

    const myTickets = getTicketsForBusiness(currentBusiness.id);

    const handleCreateTicket = (e: React.FormEvent) => {
        e.preventDefault();
        addTicket({
            businessId: currentBusiness.id,
            businessName: currentBusiness.name,
            subject: newTicketSubject,
            message: newTicketMessage,
        });
        setNewTicketSubject('');
        setNewTicketMessage('');
        setView('list');
    };

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTicket && replyContent.trim()) {
            addReply(selectedTicket.id, { author: currentBusiness.name, content: replyContent });
            setSelectedTicket(prev => prev ? {...prev, replies: [...prev.replies, {id: '', author: currentBusiness.name, content: replyContent, createdAt: new Date().toISOString()}]} : null);
            setReplyContent('');
        }
    };

    const renderListView = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">My Support Tickets</h2>
                <button onClick={() => setView('create')} className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90">
                    + Create New Ticket
                </button>
            </div>
            <div className="space-y-3">
                {myTickets.map(ticket => (
                    <button key={ticket.id} onClick={() => { setSelectedTicket(ticket); setView('detail'); }} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-neutral-dark">{ticket.subject}</p>
                            <p className="text-xs text-gray-400">Last updated: {new Date(ticket.lastReplyAt).toLocaleString()}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[ticket.status]}`}>{ticket.status}</span>
                    </button>
                ))}
                {myTickets.length === 0 && <p className="text-center text-gray-500 py-8">You have no support tickets.</p>}
            </div>
        </div>
    );
    
    const renderCreateView = () => (
        <div>
            <button onClick={() => setView('list')} className="text-sm text-secondary font-semibold mb-4">&larr; Back to list</button>
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">Create a New Support Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input type="text" value={newTicketSubject} onChange={e => setNewTicketSubject(e.target.value)} required className="mt-1 w-full p-2 border rounded-md"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">How can we help?</label>
                    <textarea value={newTicketMessage} onChange={e => setNewTicketMessage(e.target.value)} rows={6} required className="mt-1 w-full p-2 border rounded-md"/>
                </div>
                <button type="submit" className="px-4 py-2 bg-primary text-white font-semibold rounded-md">Submit Ticket</button>
            </form>
        </div>
    );

    const renderDetailView = () => {
        if (!selectedTicket) return null;
        return (
            <div>
                <button onClick={() => setView('list')} className="text-sm text-secondary font-semibold mb-4">&larr; Back to list</button>
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold font-serif text-neutral-dark">{selectedTicket.subject}</h2>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[selectedTicket.status]}`}>{selectedTicket.status}</span>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                    <div className="p-3 bg-green-50 rounded-md">
                        <p className="text-sm font-semibold">{selectedTicket.businessName}</p>
                        <p className="text-sm text-gray-800 mt-1">{selectedTicket.message}</p>
                        <p className="text-xs text-gray-400 text-right mt-2">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedTicket.replies.map(reply => (
                        <div key={reply.id} className={`p-3 rounded-md ${reply.author === 'Admin' ? 'bg-blue-50' : 'bg-green-50'}`}>
                             <p className="text-sm font-semibold">{reply.author}</p>
                             <p className="text-sm text-gray-800 mt-1">{reply.content}</p>
                             <p className="text-xs text-gray-400 text-right mt-2">{new Date(reply.createdAt).toLocaleString()}</p>
                        </div>
                    ))}
                </div>
                {selectedTicket.status !== TicketStatus.CLOSED && (
                    <form onSubmit={handleReply} className="mt-6 pt-4 border-t">
                        <h3 className="font-semibold mb-2">Your Reply</h3>
                        <textarea value={replyContent} onChange={e => setReplyContent(e.target.value)} rows={4} className="w-full p-2 border rounded-md" required />
                        <button type="submit" className="mt-2 px-4 py-2 bg-primary text-white font-semibold rounded-md text-sm">Send Reply</button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="p-8">
            {view === 'list' && renderListView()}
            {view === 'create' && renderCreateView()}
            {view === 'detail' && renderDetailView()}
        </div>
    );
};

export default BusinessSupportCenter;
