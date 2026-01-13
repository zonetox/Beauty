import React, { useState } from 'react';
import { Order, OrderStatus } from '../types.ts';
import { getOptimizedSupabaseUrl } from '../lib/image.ts';

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

// Payment Proof Image Viewer Modal
const PaymentProofModal: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75 z-10"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <img
                    src={getOptimizedSupabaseUrl(imageUrl, { width: 1200, quality: 90 })}
                    alt="Payment Proof"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
            </div>
        </div>
    );
};

const OrderManagementTable: React.FC<OrderManagementTableProps> = ({ orders, onConfirm, onReject }) => {
    const [viewingProofUrl, setViewingProofUrl] = useState<string | null>(null);
    
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
                        <th scope="col" className="px-6 py-3">Payment Proof</th>
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
                            <td className="px-6 py-4">
                                {order.paymentProofUrl ? (
                                    <button
                                        onClick={() => setViewingProofUrl(order.paymentProofUrl!)}
                                        className="text-primary hover:text-primary-dark underline text-xs flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        View Proof
                                    </button>
                                ) : (
                                    <span className="text-gray-400 text-xs italic">No proof</span>
                                )}
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
            {viewingProofUrl && (
                <PaymentProofModal imageUrl={viewingProofUrl} onClose={() => setViewingProofUrl(null)} />
            )}
        </div>
    );
};

export default OrderManagementTable;