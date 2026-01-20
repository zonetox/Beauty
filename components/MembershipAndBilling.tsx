// C3.11 - Membership & Billing (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useOrderData } from '../contexts/BusinessContext.tsx';
import { useMembershipPackageData } from '../contexts/BusinessDataContext.tsx';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { OrderStatus, MembershipPackage, Order } from '../types.ts';
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

// --- Icons for comparison table ---
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

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage membership and billing."
                />
            </div>
        );
    }

    const currentPackage = packages.find(p => p.tier === currentBusiness.membershipTier);
    const businessOrders = useMemo(() => {
        return orders.filter(o => o.businessId === currentBusiness.id).sort((a, b) => 
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
    }, [orders, currentBusiness.id]);

    // Find the latest order awaiting confirmation (for payment proof upload)
    const latestPendingOrder = useMemo(() => {
        return businessOrders.find(o => 
            o.status === OrderStatus.AWAITING_CONFIRMATION || o.status === OrderStatus.PENDING
        ) || null;
    }, [businessOrders]);

    const handleUpgradeRequest = (pkg: MembershipPackage) => {
        if (pkg.id === currentPackage?.id) {
            toast.error('This is already your current plan');
            return;
        }

        setConfirmUpgrade({ isOpen: true, package: pkg });
    };

    const confirmUpgradeRequest = async () => {
        if (!confirmUpgrade.package) return;
        const pkg = confirmUpgrade.package;
        setConfirmUpgrade({ isOpen: false, package: null });

        setIsSubmitting(true);
        try {
            const newOrder = {
                businessId: currentBusiness.id,
                businessName: currentBusiness.name,
                packageId: pkg.id,
                packageName: pkg.name,
                amount: pkg.price,
                status: OrderStatus.AWAITING_CONFIRMATION,
                paymentMethod: 'Bank Transfer' as const,
                submittedAt: new Date().toISOString(),
            };
            await addOrder(newOrder);
            toast.success('Request submitted! Please complete payment. An admin will activate your plan upon confirmation.');
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

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setIsUploadingProof(true);
        setUploadProgress(0);

        try {
            // Upload to Supabase Storage
            const folder = `orders/${latestPendingOrder.id}`;
            const imageUrl = await uploadFile('business-gallery', file, folder);
            setUploadProgress(100);

            // Update order with payment proof URL
            const { error } = await supabase
                .from('orders')
                .update({ payment_proof_url: imageUrl })
                .eq('id', latestPendingOrder.id);

            if (error) {
                throw error;
            }

            toast.success('Payment proof uploaded successfully!');
            
            // Refresh orders
            window.location.reload(); // Simple refresh - could be improved with context update
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to upload payment proof';
            toast.error(message);
        } finally {
            setIsUploadingProof(false);
            setUploadProgress(0);
            // Reset file input
            e.target.value = '';
        }
    };

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

    const isExpired = useMemo(() => {
        if (!currentBusiness.membershipExpiryDate) return false;
        return new Date(currentBusiness.membershipExpiryDate) < new Date();
    }, [currentBusiness.membershipExpiryDate]);

    const daysUntilExpiry = useMemo(() => {
        if (!currentBusiness.membershipExpiryDate) return null;
        const expiry = new Date(currentBusiness.membershipExpiryDate);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [currentBusiness.membershipExpiryDate]);

    const featureRows = [
        { key: 'permissions.customLandingPage', label: 'Custom Landing Page' },
        { key: 'permissions.seoSupport', label: 'SEO Support' },
        { key: 'permissions.privateBlog', label: 'Private Blog' },
        { key: 'permissions.photoLimit', label: 'Photo Limit' },
        { key: 'permissions.videoLimit', label: 'Video Limit' },
        { key: 'permissions.monthlyPostLimit', label: 'Monthly Blog Posts' },
        { key: 'permissions.featuredPostLimit', label: 'Featured Posts' },
        { key: 'permissions.featuredLevel', label: 'Featured Level' },
    ];
    
    /**
     * Gets a nested value from an object using dot notation path
     * @param obj - The object to get value from
     * @param path - Dot notation path (e.g., 'permissions.featuredLevel')
     * @returns The value at the path or undefined
     */
    const getNestedValue = (obj: MembershipPackage, path: string): unknown => {
        return path.split('.').reduce((o, k) => {
            if (o && typeof o === 'object' && k in o) {
                return (o as Record<string, unknown>)[k];
            }
            return undefined;
        }, obj as unknown);
    };

    const formatFeaturedLevel = (level: number) => {
        if (level === 2) return 'Top';
        if (level === 1) return 'Featured';
        return 'Standard';
    };

    /**
     * Renders a permission value with appropriate formatting
     * @param value - The permission value to render
     * @param key - The permission key
     * @returns React element representing the permission
     */
    const renderPermission = (value: unknown, key: string): React.ReactNode => {
        if (key.endsWith('featuredLevel')) {
            return <span className="font-semibold">{formatFeaturedLevel(value)}</span>;
        }
        if (typeof value === 'boolean') {
            return value ? <CheckIcon className="text-green-500 mx-auto" /> : <CrossIcon className="text-red-400 mx-auto" />;
        }
        if (typeof value === 'number') {
            if (value === 0) return <span className="text-gray-400">—</span>;
            return <span className="font-semibold">{value === -1 ? 'Unlimited' : value}</span>;
        }
        return value;
    };

    if (ordersLoading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading membership and billing information..." />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark">Membership & Billing</h2>
            
            {showPaymentInfo && selectedPackageForPayment && settings?.bankDetails && (
                <div className="p-6 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-blue-800">Complete Your Payment</h3>
                            <p className="text-sm text-blue-700 mt-1">To activate your <strong>{selectedPackageForPayment.name}</strong> plan, please make a bank transfer with the following details:</p>
                        </div>
                        <button
                            onClick={() => setShowPaymentInfo(false)}
                            className="text-blue-500 hover:text-blue-700 font-bold text-xl leading-none"
                            disabled={isSubmitting}
                        >
                            &times;
                        </button>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded border border-blue-200 text-sm space-y-2">
                        <p><strong>Bank:</strong> {settings.bankDetails.bankName}</p>
                        <p><strong>Account Name:</strong> {settings.bankDetails.accountName}</p>
                        <p><strong>Account Number:</strong> {settings.bankDetails.accountNumber}</p>
                        <p><strong>Amount:</strong> <strong className="text-primary">{formatPrice(selectedPackageForPayment.price)}</strong></p>
                        <p><strong>Transfer Note:</strong> {settings.bankDetails.transferNote.replace('[Tên doanh nghiệp]', currentBusiness.name).replace('[Mã đơn hàng]', 'UPGRADE')}</p>
                    </div>
                    
                    {/* Payment Proof Upload */}
                    {latestPendingOrder && (
                        <div className="mt-4 p-4 bg-white rounded border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800 mb-2">Upload Payment Proof</p>
                            <p className="text-xs text-blue-600 mb-3">After completing the bank transfer, please upload a screenshot or photo of the transfer confirmation.</p>
                            {latestPendingOrder.paymentProofUrl ? (
                                <div className="flex items-center gap-2 text-sm text-green-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Payment proof uploaded. Waiting for admin confirmation.</span>
                                </div>
                            ) : (
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePaymentProofUpload}
                                        disabled={isUploadingProof}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {isUploadingProof && (
                                        <div className="mt-2">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                                                    style={{ width: `${uploadProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">Uploading... {uploadProgress}%</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    <p className="text-xs text-blue-600 mt-2">Your plan will be activated once our team confirms the payment.</p>
                </div>
            )}
            
            <div>
                <div className={`p-6 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-primary/10 border-primary/20'}`}>
                    <h3 className="text-xl font-bold text-neutral-dark mb-4">Current Plan</h3>
                    {currentPackage ? (
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6">
                            <div>
                                <p className="text-2xl font-bold font-serif text-primary">{currentPackage.name}</p>
                                <p className="text-gray-600 max-w-lg">{currentPackage.description}</p>
                                {currentBusiness.membershipExpiryDate && (
                                    <div className="mt-2">
                                        <p className={`text-sm font-semibold ${isExpired ? 'text-red-600' : daysUntilExpiry !== null && daysUntilExpiry <= 30 ? 'text-yellow-600' : 'text-gray-700'}`}>
                                            {isExpired ? (
                                                <>Expired on: {formatDate(currentBusiness.membershipExpiryDate)}</>
                                            ) : (
                                                <>
                                                    Expires on: {formatDate(currentBusiness.membershipExpiryDate)}
                                                    {daysUntilExpiry !== null && daysUntilExpiry <= 30 && (
                                                        <span className="ml-2">({daysUntilExpiry} days remaining)</span>
                                                    )}
                                                </>
                                            )}
                                        </p>
                                        {isExpired && (
                                            <p className="text-xs text-red-600 mt-1">Please renew your membership to continue using premium features.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleScrollToCompare}
                                className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors self-start sm:self-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            >
                                {isExpired ? 'Renew Plan' : 'Renew / Upgrade Plan'}
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500">Could not load your current plan details.</p>
                    )}
                </div>

                <div id="compare-plans-section" className="pt-8">
                    <h3 className="text-xl font-bold text-neutral-dark mb-4">Compare Plans</h3>
                    {packages.length === 0 ? (
                        <EmptyState
                            title="No membership packages available"
                            message="Membership packages are not configured. Please contact support."
                        />
                    ) : (
                        <div className="overflow-x-auto border rounded-lg bg-white">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 text-left font-semibold text-neutral-dark min-w-[200px]">Feature</th>
                                        {packages.map(pkg => (
                                            <th key={pkg.id} className={`p-4 text-center font-bold min-w-[150px] ${pkg.id === currentPackage?.id ? 'text-primary' : 'text-neutral-dark'}`}>
                                                {pkg.name}
                                                {pkg.isPopular && <span className="block text-xs font-normal text-secondary mt-1">Most Popular</span>}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-t">
                                        <td className="p-4 font-semibold">Price</td>
                                        {packages.map(pkg => (
                                            <td key={pkg.id} className="p-4 text-center">
                                                <div className="text-lg font-bold text-neutral-dark">{formatPrice(pkg.price)}</div>
                                                <div className="text-xs text-gray-500">/ {pkg.durationMonths} months</div>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr className="border-t bg-gray-50/50">
                                        <td colSpan={packages.length + 1} className="p-3 font-semibold text-neutral-dark">Core Features</td>
                                    </tr>
                                    {featureRows.map(({key, label}) => (
                                        <tr key={key} className="border-t">
                                            <td className="p-4">{label}</td>
                                            {packages.map(pkg => (
                                                <td key={pkg.id} className="p-4 text-center">{renderPermission(getNestedValue(pkg, key), key)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="border-t">
                                        <td className="p-4"></td>
                                        {packages.map(pkg => (
                                            <td key={pkg.id} className="p-4 text-center">
                                                {pkg.id === currentPackage?.id ? (
                                                    <span className="inline-block px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md cursor-default">
                                                        Current Plan
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleUpgradeRequest(pkg)}
                                                        disabled={isSubmitting}
                                                        className="px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                Submitting...
                                                            </>
                                                        ) : (
                                                            pkg.price > (currentPackage?.price || 0) ? 'Upgrade' : 'Change Plan'
                                                        )}
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
            </div>

            {/* Order History */}
            <div>
                <h3 className="text-xl font-bold text-neutral-dark mb-4">Order History</h3>
                {businessOrders.length === 0 ? (
                    <EmptyState
                        title="No orders found"
                        message="Your order history will appear here once you submit a membership upgrade or renewal request."
                    />
                ) : (
                    <div className="overflow-x-auto border rounded-lg bg-white">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Order ID</th>
                                    <th scope="col" className="px-6 py-3">Package</th>
                                    <th scope="col" className="px-6 py-3">Amount</th>
                                    <th scope="col" className="px-6 py-3">Date</th>
                                    <th scope="col" className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {businessOrders.map(order => (
                                    <tr key={order.id} className="bg-white border-b last:border-b-0 hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono text-xs">{order.id.substring(0, 8)}...</td>
                                        <td className="px-6 py-4 font-medium text-neutral-dark">{order.packageName}</td>
                                        <td className="px-6 py-4">{formatPrice(order.amount)}</td>
                                        <td className="px-6 py-4">{formatDate(order.submittedAt)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[order.status]}`}>
                                                {order.status}
                                            </span>
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
                title="Request Package Change"
                message={confirmUpgrade.package ? `Are you sure you want to request ${confirmUpgrade.package.price > (currentPackage?.price || 0) ? 'an upgrade' : 'a change'} to the ${confirmUpgrade.package.name} package?` : ''}
                confirmText="Confirm"
                cancelText="Cancel"
                variant="info"
                onConfirm={confirmUpgradeRequest}
                onCancel={() => setConfirmUpgrade({ isOpen: false, package: null })}
            />
        </div>
    );
};

export default MembershipAndBilling;
