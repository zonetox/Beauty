// C3.9 - Booking Management (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useBookingData } from '../contexts/BusinessContext.tsx';
import { AppointmentStatus, Appointment } from '../types.ts';
import BookingCalendarView from './BookingCalendarView.tsx';
import AIQuickReplyModal from './AIQuickReplyModal.tsx';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

const StatCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
    <div className="bg-gray-50 p-4 rounded-lg border">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-neutral-dark">{value}</p>
    </div>
);

const statusStyles: { [key in AppointmentStatus]: string } = {
    [AppointmentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [AppointmentStatus.CONFIRMED]: 'bg-blue-100 text-blue-800',
    [AppointmentStatus.CANCELLED]: 'bg-red-100 text-red-800',
    [AppointmentStatus.COMPLETED]: 'bg-green-100 text-green-800',
};

const BookingsManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getAppointmentsForBusiness, updateAppointmentStatus, loading } = useBookingData();
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [replyingAppointment, setReplyingAppointment] = useState<{ appointment: Appointment, context: 'confirm' | 'cancel' | 'suggest_reschedule' } | null>(null);

    // Move hooks before early return to follow Rules of Hooks
    const allAppointments = useMemo(() => {
        if (!currentBusiness) return [];
        return getAppointmentsForBusiness(currentBusiness.id);
    }, [currentBusiness, getAppointmentsForBusiness]);

    // Apply status filter
    const appointments = useMemo(() => {
        if (!allAppointments.length) return [];
        if (statusFilter === 'all') return allAppointments;
        return allAppointments.filter(a => a.status === statusFilter);
    }, [allAppointments, statusFilter]);

    const stats = useMemo(() => {
        if (!allAppointments.length) return { total: 0, confirmed: 0, pending: 0, cancelled: 0, upcoming: 0, today: 0, completed: 0 };
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        return {
            pending: allAppointments.filter(a => a?.status === AppointmentStatus.PENDING).length,
            upcoming: allAppointments.filter(a => a?.status === AppointmentStatus.CONFIRMED && new Date(a?.date ?? '') >= now).length,
            today: allAppointments.filter(a => a?.status === AppointmentStatus.CONFIRMED && a?.date === todayStr).length,
            completed: allAppointments.filter(a => a?.status === AppointmentStatus.COMPLETED).length,
            cancelled: allAppointments.filter(a => a?.status === AppointmentStatus.CANCELLED).length,
        }
    }, [allAppointments]);

    const upcomingAppointments = useMemo(() => {
        if (!appointments.length) return [];
        return appointments.filter(a => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED);
    }, [appointments]);

    const pastAppointments = useMemo(() => {
        if (!appointments.length) return [];
        return appointments.filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED);
    }, [appointments]);

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage appointments."
                />
            </div>
        );
    }

    const handleUpdateStatus = async (appointmentId: string, status: AppointmentStatus) => {
        setUpdatingId(appointmentId);
        try {
            await updateAppointmentStatus(appointmentId, status);
            const statusLabels: Record<AppointmentStatus, string> = {
                [AppointmentStatus.PENDING]: 'pending',
                [AppointmentStatus.CONFIRMED]: 'confirmed',
                [AppointmentStatus.CANCELLED]: 'cancelled',
                [AppointmentStatus.COMPLETED]: 'completed',
            };
            toast.success(`Appointment ${statusLabels[status]} successfully!`);
        } catch (error) {
            // Error already handled in context with toast
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading appointments..." />
            </div>
        );
    }

    const AppointmentTable: React.FC<{ title: string; data: Appointment[] }> = ({ title, data }) => (
        <div>
            <h3 className="text-xl font-semibold text-neutral-dark mb-4">{title}</h3>
            {data.length > 0 ? (
                <div className="overflow-x-auto border rounded-lg bg-white">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Service</th>
                                <th className="px-6 py-3">Date & Time</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(appt => (
                                <tr key={appt.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-neutral-dark">
                                        {appt.customerName}
                                        <p className="font-normal text-xs text-gray-500">{appt.customerPhone}</p>
                                        {appt.customerEmail && (
                                            <p className="font-normal text-xs text-gray-500">{appt.customerEmail}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{appt.serviceName}</td>
                                    <td className="px-6 py-4">
                                        {new Date(`${appt.date}T${appt.timeSlot}`).toLocaleString('vi-VN', {
                                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[appt.status]}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {updatingId === appt.id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-xs text-gray-500">Updating...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {appt.status === AppointmentStatus.PENDING && (
                                                    <div className="flex gap-2 items-center flex-wrap">
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CONFIRMED)}
                                                            className="text-xs font-semibold text-white bg-green-600 px-2 py-1 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={updatingId !== null}
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CANCELLED)}
                                                            className="text-xs font-semibold text-white bg-red-600 px-2 py-1 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={updatingId !== null}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => setReplyingAppointment({ appointment: appt, context: 'confirm' })}
                                                            className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={updatingId !== null}
                                                        >
                                                            Quick Reply
                                                        </button>
                                                    </div>
                                                )}
                                                {appt.status === AppointmentStatus.CONFIRMED && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.COMPLETED)}
                                                            className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={updatingId !== null}
                                                        >
                                                            Complete
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(appt.id, AppointmentStatus.CANCELLED)}
                                                            className="text-xs font-semibold text-gray-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={updatingId !== null}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                                {(appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED) && (
                                                    <span className="text-xs text-gray-400 italic">No actions</span>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <EmptyState
                    title="No appointments"
                    message={`No appointments found in this category.`}
                />
            )}
        </div>
    );

    return (
        <div className="p-8">
            {replyingAppointment && (
                <AIQuickReplyModal
                    isOpen={!!replyingAppointment}
                    onClose={() => setReplyingAppointment(null)}
                    appointment={replyingAppointment.appointment}
                    context={replyingAppointment.context}
                />
            )}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">Bookings Management</h2>
                <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                    <button
                        onClick={() => setView('list')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        List View
                    </button>
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'calendar' ? 'bg-white shadow' : 'text-gray-600 hover:text-gray-800'
                            }`}
                    >
                        Calendar View
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
                <StatCard title="Pending" value={stats.pending} />
                <StatCard title="Upcoming" value={stats.upcoming} />
                <StatCard title="Today" value={stats.today} />
                <StatCard title="Completed" value={stats.completed} />
                <StatCard title="Cancelled" value={stats.cancelled} />
            </div>

            {/* Filters */}
            {allAppointments.length > 0 && (
                <div className="mb-6">
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
                    <select
                        id="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    >
                        <option value="all">All</option>
                        <option value={AppointmentStatus.PENDING}>Pending</option>
                        <option value={AppointmentStatus.CONFIRMED}>Confirmed</option>
                        <option value={AppointmentStatus.COMPLETED}>Completed</option>
                        <option value={AppointmentStatus.CANCELLED}>Cancelled</option>
                    </select>
                </div>
            )}

            {allAppointments.length === 0 ? (
                <EmptyState
                    title="No appointments yet"
                    message="Appointments from customers will appear here. Share your booking link to get started!"
                />
            ) : view === 'list' ? (
                <div className="space-y-10">
                    <AppointmentTable title="Upcoming & Pending Appointments" data={upcomingAppointments} />
                    <AppointmentTable title="Past Appointments" data={pastAppointments} />
                </div>
            ) : (
                <BookingCalendarView
                    appointments={appointments}
                    onUpdateStatus={handleUpdateStatus}
                    onQuickReply={(appt, context) => setReplyingAppointment({ appointment: appt, context })}
                />
            )}
        </div>
    );
};

export default BookingsManager;
