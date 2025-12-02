
import React, { useMemo, useState } from 'react';
import { useBusinessAuth, useBookingData } from '../contexts/BusinessContext.tsx';
import { AppointmentStatus, Appointment } from '../types.ts';
import BookingCalendarView from './BookingCalendarView.tsx';
import AIQuickReplyModal from './AIQuickReplyModal.tsx';

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
    const { getAppointmentsForBusiness, updateAppointmentStatus } = useBookingData();
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [replyingAppointment, setReplyingAppointment] = useState<{appointment: Appointment, context: 'confirm' | 'cancel' | 'suggest_reschedule'} | null>(null);

    if (!currentBusiness) return null;

    const appointments = getAppointmentsForBusiness(currentBusiness.id);

    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        return {
            pending: appointments.filter(a => a.status === AppointmentStatus.PENDING).length,
            upcoming: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED && new Date(a.date) >= now).length,
            today: appointments.filter(a => a.status === AppointmentStatus.CONFIRMED && a.date === todayStr).length
        }
    }, [appointments]);

    const upcomingAppointments = useMemo(() => {
        return appointments.filter(a => a.status === AppointmentStatus.PENDING || a.status === AppointmentStatus.CONFIRMED);
    }, [appointments]);
    
    const pastAppointments = useMemo(() => {
         return appointments.filter(a => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CANCELLED);
    }, [appointments]);


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
                                        {appt.status === AppointmentStatus.PENDING && (
                                            <div className="flex gap-2 items-center">
                                                <button onClick={() => updateAppointmentStatus(appt.id, AppointmentStatus.CONFIRMED)} className="text-xs font-semibold text-white bg-green-600 px-2 py-1 rounded-md hover:bg-green-700">Confirm</button>
                                                <button onClick={() => updateAppointmentStatus(appt.id, AppointmentStatus.CANCELLED)} className="text-xs font-semibold text-white bg-red-600 px-2 py-1 rounded-md hover:bg-red-700">Cancel</button>
                                                <button onClick={() => setReplyingAppointment({appointment: appt, context: 'confirm'})} className="text-xs font-semibold text-blue-600 hover:underline">Quick Reply</button>
                                            </div>
                                        )}
                                        {appt.status === AppointmentStatus.CONFIRMED && (
                                            <div className="flex gap-2">
                                                <button onClick={() => updateAppointmentStatus(appt.id, AppointmentStatus.COMPLETED)} className="text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-700">Complete</button>
                                                <button onClick={() => updateAppointmentStatus(appt.id, AppointmentStatus.CANCELLED)} className="text-xs font-semibold text-gray-600 hover:underline">Cancel</button>
                                            </div>
                                        )}
                                         {(appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED) && (
                                             <span className="text-xs text-gray-400 italic">No actions</span>
                                         )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">No appointments in this category.</p>}
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
                    <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'list' ? 'bg-white shadow' : 'text-gray-600'}`}>List View</button>
                    <button onClick={() => setView('calendar')} className={`px-3 py-1 text-sm font-semibold rounded-md ${view === 'calendar' ? 'bg-white shadow' : 'text-gray-600'}`}>Calendar View</button>
                </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Pending Appointments" value={stats.pending} />
                <StatCard title="Upcoming Appointments" value={stats.upcoming} />
                <StatCard title="Appointments Today" value={stats.today} />
            </div>

            {view === 'list' ? (
                <div className="space-y-10">
                    <AppointmentTable title="Upcoming & Pending Appointments" data={upcomingAppointments} />
                    <AppointmentTable title="Past Appointments" data={pastAppointments} />
                </div>
            ) : (
                <BookingCalendarView 
                    appointments={appointments} 
                    onUpdateStatus={updateAppointmentStatus} 
                    onQuickReply={(appt, context) => setReplyingAppointment({appointment: appt, context})}
                />
            )}
        </div>
    );
};

export default BookingsManager;
