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
    <div onClick={onClick} className={`flex items-start gap-4 p-3 rounded-md ${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}>
        <div className="bg-gray-100 p-2 rounded-full text-gray-500 flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-neutral-dark">{text}</p>
            <p className="text-xs text-gray-400">{time}</p>
        </div>
    </div>
);

const Chart: React.FC<{data: {label: string, value: number}[]}> = ({data}) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
      <div className="bg-white p-6 rounded-lg shadow h-full flex flex-col">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4">New Businesses (Last 7 Days)</h3>
        <div className="flex-grow flex items-end justify-around gap-2 pt-4">
            {data.map(item => (
                <div key={item.label} className="flex flex-col items-center flex-1 h-full text-center group">
                     <span className="text-xs font-bold text-neutral-dark opacity-0 group-hover:opacity-100 transition-opacity -mb-1">{item.value}</span>
                    <div className="flex-grow flex items-end w-full">
                       {/* eslint-disable jsx-a11y/no-static-element-interactions */}
                       <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t" /* Dynamic height based on data - CSS inline necessary for dynamic calculations */ style={{height: `${Math.max((item.value / maxValue) * 100, 5)}%`, minHeight: '5px'}} title={`${item.value} new businesses`}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
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
            .filter(o => o.status === OrderStatus.COMPLETED && o.confirmedAt && new Date(o.confirmedAt) >= firstDayOfMonth)
            .reduce((sum, o) => sum + o.amount, 0);

        const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.AWAITING_CONFIRMATION).length;
        const pendingRegistrations = registrationRequests.filter(r => r.status === 'Pending').length;
        const activeBusinesses = businesses.filter(b => b.isActive).length;
        
        return { revenueThisMonth, pendingOrders, pendingRegistrations, activeBusinesses };
    }, [businesses, orders, registrationRequests]);

    const recentActivities = useMemo(() => {
        const orderActivities = orders.map(o => ({
            type: 'order',
            date: new Date(o.submittedAt),
            data: o,
            id: `order-${o.id}`
        }));
        const regActivities = registrationRequests.map(r => ({
            type: 'registration',
            date: new Date(r.submittedAt),
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
            const joinDate = new Date(b?.joinedDate ?? new Date());
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AdminStatCard title="Revenue This Month" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenueThisMonth)} icon={<RevenueIcon />} />
                <AdminStatCard title="Pending Orders" value={stats.pendingOrders} icon={<OrderIcon />} />
                <AdminStatCard title="Pending Registrations" value={stats.pendingRegistrations} icon={<UserIcon />} />
                <AdminStatCard title="Active Businesses" value={stats.activeBusinesses} icon={<BusinessIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Chart data={chartData} />
                </div>
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-neutral-dark mb-4">Recent Activity</h3>
                    <div className="space-y-2">
                        {recentActivities.map(activity => {
                             if (activity.type === 'order') {
                                const order = activity.data as Order;
                                return <ActivityItem key={activity.id} icon={<OrderIcon />} text={<>New order from <strong>{order.businessName}</strong>.</>} time={timeSince(activity.date)} onClick={() => onNavigate('orders')} />
                            }
                            if (activity.type === 'registration') {
                                const req = activity.data as RegistrationRequest;
                                return <ActivityItem key={activity.id} icon={<UserIcon />} text={<>New registration request from <strong>{req.businessName}</strong>.</>} time={timeSince(activity.date)} onClick={() => onNavigate('registrations')} />
                            }
                            return null;
                        })}
                         {recentActivities.length === 0 && <p className="text-sm text-center text-gray-500 py-8">No recent activity.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardOverview;