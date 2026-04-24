import React, { useState } from 'react';
import { Business } from '../../../../types.ts';
import { Calendar, Phone, User, MessageSquare, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface BookingFormSectionProps {
    business: Business;
}

const BookingFormSection: React.FC<BookingFormSectionProps> = ({ business }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            toast.success('✅ Đặt lịch thành công! Chúng tôi sẽ gọi xác nhận trong 15 phút.');
            setIsSubmitting(false);
            (e.target as HTMLFormElement).reset();
        }, 1500);
    };

    return (
        <section id="booking" className="py-24 px-4 bg-primary/[0.01]">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary/5 overflow-hidden border border-luxury-border/30">
                    <div className="grid grid-cols-1 md:grid-cols-5">
                        {/* Info Side */}
                        <div className="md:col-span-2 bg-primary p-12 text-white flex flex-col justify-between">
                            <div>
                                <h3 className="text-3xl font-serif mb-6 leading-tight">Đặt lịch <br />trải nghiệm ngay</h3>
                                <p className="text-white/70 font-light italic text-sm mb-8">
                                    "Vẻ đẹp bắt đầu từ khoảnh khắc bạn quyết định là chính mình."
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 text-sm font-light">
                                    <Phone size={18} className="text-white/50" />
                                    <span>{business.phone || 'Chưa cập nhật'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm font-light">
                                    <Calendar size={18} className="text-white/50" />
                                    <span>Phục vụ hàng ngày</span>
                                </div>
                            </div>
                        </div>

                        {/* Form Side */}
                        <div className="md:col-span-3 p-8 md:p-12">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Họ tên *</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
                                            <input required type="text" placeholder="Nguyễn Văn A" className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Số điện thoại *</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={14} />
                                            <input required type="tel" placeholder="090..." className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Dịch vụ quan tâm</label>
                                    <select className="w-full px-4 py-3 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm appearance-none">
                                        <option>Chọn dịch vụ...</option>
                                        {business.services?.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        )) || (
                                                <>
                                                    <option>Làm Nails</option>
                                                    <option>Gội đầu dưỡng sinh</option>
                                                    <option>Chăm sóc da</option>
                                                </>
                                            )}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-neutral-400 ml-1">Ghi chú thêm</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-4 text-neutral-300" size={14} />
                                        <textarea rows={3} placeholder="Yêu cầu đặc biệt..." className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/20 outline-none transition-all text-sm resize-none"></textarea>
                                    </div>
                                </div>

                                <button
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-primary text-white text-[11px] font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-100 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Đang gửi...' : <><Calendar size={14} /> Gửi yêu cầu đặt lịch <ChevronRight size={14} /></>}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BookingFormSection;
