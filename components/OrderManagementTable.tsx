import React from 'react';
import { Order, OrderStatus } from '../types.ts';

interface OrderManagementTableProps {
    orders: Order[];
    onConfirm: (orderId: string) => void;
    onReject: (orderId: string) => void;
}

const statusStyles: { [key in OrderStatus]: string } = {
    [OrderStatus.PENDING]: 'bg-gray-200 text-gray-800',
    [OrderStatus.AWAITING_CONFIRMATION]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [OrderStatus.REJECTED]: 'bg-red-100 text-red-800',
};

const OrderManagementTable: React.FC<OrderManagementTableProps> = ({ orders, onConfirm, onReject }) => {
    
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };
    
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (orders.length === 0) {
        return <p className="text-center text-gray-500 py-4">No orders found matching the criteria.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Business</th>
                        <th scope="col" className="px-6 py-3">Package</th>
                        <th scope="col" className="px-6 py-3">Amount</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Submitted At</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-neutral-dark whitespace-nowrap">{order.businessName}</td>
                            <td className="px-6 py-4">{order.packageName}</td>
                            <td className="px-6 py-4 font-semibold">{formatPrice(order.amount)}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[order.status]}`}>
                                    {order.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">{formatDate(order.submittedAt)}</td>
                            <td className="px-6 py-4">
                                {order.status === OrderStatus.PENDING ? (
                                    <span className="text-gray-500 italic text-xs">Awaiting User Payment</span>
                                ) : order.status === OrderStatus.AWAITING_CONFIRMATION ? (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => onConfirm(order.id)}
                                            className="font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-md text-xs"
                                        >
                                            Confirm Payment
                                        </button>
                                        <button 
                                            onClick={() => onReject(order.id)}
                                            className="font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-xs"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic text-xs">
                                        {order.status === OrderStatus.COMPLETED ? `Confirmed on ${formatDate(order.confirmedAt)}` : 'Rejected'}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderManagementTable;