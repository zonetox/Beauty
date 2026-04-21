import React, { useMemo } from 'react';
import { Business, Order, OrderStatus, RegistrationRequest } from '../types.ts';
import AdminStatCard from './AdminStatCard.tsx';

// Icons
const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const BusinessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;

interface DashboardOverviewProps {
    businesses: Business[];
    orders: Order[];
    registrationRequests: RegistrationRequest[];
    onNavigate: (tab: string) => void;
}

const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

const ActivityItem: React.FC<{ icon: React.ReactNode, text: React.ReactNode, time: string, onClick?: () => void }> = ({ icon, text, time, onClick }) => (
    <div onClick={onClick} className={`flex items-start gap-6 p-6 rounded-[1.5rem] transition-all duration-500 ${onClick ? 'hover:bg-primary/5 cursor-pointer hover:translate-x-2' : ''}`}>
        <div className="bg-primary/5 p-4 rounded-full text-primary flex-shrink-0 shadow-inner group-hover:bg-primary group-hover:text-white transition-all">{icon}</div>
        <div>
            <p className="text-sm text-primary font-light leading-relaxed">{text}</p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-2">{time}</p>
        </div>
    </div>
);

const Chart: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="glass-card p-10 rounded-[2rem] h-full flex flex-col shadow-premium border border-white/40">
            <h3 className="text-2xl font-serif text-primary mb-10 tracking-wide">Nhà đối tác doanh nghiệp mới</h3>
            <div className="flex-grow flex items-end justify-around h-60 gap-4 pt-10">
                {data.map(item => (
                    <div key={item.label} className="flex flex-col items-center flex-1 h-full group">
                        <div className="flex-grow flex items-end w-full">
                            <div
                                className="w-full bg-gold/10 rounded-full hover:bg-gold/30 transition-all duration-500 relative group cursor-pointer"
                                style={{ height: `${Math.max((item.value / maxValue) * 100, 10)}%`, minHeight: '12px' }}
                            >
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold py-2 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl tracking-widest z-10">
                                    {item.value} đối tác
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-4 font-bold tracking-widest uppercase">{item.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminDashboardOverview: React.FC<DashboardOverviewProps> = ({ businesses, orders, registrationRequests, onNavigate }) => {

    const stats = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const revenueThisMonth = orders
            .filter(o => o.status === OrderStatus.COMPLETED && o.confirmed_at && new Date(o.confirmed_at) >= firstDayOfMonth)
            .reduce((sum, o) => sum + o.amount, 0);

        const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.AWAITING_CONFIRMATION).length;
        const pendingRegistrations = registrationRequests.filter(r => r.status === 'Pending').length;
        const activeBusinesses = businesses.filter(b => b.is_active).length;

        return { revenueThisMonth, pendingOrders, pendingRegistrations, activeBusinesses };
    }, [businesses, orders, registrationRequests]);

    const recentActivities = useMemo(() => {
        const orderActivities = orders.map(o => ({
            type: 'order',
            date: new Date(o.submitted_at),
            data: o,
            id: `order-${o.id}`
        }));
        const regActivities = registrationRequests.map(r => ({
            type: 'registration',
            date: new Date(r.submitted_at),
            data: r,
            id: `reg-${r.id}`
        }));

        return [...orderActivities, ...regActivities]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
    }, [orders, registrationRequests]);

    const chartData = useMemo(() => {
        const data: { [key: string]: { value: number; label: string } } = {};

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().split('T')[0];
            data[key] = { value: 0, label: d.toLocaleDateString('en-US', { day: 'numeric' }) };
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        businesses.forEach(b => {
            const joinDate = new Date(b?.joined_date ?? new Date());
            joinDate.setHours(0, 0, 0, 0);
            if (joinDate >= sevenDaysAgo) {
                const key = joinDate.toISOString().split('T')[0];
                if (key && data[key]) {
                    data[key]!.value++;
                }
            }
        });

        return Object.values(data);
    }, [businesses]);


    return (
        <div className="space-y-12 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AdminStatCard title="Doanh thu tháng này" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenueThisMonth)} icon={<RevenueIcon />} />
                <AdminStatCard title="Đơn hàng chờ duyệt" value={stats.pendingOrders} icon={<OrderIcon />} />
                <AdminStatCard title="Đăng ký mới" value={stats.pendingRegistrations} icon={<UserIcon />} />
                <AdminStatCard title="Đối tác đang hoạt động" value={stats.activeBusinesses} icon={<BusinessIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <Chart data={chartData} />
                </div>
                <div className="lg:col-span-1 glass-card p-10 rounded-[2rem] shadow-premium border border-white/40">
                    <h3 className="text-2xl font-serif text-primary mb-8 tracking-wide">Cập nhật hệ thống</h3>
                    <div className="space-y-2 -mx-4">
                        {recentActivities.map(activity => {
                            if (activity.type === 'order') {
                                const order = activity.data as Order;
                                return <ActivityItem key={activity.id} icon={<OrderIcon />} text={<>Đơn hàng mới từ đối tác <strong className="text-primary font-bold">{order.business_name}</strong>.</>} time={timeSince(activity.date)} onClick={() => onNavigate('orders')} />
                            }
                            if (activity.type === 'registration') {
                                const req = activity.data as RegistrationRequest;
                                return <ActivityItem key={activity.id} icon={<UserIcon />} text={<>Yêu cầu đăng ký mới từ <strong className="text-primary font-bold">{req.business_name}</strong>.</>} time={timeSince(activity.date)} onClick={() => onNavigate('registrations')} />
                            }
                            return null;
                        })}
                        {recentActivities.length === 0 && (
                            <div className="py-20 text-center">
                                <p className="text-sm font-light italic text-neutral-400">Chưa có hoạt động mới trong hệ thống.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;
