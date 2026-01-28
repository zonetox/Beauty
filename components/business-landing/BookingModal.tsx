
import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Business, AppointmentStatus } from '../../types.ts';
import { useBookingData } from '../../contexts/BusinessContext.tsx';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { trackConversion } from '../../lib/usePageTracking.ts';
import { ensureString, ensureNumber, ensureArray } from '../../lib/typeHelpers.ts';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    business: Business;
}

// Move StepIndicator outside component to avoid creating it during render
const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
    <div className="flex justify-center items-center mb-4">
        {Array.from({ length: total }, (_, i) => i + 1).map(num => (
            <React.Fragment key={num}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${num <= current ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {num}
                </div>
                {num < total && <div className={`flex-1 h-1 ${num < current ? 'bg-primary' : 'bg-gray-200'}`} />}
            </React.Fragment>
        ))}
    </div>
);

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, business }) => {
    const { appointments, addAppointment } = useBookingData();
    const { user: currentUser } = useAuth();

    const [step, setStep] = useState(1);
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [customerInfo, setCustomerInfo] = useState({
        name: currentUser?.user_metadata?.full_name || '',
        email: currentUser?.email || '',
        phone: '',
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedService = useMemo(() => {
        return ensureArray(business?.services).find(s => s?.id === selectedServiceId);
    }, [selectedServiceId, business?.services]);

    const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCustomerInfo(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleBookingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedService || !selectedDate || !selectedTime) return;

        setIsSubmitting(true);

        const dateStr = selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : (selectedDate ?? '');
        if (!dateStr) {
            setIsSubmitting(false);
            toast.error('Please select a valid date');
            return;
        }

        const newAppointment = {
            business_id: business.id,
            service_id: selectedService.id,
            service_name: selectedService.name,
            customer_name: ensureString(customerInfo.name),
            customer_email: ensureString(customerInfo.email),
            customer_phone: ensureString(customerInfo.phone),
            date: dateStr,
            time_slot: ensureString(selectedTime),
            status: AppointmentStatus.PENDING,
            notes: ensureString(customerInfo.notes)
        };

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1000));

        addAppointment(newAppointment);

        // Track conversion
        trackConversion('booking', business.id, 'landing_page', {
            service_id: selectedService.id,
            service_name: selectedService.name,
            date: dateStr,
            time_slot: ensureString(selectedTime),
        }, currentUser?.id);

        setIsSubmitting(false);
        setStep(4); // Move to confirmation step
    };

    // --- Time Slot Generation Logic ---
    const generateTimeSlots = (date: Date): string[] => {
        if (!selectedService) return [];

        const serviceDuration = ensureNumber(selectedService?.duration_minutes, 60);
        const slots: string[] = [];
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

        const working_hoursEntry = Object.entries(business?.working_hours || {}).find(([day]) =>
            day.toLowerCase().includes(dayOfWeek.toLowerCase())
        );

        let startTime: string, endTime: string;
        if (working_hoursEntry) {
            const hours = working_hoursEntry[1];
            if (typeof hours === 'object' && hours !== null && 'open' in hours && 'close' in hours) {
                startTime = ensureString(hours.open, '09:00');
                endTime = ensureString(hours.close, '18:00');
            } else if (typeof hours === 'string') {
                const parts = hours.split(' - ').map(s => s.trim());
                startTime = ensureString(parts[0], '09:00');
                endTime = ensureString(parts[1], '18:00');
            } else {
                startTime = '09:00';
                endTime = '18:00';
            }
        } else {
            startTime = '09:00';
            endTime = '18:00';
        }

        const timeArray = [startTime, endTime].map(time => {
            const parts = time.split(':');
            const h = parts[0] ?? '9';
            const m = parts[1] ?? '0';
            const d = new Date(date);
            d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            return d;
        });

        const start = timeArray[0] ?? new Date();
        const end = timeArray[1] ?? new Date(start.getTime() + 8 * 60 * 60 * 1000);

        const dateStr = date.toISOString().split('T')[0];
        const existingAppointmentsOnDate = ensureArray(appointments).filter(
            appt => appt?.business_id === business.id && appt?.date === dateStr
        );

        let currentTime = new Date(start);
        while (currentTime < end) {
            const slotTime = new Date(currentTime);
            const slotEnd = new Date(slotTime.getTime() + serviceDuration * 60000);

            const isBooked = existingAppointmentsOnDate.some(appt => {
                const apptTime = new Date(`${appt?.date ?? dateStr}T${appt?.time_slot ?? '00:00'}`);
                const apptService = ensureArray(business?.services).find(s => s?.id === appt?.service_id);
                const apptDuration = ensureNumber(apptService?.duration_minutes, 60);
                const apptEnd = new Date(apptTime.getTime() + apptDuration * 60000);

                return (slotTime < apptEnd && slotEnd > apptTime);
            });

            const isPast = slotTime < new Date();

            if (!isBooked && !isPast) {
                slots.push(slotTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
            }

            currentTime = new Date(currentTime.getTime() + 30 * 60000); // Generate slots every 30 mins
        }
        return slots;
    };

    const timeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

    const resetBooking = () => {
        setStep(1);
        setSelectedServiceId(null);
        setSelectedDate(null);
        setSelectedTime(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetBooking}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold font-serif text-neutral-dark">Đặt lịch tại {business.name}</h2>
                    <button onClick={resetBooking} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </header>

                <main className="p-6 overflow-y-auto">
                    {step < 4 && <StepIndicator current={step} total={3} />}

                    {/* Step 1: Select Service */}
                    {step === 1 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-4">1. Chọn dịch vụ</h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {ensureArray(business.services).map(service => (
                                    <button
                                        key={service.id}
                                        onClick={() => { setSelectedServiceId(service.id); setStep(2); }}
                                        className="w-full text-left p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors flex items-center gap-4"
                                    >
                                        <img src={service.image_url} alt={service.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                        <div className="flex-grow">
                                            <p className="font-semibold text-neutral-dark">{service.name}</p>
                                            <p className="text-sm text-gray-500">{service.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">{service.price}</p>
                                            {/* FIX: Changed 'duration_minutes' to 'duration_minutes' to match the Service type. */}
                                            {service.duration_minutes && <p className="text-xs text-gray-400">{service.duration_minutes} phút</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Select Date & Time */}
                    {step === 2 && (
                        <div>
                            <button onClick={() => setStep(1)} className="text-sm text-secondary font-semibold mb-4">&larr; Quay lại chọn dịch vụ</button>
                            <h3 className="font-semibold text-lg mb-4">2. Chọn ngày & giờ</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="font-medium text-center mb-2">Ngày</p>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Array.from({ length: 7 }).map((_, i) => {
                                            const date = new Date();
                                            date.setDate(date.getDate() + i);
                                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                                            return (
                                                <button key={i} onClick={() => { setSelectedDate(date); setSelectedTime(null); }} className={`p-2 rounded-lg text-center ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                                    <p className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                                    <p className="font-bold text-lg">{date.getDate()}</p>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-center mb-2">Giờ</p>
                                    {selectedDate ? (
                                        timeSlots.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                                                {timeSlots.map(time => (
                                                    <button key={time} onClick={() => setSelectedTime(time)} className={`p-2 rounded-lg text-center font-semibold ${selectedTime === time ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center text-sm text-gray-500">Không có lịch trống trong ngày này.</p>
                                        )
                                    ) : (
                                        <p className="text-center text-sm text-gray-500">Vui lòng chọn ngày.</p>
                                    )}
                                </div>
                            </div>
                            {selectedTime && (
                                <div className="text-right mt-6">
                                    <button onClick={() => setStep(3)} className="px-6 py-2 bg-primary text-white rounded-md font-semibold">Tiếp tục</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Customer Information */}
                    {step === 3 && (
                        <div>
                            <button onClick={() => setStep(2)} className="text-sm text-secondary font-semibold mb-4">&larr; Quay lại chọn ngày & giờ</button>
                            <h3 className="font-semibold text-lg mb-4">3. Thông tin của bạn</h3>
                            <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                                <p><strong>Dịch vụ:</strong> {selectedService?.name}</p>
                                <p><strong>Thời gian:</strong> {selectedTime}, {selectedDate?.toLocaleDateString('vi-VN')}</p>
                            </div>
                            <form onSubmit={handleBookingSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                                    <input type="text" id="customer-name" name="name" value={customerInfo.name} onChange={handleCustomerInfoChange} required placeholder="Nhập họ và tên" className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700">Email</label>
                                        <input type="email" id="customer-email" name="email" value={customerInfo.email} onChange={handleCustomerInfoChange} required placeholder="Nhập email" className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                                        <input type="tel" id="customer-phone" name="phone" value={customerInfo.phone} onChange={handleCustomerInfoChange} required placeholder="Nhập số điện thoại" className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="customer-notes" className="block text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
                                    <textarea id="customer-notes" name="notes" value={customerInfo.notes} onChange={handleCustomerInfoChange} rows={3} placeholder="Nhập ghi chú" className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <div className="text-right">
                                    <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white rounded-md font-semibold disabled:bg-primary/50">
                                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                        <div className="text-center p-8">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <h3 className="text-2xl font-bold font-serif text-neutral-dark">Đặt lịch thành công!</h3>
                            <p className="mt-2 text-gray-600">Yêu cầu đặt lịch của bạn đã được gửi. Chúng tôi sẽ liên hệ để xác nhận sớm nhất có thể.</p>
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-left">
                                <p><strong>Dịch vụ:</strong> {selectedService?.name}</p>
                                <p><strong>Thời gian:</strong> {selectedTime}, {selectedDate?.toLocaleDateString('vi-VN')}</p>
                            </div>
                            <button onClick={resetBooking} className="mt-6 px-6 py-2 bg-primary text-white rounded-md font-semibold">Đóng</button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BookingModal;
