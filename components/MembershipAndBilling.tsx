// C3.11 - Membership & Billing (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useOrderData } from '../contexts/BusinessContext.tsx';
import { useMembershipPackageData } from '../contexts/BusinessDataContext.tsx';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { OrderStatus, MembershipPackage } from '../types.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';
import { uploadFile } from '../lib/storage.ts';
import { supabase } from '../lib/supabaseClient.ts';
import ConfirmDialog from './ConfirmDialog.tsx';

const statusStyles: { [key in OrderStatus]: string } = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [OrderStatus.AWAITING_CONFIRMATION]: 'bg-blue-100 text-blue-800',
    [OrderStatus.COMPLETED]: 'bg-green-100 text-green-800',
    [OrderStatus.REJECTED]: 'bg-red-100 text-red-800',
};

// --- Helper Functions Moved Outside Component ---
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

const formatfeatured_level = (level: number) => {
    if (level === 2) return 'Top';
    if (level === 1) return 'Featured';
    return 'Standard';
};

const getNestedValue = (obj: MembershipPackage, path: string): unknown => {
    return path.split('.').reduce((o, k) => {
        if (o && typeof o === 'object' && k in o) {
            return (o as Record<string, unknown>)[k];
        }
        return undefined;
    }, obj as unknown);
};

const featureRows = [
    { key: 'permissions.custom_landing_page', label: 'Custom Landing Page' },
    { key: 'permissions.seo_support', label: 'SEO Support' },
    { key: 'permissions.private_blog', label: 'Private Blog' },
    { key: 'permissions.photo_limit', label: 'Photo Limit' },
    { key: 'permissions.video_limit', label: 'Video Limit' },
    { key: 'permissions.monthly_post_limit', label: 'Monthly Blog Posts' },
    { key: 'permissions.featured_post_limit', label: 'Featured Posts' },
    { key: 'permissions.featured_level', label: 'Featured Level' },
];

const CheckIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const CrossIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const MembershipAndBilling: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { packages } = useMembershipPackageData();
    const { orders, addOrder, loading: ordersLoading } = useOrderData();
    const { settings } = useAdmin();
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);
    const [selectedPackageForPayment, setSelectedPackageForPayment] = useState<MembershipPackage | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [confirmUpgrade, setConfirmUpgrade] = useState<{ isOpen: boolean; package: MembershipPackage | null }>({ isOpen: false, package: null });
    const [uploadProgress, setUploadProgress] = useState(0);
    const currentBusinessId = currentBusiness?.id ?? null;

    const currentPackage = packages.find(p => p.tier === currentBusiness?.membership_tier);

    const businessOrders = useMemo(() => {
        if (currentBusinessId === null) return [];
        return orders.filter(o => o.business_id === currentBusinessId).sort((a, b) =>
            new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        );
    }, [orders, currentBusinessId]);

    const latestPendingOrder = useMemo(() => {
        return businessOrders.find(o =>
            o.status === OrderStatus.AWAITING_CONFIRMATION || o.status === OrderStatus.PENDING
        ) || null;
    }, [businessOrders]);

    const isExpired = useMemo(() => {
        if (!currentBusiness?.membership_expiry_date) return false;
        return new Date(currentBusiness.membership_expiry_date) < new Date();
    }, [currentBusiness?.membership_expiry_date]);

    const daysUntilExpiry = useMemo(() => {
        if (!currentBusiness?.membership_expiry_date) return null;
        const expiry = new Date(currentBusiness.membership_expiry_date);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [currentBusiness?.membership_expiry_date]);

    const renderPermission = React.useCallback((value: unknown, key: string): React.ReactNode => {
        if (key.endsWith('featured_level')) {
            return <span className="font-semibold">{formatfeatured_level(value as number)}</span>;
        }
        if (typeof value === 'boolean') {
            return value ? <CheckIcon className="text-green-500 mx-auto" /> : <CrossIcon className="text-red-400 mx-auto" />;
        }
        if (typeof value === 'number') {
            if (value === 0) return <span className="text-gray-400">—</span>;
            return <span className="font-semibold">{value === -1 ? 'Unlimited' : value}</span>;
        }
        return String(value);
    }, []);

    const handleUpgradeRequest = (pkg: MembershipPackage) => {
        if (pkg.id === currentPackage?.id) {
            toast.error('This is already your current plan');
            return;
        }
        setConfirmUpgrade({ isOpen: true, package: pkg });
    };

    const confirmUpgradeRequest = async () => {
        if (!confirmUpgrade.package || !currentBusiness) return;
        const pkg = confirmUpgrade.package;
        setConfirmUpgrade({ isOpen: false, package: null });

        setIsSubmitting(true);
        try {
            const newOrder = {
                business_id: currentBusiness.id,
                business_name: currentBusiness.name,
                package_id: pkg.id,
                package_name: pkg.name,
                amount: pkg.price,
                status: OrderStatus.AWAITING_CONFIRMATION,
                payment_method: 'Bank Transfer' as const,
                submitted_at: new Date().toISOString(),
            };
            await addOrder(newOrder);
            toast.success('Yêu cầu đã được gửi! Vui lòng hoàn tất thanh toán.');
            setSelectedPackageForPayment(pkg);
            setShowPaymentInfo(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to submit request';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleScrollToCompare = () => {
        document.getElementById('compare-plans-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handlePaymentProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !latestPendingOrder) return;
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
        setIsUploadingProof(true);
        setUploadProgress(0);
        try {
            const folder = `orders/${latestPendingOrder.id}`;
            const image_url = await uploadFile('business-gallery', file, folder);
            setUploadProgress(100);
            const { error } = await supabase.from('orders').update({ payment_proof_url: image_url }).eq('id', latestPendingOrder.id);
            if (error) throw error;
            toast.success('Tải minh chứng thành công!');
            window.location.reload();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload payment proof';
            toast.error(message);
        } finally {
            setIsUploadingProof(false);
            setUploadProgress(0);
            e.target.value = '';
        }
    };

    if (!currentBusiness) {
        return <div className="p-8"><EmptyState title="No business found" message="Please select a business to manage membership and billing." /></div>;
    }

    if (ordersLoading) {
        return <div className="p-8"><LoadingState message="Loading membership and billing information..." /></div>;
    }

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark">Hội viên & Gói dịch vụ</h2>

            {showPaymentInfo && selectedPackageForPayment && settings?.bank_details && (
                <div className="p-6 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-blue-800 text-lg">Hoàn tất thanh toán</h3>
                            <p className="text-sm text-blue-700 mt-1">
                                Để kích hoạt gói <strong>{selectedPackageForPayment.name}</strong>, vui lòng chuyển khoản theo thông tin bên dưới hoặc quét mã QR:
                            </p>
                        </div>
                        <button onClick={() => setShowPaymentInfo(false)} className="text-blue-500 hover:text-blue-700 font-bold text-xl">&times;</button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* QR Code Section */}
                        <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm flex-shrink-0 w-full md:w-auto flex flex-col items-center">
                            <div className="bg-gray-50 p-2 rounded border mb-3">
                                <img
                                    src={`https://qr.sepay.vn/img?acc=${settings.bank_details.account_number}&bank=${settings.bank_details.bank_name}&amount=${selectedPackageForPayment.price}&des=SEPAY ${latestPendingOrder?.id.substring(0, 8).toUpperCase()}&template=${settings.sepay_config?.qr_template || 'compact'}`}
                                    alt="VietQR Payment"
                                    className="w-64 h-64 object-contain"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Mã QR VietQR (Quét để thanh toán)</p>
                        </div>

                        {/* Text Info Section */}
                        <div className="flex-1 space-y-4 w-full">
                            <div className="p-4 bg-white rounded border border-blue-200 text-sm space-y-3">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Ngân hàng:</span>
                                    <span className="font-bold text-neutral-dark">{settings.bank_details.bank_name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Số tài khoản:</span>
                                    <span className="font-mono font-bold text-neutral-dark">{settings.bank_details.account_number}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Chủ tài khoản:</span>
                                    <span className="font-bold text-neutral-dark">{settings.bank_details.account_name}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Số tiền:</span>
                                    <span className="font-bold text-primary text-lg">{formatPrice(selectedPackageForPayment.price)}</span>
                                </div>
                                <div className="p-3 bg-yellow-50 rounded border border-yellow-100">
                                    <span className="text-xs text-yellow-700 block mb-1">Nội dung chuyển khoản (Bắt buộc giữ nguyên):</span>
                                    <span className="font-mono font-bold text-neutral-dark text-base">SEPAY {latestPendingOrder?.id.substring(0, 8).toUpperCase()}</span>
                                </div>
                            </div>

                            {latestPendingOrder && (
                                <div className="p-4 bg-white rounded border border-blue-200">
                                    <p className="text-sm font-semibold text-blue-800 mb-2">Đã chuyển khoản xong?</p>
                                    <p className="text-xs text-blue-600 mb-3">Hệ thống sẽ tự động kích hoạt sau vài phút. Nếu cần, bạn có thể tải ảnh minh chứng tại đây.</p>
                                    {latestPendingOrder.payment_proof_url ? (
                                        <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
                                            <CheckIcon className="h-5 w-5" />
                                            <span>Đã tải lên minh chứng. Đang chờ đối soát.</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <input type="file" accept="image/*" onChange={handlePaymentProofUpload} disabled={isUploadingProof} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer disabled:opacity-50" />
                                            {isUploadingProof && (
                                                <div className="mt-2 text-[10px] text-gray-500 uppercase tracking-widest">
                                                    Đang tải lên... {uploadProgress}%
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className={`p-6 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-primary/10 border-primary/20'}`}>
                <h3 className="text-xl font-bold text-neutral-dark mb-4">Gói dịch vụ hiện tại</h3>
                {currentPackage ? (
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6">
                        <div>
                            <p className="text-2xl font-bold font-serif text-primary">{currentPackage.name}</p>
                            <p className="text-gray-600 max-w-lg mt-1">{currentPackage.description}</p>
                            {currentBusiness.membership_expiry_date && (
                                <div className="mt-3">
                                    <p className={`text-sm font-semibold ${isExpired ? 'text-red-600' : (daysUntilExpiry ?? 31) <= 30 ? 'text-yellow-600' : 'text-gray-700'}`}>
                                        {isExpired ? `Đã hết hạn vào: ${formatDate(currentBusiness.membership_expiry_date)}` : `Hạn dùng đến: ${formatDate(currentBusiness.membership_expiry_date)} ${daysUntilExpiry !== null && daysUntilExpiry <= 30 ? `(${daysUntilExpiry} ngày nữa)` : ''}`}
                                    </p>
                                    {isExpired && <p className="text-xs text-red-600 mt-1">Vui lòng gia hạn để tiếp tục sử dụng các tính năng cao cấp.</p>}
                                </div>
                            )}
                        </div>
                        <button onClick={handleScrollToCompare} className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors shrink-0 disabled:opacity-50" disabled={isSubmitting}>
                            {isExpired ? 'Gia hạn gói' : 'Nâng cấp / Gia hạn'}
                        </button>
                    </div>
                ) : <p className="text-gray-500">Không thể tải thông tin gói dịch vụ hiện tại.</p>}
            </div>

            <div id="compare-plans-section" className="pt-4">
                <h3 className="text-xl font-bold text-neutral-dark mb-4">So sánh các gói</h3>
                {packages.length === 0 ? <EmptyState title="Không có gói dịch vụ" message="Hệ thống chưa cấu hình gói dịch vụ." /> : (
                    <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-neutral-dark min-w-[180px]">Tính năng</th>
                                    {packages.map(pkg => (
                                        <th key={pkg.id} className={`p-4 text-center font-bold min-w-[140px] ${pkg.id === currentPackage?.id ? 'text-primary' : 'text-neutral-dark'}`}>
                                            {pkg.name}
                                            {pkg.is_popular && <span className="block text-xs font-normal text-secondary mt-1">Phổ biến nhất</span>}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-t">
                                    <td className="p-4 font-semibold text-gray-700">Giá dịch vụ</td>
                                    {packages.map(pkg => (
                                        <td key={pkg.id} className="p-4 text-center">
                                            <div className="text-lg font-bold text-neutral-dark">{formatPrice(pkg.price)}</div>
                                            <div className="text-xs text-gray-500">/ {pkg.duration_months} tháng</div>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t bg-gray-50/30"><td colSpan={packages.length + 1} className="p-3 text-xs font-bold uppercase tracking-wider text-gray-400">Chi tiết tính năng</td></tr>
                                {featureRows.map(({ key, label }) => (
                                    <tr key={key} className="border-t hover:bg-gray-50/50">
                                        <td className="p-4 text-gray-600">{label}</td>
                                        {packages.map(pkg => <td key={pkg.id} className="p-4 text-center">{renderPermission(getNestedValue(pkg, key), key)}</td>)}
                                    </tr>
                                ))}
                                <tr className="border-t">
                                    <td className="p-4"></td>
                                    {packages.map(pkg => (
                                        <td key={pkg.id} className="p-4 text-center">
                                            {pkg.id === currentPackage?.id ? (
                                                <span className="inline-block px-4 py-2 text-xs font-bold uppercase text-primary bg-primary/10 rounded-full border border-primary/20">Gói hiện tại</span>
                                            ) : (
                                                <button onClick={() => handleUpgradeRequest(pkg)} disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-md hover:opacity-90 disabled:opacity-50">
                                                    {pkg.price > (currentPackage?.price || 0) ? 'Nâng cấp' : 'Đổi gói'}
                                                </button>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-xl font-bold text-neutral-dark mb-4">Lịch sử giao dịch</h3>
                {businessOrders.length === 0 ? <EmptyState title="Chưa có giao dịch" message="Lịch sử giao dịch sẽ hiển thị sau khi bạn gửi yêu cầu nâng cấp gói." /> : (
                    <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Mã đơn</th>
                                    <th className="px-6 py-3">Gói</th>
                                    <th className="px-6 py-3">Số tiền</th>
                                    <th className="px-6 py-3">Ngày gửi</th>
                                    <th className="px-6 py-3">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {businessOrders.map(order => (
                                    <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">{order.id.substring(0, 8).toUpperCase()}</td>
                                        <td className="px-6 py-4 font-medium text-neutral-dark">{order.package_name}</td>
                                        <td className="px-6 py-4">{formatPrice(order.amount)}</td>
                                        <td className="px-6 py-4">{formatDate(order.submitted_at)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${statusStyles[order.status]}`}>{order.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmUpgrade.isOpen}
                title="Thay đổi gói dịch vụ"
                message={confirmUpgrade.package ? `Bạn có chắc chắn muốn ${confirmUpgrade.package.price > (currentPackage?.price || 0) ? 'nâng cấp' : 'thay đổi'} lên gói ${confirmUpgrade.package.name}?` : ''}
                confirmText="Xác nhận"
                cancelText="Hủy"
                variant="info"
                onConfirm={confirmUpgradeRequest}
                onCancel={() => setConfirmUpgrade({ isOpen: false, package: null })}
            />
        </div>
    );
};

export default MembershipAndBilling;
