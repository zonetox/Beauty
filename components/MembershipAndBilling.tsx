
import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useOrderData } from '../contexts/BusinessContext.tsx';
import { useMembershipPackageData, useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { useAdmin } from '../contexts/AdminContext.tsx';
import { OrderStatus, MembershipPackage, Order } from '../types.ts';

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
    const { orders, addOrder } = useOrderData();
    const { settings } = useAdmin();
    const [showPaymentInfo, setShowPaymentInfo] = useState(false);
    const [selectedPackageForPayment, setSelectedPackageForPayment] = useState<MembershipPackage | null>(null);


    if (!currentBusiness) return null;

    const currentPackage = packages.find(p => p.tier === currentBusiness.membershipTier);
    const businessOrders = orders.filter(o => o.businessId === currentBusiness.id);

    const handleUpgradeRequest = async (pkg: MembershipPackage) => {
        if (!window.confirm(`Are you sure you want to request an upgrade to the ${pkg.name} package?`)) {
            return;
        }

        const upgradePromise = (async () => {
            const newOrder = {
                businessId: currentBusiness.id,
                businessName: currentBusiness.name,
                packageId: pkg.id,
                packageName: pkg.name,
                amount: pkg.price,
                status: OrderStatus.AWAITING_CONFIRMATION, // Set status for manual admin approval
                paymentMethod: 'Bank Transfer' as const,
                submittedAt: new Date().toISOString(),
            };
            await addOrder(newOrder);
        })();

        toast.promise(upgradePromise, {
            loading: 'Submitting your upgrade request...',
            success: 'Request submitted! Please complete payment. An admin will activate your plan upon confirmation.',
            error: 'There was an error submitting your request.'
        });
        
        setSelectedPackageForPayment(pkg);
        setShowPaymentInfo(true);
    };
    
    const handleScrollToCompare = () => {
        document.getElementById('compare-plans-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    }

    const featureRows = [
        { key: 'permissions.customLandingPage', label: 'Custom Landing Page' },
        { key: 'permissions.seoSupport', label: 'SEO Support' },
        { key: 'permissions.privateBlog', label: 'Private Blog' },
        { key: 'permissions.photoLimit', label: 'Photo Limit' },
        { key: 'permissions.videoLimit', label: 'Video Limit' },
        { key: 'permissions.featuredLevel', label: 'Featured Level' },
    ];
    
    const getNestedValue = (obj: MembershipPackage, path: string): any => {
        return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj as any);
    };

    const formatFeaturedLevel = (level: number) => {
        if (level === 2) return 'Top';
        if (level === 1) return 'Featured';
        return 'Standard';
    };

    const renderPermission = (value: any, key: string) => {
        if (key.endsWith('featuredLevel')) {
            return <span className="font-semibold">{formatFeaturedLevel(value)}</span>;
        }
        if (typeof value === 'boolean') {
            return value ? <CheckIcon className="text-green-500 mx-auto" /> : <CrossIcon className="text-red-400 mx-auto" />;
        }
        if (typeof value === 'number') {
             return <span className="font-semibold">{value}</span>;
        }
        return value;
    };

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
                        <button onClick={() => setShowPaymentInfo(false)} className="text-blue-500 hover:text-blue-700 font-bold">&times;</button>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded border border-blue-200 text-sm space-y-2">
                        <p><strong>Bank:</strong> {settings.bankDetails.bankName}</p>
                        <p><strong>Account Name:</strong> {settings.bankDetails.accountName}</p>
                        <p><strong>Account Number:</strong> {settings.bankDetails.accountNumber}</p>
                        <p><strong>Amount:</strong> <strong className="text-primary">{formatPrice(selectedPackageForPayment.price)}</strong></p>
                        <p><strong>Transfer Note:</strong> {settings.bankDetails.transferNote.replace('[Tên doanh nghiệp]', currentBusiness.name).replace('[Mã đơn hàng]', 'UPGRADE')}</p>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Your plan will be activated once our team confirms the payment.</p>
                </div>
            )}
            
            <div>
                <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                    <h3 className="text-xl font-bold text-neutral-dark mb-4">Current Plan</h3>
                    {currentPackage ? (
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6">
                            <div>
                                <p className="text-2xl font-bold font-serif text-primary">{currentPackage.name}</p>
                                <p className="text-gray-600 max-w-lg">{currentPackage.description}</p>
                                {currentBusiness.membershipExpiryDate && <p className="text-sm font-semibold mt-2">Expires on: {formatDate(currentBusiness.membershipExpiryDate)}</p>}
                            </div>
                            <button onClick={handleScrollToCompare} className="bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-dark transition-colors self-start sm:self-center flex-shrink-0">
                                Renew / Upgrade Plan
                            </button>
                        </div>
                    ) : <p>Could not load your current plan details.</p>}
                </div>

                <div id="compare-plans-section" className="pt-8">
                    <h3 className="text-xl font-bold text-neutral-dark mb-4">Compare Plans</h3>
                    <div className="overflow-x-auto border rounded-lg bg-white">
                         <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-neutral-dark min-w-[200px]">Feature</th>
                                    {packages.map(pkg => (
                                        <th key={pkg.id} className={`p-4 text-center font-bold min-w-[150px] ${pkg.id === currentPackage?.id ? 'text-primary' : 'text-neutral-dark'}`}>
                                            {pkg.name}
                                            {pkg.isPopular && <span className="block text-xs font-normal text-secondary">Most Popular</span>}
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
                                                <span className="inline-block px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md cursor-default">Current Plan</span>
                                            ) : (
                                                <button onClick={() => handleUpgradeRequest(pkg)} className="px-4 py-2 text-sm font-semibold text-white bg-secondary rounded-md hover:opacity-90 transition-opacity">
                                                    {pkg.price > (currentPackage?.price || 0) ? 'Upgrade' : 'Change Plan'}
                                                </button>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Order History */}
            <div>
                <h3 className="text-xl font-bold text-neutral-dark mb-4">Order History</h3>
                {businessOrders.length > 0 ? (
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
                                        <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
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
                ) : (
                    <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">No orders found.</p>
                )}
            </div>
        </div>
    );
};

export default MembershipAndBilling;
