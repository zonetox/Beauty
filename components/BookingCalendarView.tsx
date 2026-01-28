import React, { useState, useMemo } from 'react';
import { Appointment, AppointmentStatus } from '../types.ts';

// Props would include appointments, and functions to update them
interface BookingCalendarViewProps {
    appointments: Appointment[];
    onUpdateStatus: (appointmentId: string, status: AppointmentStatus) => void;
    onQuickReply: (appointment: Appointment, context: 'confirm' | 'cancel') => void;
}

const statusStyles: { [key in AppointmentStatus]: string } = {
    [AppointmentStatus.PENDING]: 'bg-yellow-400',
    [AppointmentStatus.CONFIRMED]: 'bg-blue-400',
    [AppointmentStatus.COMPLETED]: 'bg-green-400',
    [AppointmentStatus.CANCELLED]: 'bg-red-400',
};

const BookingCalendarView: React.FC<BookingCalendarViewProps> = ({ appointments, onUpdateStatus, onQuickReply }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const { firstDayOfMonth, daysInMonth, month, year } = useMemo(() => {
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const month = currentDate.toLocaleString('default', { month: 'long' });
        const year = currentDate.getFullYear();
        return { firstDayOfMonth, daysInMonth, month, year };
    }, [currentDate]);

    const appointmentsByDate = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        appointments.forEach(appt => {
            const date = new Date(appt.date);
            // Adjust for timezone differences by creating date string from UTC parts
            const dateKey = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()).toDateString();
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(appt);
        });
        return map;
    }, [appointments]);
    
    const selectedDateAppointments = appointmentsByDate.get(selectedDate.toDateString()) || [];

    const changeMonth = (delta: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + delta);
            return newDate;
        });
    };

    const calendarCells = [];
    // Add blank cells for the start of the month
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        calendarCells.push(<div key={`empty-${i}`} className="border-r border-b"></div>);
    }
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, currentDate.getMonth(), day);
        const dateKey = date.toDateString();
        const dailyAppointments = appointmentsByDate.get(dateKey) || [];
        const isSelected = dateKey === selectedDate.toDateString();

        calendarCells.push(
            <div key={day} onClick={() => setSelectedDate(date)} className={`border-r border-b p-2 cursor-pointer transition-colors ${isSelected ? 'bg-primary/20' : 'hover:bg-gray-50'}`}>
                <div className="font-semibold">{day}</div>
                <div className="mt-1 space-y-1">
                    {dailyAppointments.slice(0, 2).map(appt => (
                         <div key={appt.id} className={`h-2 w-full rounded ${statusStyles[appt.status]}`} title={`${appt.timeSlot} - ${appt.customerName}`}></div>
                    ))}
                    {dailyAppointments.length > 2 && <div className="text-xs text-gray-500">+ {dailyAppointments.length - 2} more</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{month} {year}</h3>
                    <div className="flex gap-2">
                        <button onClick={() => changeMonth(-1)} className="px-3 py-1 border rounded-md hover:bg-gray-100">&larr;</button>
                        <button onClick={() => changeMonth(1)} className="px-3 py-1 border rounded-md hover:bg-gray-100">&rarr;</button>
                    </div>
                </div>
                <div className="grid grid-cols-7 border-t border-l bg-white">
                    {daysOfWeek.map(day => <div key={day} className="text-center font-bold border-r border-b py-2 text-sm">{day}</div>)}
                    {calendarCells}
                </div>
            </div>
            <div className="lg:col-span-1">
                <h3 className="text-xl font-bold mb-4">Appointments for {selectedDate.toLocaleDateString('vi-VN')}</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {selectedDateAppointments.length > 0 ? selectedDateAppointments.map(appt => (
                        <div key={appt.id} className="p-3 border rounded-lg bg-white shadow-sm">
                            <p className="font-bold">{appt.timeSlot} - {appt.serviceName}</p>
                            <p className="text-sm text-gray-600">{appt.customerName}</p>
                            <div className="mt-2 flex justify-between items-center">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[appt.status]}`}>{appt.status}</span>
                                {appt.status === AppointmentStatus.PENDING && (
                                     <div className="flex items-center gap-2">
                                        <button onClick={() => onUpdateStatus(appt.id, AppointmentStatus.CONFIRMED)} className="text-xs font-semibold text-green-600 hover:underline">Confirm</button>
                                        <button onClick={() => onQuickReply(appt, 'confirm')} className="text-xs font-semibold text-blue-600 hover:underline">Reply</button>
                                     </div>
                                )}
                            </div>
                        </div>
                    )) : <p className="text-gray-500 text-center pt-8">No appointments on this day.</p>}
                </div>
            </div>
        </div>
    );
};
export default BookingCalendarView;
