import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderStatus, RegistrationRequest, AdminPageTab } from '../types.ts';

// Bell Icon
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

interface AdminNotificationsProps {
    orders: Order[];
    registrationRequests: RegistrationRequest[];
    onNavigate: (tab: AdminPageTab) => void;
}

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ orders, registrationRequests, onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const notifications = useMemo(() => {
        const pendingOrders = orders.filter(o => o.status === OrderStatus.AWAITING_CONFIRMATION);
        const pendingRegistrations = registrationRequests.filter(r => r.status === 'Pending');
        return {
            count: pendingOrders.length + pendingRegistrations.length,
            pendingOrders,
            pendingRegistrations
        };
    }, [orders, registrationRequests]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNavigate = (tab: AdminPageTab) => {
        onNavigate(tab);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={notificationRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="relative p-2 bg-white rounded-full shadow-sm border hover:bg-gray-100">
                <BellIcon />
                {notifications.count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{notifications.count}</span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-2 w-80 right-0 bg-white rounded-md shadow-lg border">
                    <div className="p-3 font-semibold border-b">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.count === 0 ? (
                            <p className="text-sm text-gray-500 text-center p-4">No new notifications.</p>
                        ) : (
                            <div>
                                {notifications.pendingRegistrations.length > 0 && (
                                    <div className="p-2">
                                        <h4 className="text-xs font-bold uppercase text-gray-400 px-2 mb-1">Registrations</h4>
                                        {notifications.pendingRegistrations.slice(0, 3).map(req => (
                                            <button key={req.id} onClick={() => handleNavigate('registrations')} className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm">
                                                New request from <strong>{req.businessName}</strong>
                                            </button>
                                        ))}
                                        {notifications.pendingRegistrations.length > 3 && (
                                            <button onClick={() => handleNavigate('registrations')} className="w-full text-center p-2 text-primary text-sm font-semibold hover:bg-gray-100">
                                                View all...
                                            </button>
                                        )}
                                    </div>
                                )}
                                {notifications.pendingOrders.length > 0 && (
                                    <div className="p-2 border-t">
                                        <h4 className="text-xs font-bold uppercase text-gray-400 px-2 mb-1">Orders</h4>
                                        {notifications.pendingOrders.slice(0, 3).map(order => (
                                            <button key={order.id} onClick={() => handleNavigate('orders')} className="w-full text-left p-2 rounded hover:bg-gray-100 text-sm">
                                                Payment confirmation for <strong>{order.businessName}</strong>
                                            </button>
                                        ))}
                                         {notifications.pendingOrders.length > 3 && (
                                            <button onClick={() => handleNavigate('orders')} className="w-full text-center p-2 text-primary text-sm font-semibold hover:bg-gray-100">
                                                View all...
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotifications;