import React, { useMemo, useState } from 'react';
import { OrderStatus, Order } from '../../types.ts';
import { useOrderData } from '../../contexts/BusinessBlogDataContext.tsx';
import OrderManagementTable from '../OrderManagementTable.tsx';

interface AdminOrdersTabProps {
    onConfirm: (id: string) => void;
    onReject: (id: string) => void;
}

const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({ onConfirm, onReject }) => {
    const { orders, loading: ordersLoading } = useOrderData();
    const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');

    const filteredOrders = useMemo(() => {
        if (orderStatusFilter === 'all') return orders;
        return orders.filter(o => o.status === orderStatusFilter);
    }, [orders, orderStatusFilter]);

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Order Management</h2>
            <div className="flex items-center gap-4 mb-4">
                <label className="text-sm text-gray-600">Filter Status:</label>
                <select
                    value={orderStatusFilter}
                    onChange={e => setOrderStatusFilter(e.target.value as OrderStatus | 'all')}
                    className="p-2 border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="all">All Statuses</option>
                    {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {ordersLoading ? (
                <div className="flex justify-center p-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <OrderManagementTable orders={filteredOrders} onConfirm={onConfirm} onReject={onReject} />
            )}
        </div>
    );
};

export default AdminOrdersTab;
