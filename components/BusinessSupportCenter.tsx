// C3.12 - Support (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { useBusinessAuth } from '../contexts/BusinessContext.tsx';
import { SupportTicket, TicketStatus } from '../types.ts';
import EmptyState from './EmptyState.tsx';

const statusStyles: { [key in TicketStatus]: string } = {
    [TicketStatus.OPEN]: 'bg-red-100 text-red-800',
    [TicketStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
    [TicketStatus.CLOSED]: 'bg-green-100 text-green-800',
};

const BusinessSupportCenter: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getTicketsForBusiness, addTicket, addReply, tickets } = useAdmin();

    const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [newTicketSubject, setNewTicketSubject] = useState('');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ subject?: string; message?: string; reply?: string }>({});

    // Always call hooks, but return early in JSX
    const myTickets = useMemo(() => {
        if (!currentBusiness) return [];
        const filtered = getTicketsForBusiness(currentBusiness.id);
        if (statusFilter === 'all') return filtered;
        return filtered.filter(t => t.status === statusFilter);
    }, [getTicketsForBusiness, currentBusiness, statusFilter, tickets]);

    const sortedTickets = useMemo(() => {
        return [...myTickets].sort((a, b) => {
            const dateA = new Date(a.lastReplyAt || a.createdAt).getTime();
            const dateB = new Date(b.lastReplyAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [myTickets]);

    // Refresh selected ticket from context when tickets update
    useEffect(() => {
        if (selectedTicket && view === 'detail') {
            const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
            if (updatedTicket) {
                setSelectedTicket(updatedTicket);
            }
        }
    }, [tickets, selectedTicket, view]);

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage support tickets."
                />
            </div>
        );
    }

    const validateTicket = (): boolean => {
        const newErrors: { subject?: string; message?: string } = {};

        if (!newTicketSubject.trim()) {
            newErrors.subject = 'Subject is required';
        } else if (newTicketSubject.trim().length < 5) {
            newErrors.subject = 'Subject must be at least 5 characters';
        } else if (newTicketSubject.trim().length > 200) {
            newErrors.subject = 'Subject must be less than 200 characters';
        }

        if (!newTicketMessage.trim()) {
            newErrors.message = 'Message is required';
        } else if (newTicketMessage.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters';
        } else if (newTicketMessage.trim().length > 5000) {
            newErrors.message = 'Message must be less than 5000 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateReply = (): boolean => {
        if (!replyContent.trim()) {
            setErrors(prev => ({ ...prev, reply: 'Reply cannot be empty' }));
            return false;
        }
        if (replyContent.trim().length < 5) {
            setErrors(prev => ({ ...prev, reply: 'Reply must be at least 5 characters' }));
            return false;
        }
        if (replyContent.trim().length > 5000) {
            setErrors(prev => ({ ...prev, reply: 'Reply must be less than 5000 characters' }));
            return false;
        }
        setErrors(prev => ({ ...prev, reply: undefined }));
        return true;
    };

    const handleCreateTicket = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateTicket()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        setIsSubmitting(true);
        try {
            await addTicket({
                businessId: currentBusiness.id,
                businessName: currentBusiness.name,
                subject: newTicketSubject.trim(),
                message: newTicketMessage.trim(),
            });
            toast.success('Support ticket created successfully!');
            setNewTicketSubject('');
            setNewTicketMessage('');
            setErrors({});
            setView('list');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create ticket';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTicket) return;

        if (!validateReply()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await addReply(selectedTicket.id, {
                author: currentBusiness.name,
                content: replyContent.trim(),
            });
            toast.success('Reply sent successfully!');
            setReplyContent('');
            setErrors(prev => ({ ...prev, reply: undefined }));
            // Refresh selected ticket from updated tickets list
            const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
            if (updatedTicket) {
                setSelectedTicket(updatedTicket);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send reply';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const renderListView = () => (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">My Support Tickets</h2>
                <div className="flex gap-3">
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                        title="Lọc theo trạng thái ticket"
                        className="px-3 py-2 border rounded-md bg-white text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value={TicketStatus.OPEN}>Open</option>
                        <option value={TicketStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TicketStatus.CLOSED}>Closed</option>
                    </select>
                    <button
                        onClick={() => setView('create')}
                        className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        + Create New Ticket
                    </button>
                </div>
            </div>

            {sortedTickets.length === 0 ? (
                <EmptyState
                    title={statusFilter === 'all' ? "No support tickets" : `No ${statusFilter} tickets`}
                    message={statusFilter === 'all' ? "You haven't created any support tickets yet. Click 'Create New Ticket' to get started." : "Try selecting a different status filter."}
                />
            ) : (
                <div className="space-y-3">
                    {sortedTickets.map(ticket => (
                        <button
                            key={ticket.id}
                            onClick={() => {
                                setSelectedTicket(ticket);
                                setView('detail');
                            }}
                            className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-neutral-dark truncate">{ticket.subject}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {ticket.replies.length > 0 ? (
                                        <>
                                            {ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'} •
                                        </>
                                    ) : null}
                                    {' '}Last updated: {formatDate(ticket.lastReplyAt || ticket.createdAt)}
                                </p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${statusStyles[ticket.status]}`}>
                                {ticket.status}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCreateView = () => (
        <div>
            <button
                onClick={() => {
                    setView('list');
                    setErrors({});
                    setNewTicketSubject('');
                    setNewTicketMessage('');
                }}
                className="text-sm text-secondary font-semibold mb-4 hover:underline"
                disabled={isSubmitting}
            >
                &larr; Back to list
            </button>
            <h2 className="text-2xl font-bold font-serif text-neutral-dark mb-6">Create a New Support Ticket</h2>
            <form onSubmit={handleCreateTicket} className="space-y-4 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={newTicketSubject}
                        onChange={(e) => {
                            setNewTicketSubject(e.target.value);
                            if (errors.subject) setErrors(prev => ({ ...prev, subject: undefined }));
                        }}
                        className={`mt-1 w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent ${errors.subject ? 'border-red-500' : ''
                            }`}
                        placeholder="Brief description of your issue"
                        maxLength={200}
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {errors.subject && (
                            <p className="text-xs text-red-500">{errors.subject}</p>
                        )}
                        <p className="text-xs text-gray-500 ml-auto">
                            {newTicketSubject.length}/200
                        </p>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        How can we help? <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={newTicketMessage}
                        onChange={(e) => {
                            setNewTicketMessage(e.target.value);
                            if (errors.message) setErrors(prev => ({ ...prev, message: undefined }));
                        }}
                        rows={8}
                        className={`mt-1 w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-y ${errors.message ? 'border-red-500' : ''
                            }`}
                        placeholder="Please provide as much detail as possible about your issue..."
                        maxLength={5000}
                        disabled={isSubmitting}
                    />
                    <div className="flex justify-between items-center mt-1">
                        {errors.message && (
                            <p className="text-xs text-red-500">{errors.message}</p>
                        )}
                        <p className="text-xs text-gray-500 ml-auto">
                            {newTicketMessage.length}/5000
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Submitting...
                            </>
                        ) : (
                            'Submit Ticket'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setView('list');
                            setErrors({});
                            setNewTicketSubject('');
                            setNewTicketMessage('');
                        }}
                        className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );

    // Refresh selected ticket from context when tickets update

    const renderDetailView = () => {
        if (!selectedTicket) {
            return (
                <div className="p-8">
                    <EmptyState
                        title="Ticket not found"
                        message="The selected ticket could not be found."
                    />
                </div>
            );
        }

        return (
            <div>
                <button
                    onClick={() => {
                        setView('list');
                        setSelectedTicket(null);
                        setReplyContent('');
                        setErrors({});
                    }}
                    className="text-sm text-secondary font-semibold mb-4 hover:underline"
                    disabled={isSubmitting}
                >
                    &larr; Back to list
                </button>
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold font-serif text-neutral-dark">{selectedTicket.subject}</h2>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusStyles[selectedTicket.status]}`}>
                        {selectedTicket.status}
                    </span>
                </div>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-4 mb-6">
                    <div className="p-4 bg-green-50 rounded-md border border-green-200">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-semibold text-green-800">{selectedTicket.businessName}</p>
                            <p className="text-xs text-gray-500">{formatDate(selectedTicket.createdAt)}</p>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                    {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                        <>
                            {selectedTicket.replies.map((reply, index) => (
                                <div
                                    key={reply.id || index}
                                    className={`p-4 rounded-md border ${reply.author === 'Admin' || reply.author.toLowerCase().includes('admin')
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-green-50 border-green-200'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-semibold">
                                            {reply.author === 'Admin' || reply.author.toLowerCase().includes('admin') ? (
                                                <span className="text-blue-800">Admin</span>
                                            ) : (
                                                <span className="text-green-800">{reply.author}</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                                    </div>
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                            ))}
                        </>
                    )}
                </div>
                {selectedTicket.status !== TicketStatus.CLOSED && (
                    <form onSubmit={handleReply} className="mt-6 pt-4 border-t">
                        <h3 className="font-semibold mb-2">Your Reply</h3>
                        <textarea
                            value={replyContent}
                            onChange={(e) => {
                                setReplyContent(e.target.value);
                                if (errors.reply) setErrors(prev => ({ ...prev, reply: undefined }));
                            }}
                            rows={4}
                            className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-y ${errors.reply ? 'border-red-500' : ''
                                }`}
                            placeholder="Type your reply here..."
                            maxLength={5000}
                            disabled={isSubmitting}
                        />
                        <div className="flex justify-between items-center mt-1 mb-3">
                            {errors.reply && (
                                <p className="text-xs text-red-500">{errors.reply}</p>
                            )}
                            <p className="text-xs text-gray-500 ml-auto">
                                {replyContent.length}/5000
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-md text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Sending...
                                </>
                            ) : (
                                'Send Reply'
                            )}
                        </button>
                    </form>
                )}
                {selectedTicket.status === TicketStatus.CLOSED && (
                    <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm text-gray-600">
                        This ticket is closed. You cannot reply to closed tickets. If you need further assistance, please create a new ticket.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-8">
            {view === 'list' && renderListView()}
            {view === 'create' && renderCreateView()}
            {view === 'detail' && renderDetailView()}
        </div>
    );
};

export default BusinessSupportCenter;
