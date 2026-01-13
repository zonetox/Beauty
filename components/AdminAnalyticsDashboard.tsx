import React, { useState, useMemo, useEffect } from 'react';
import { Business, Order, OrderStatus, MembershipTier, ChartDataPoint, RegistrationRequest, PageView } from '../types.ts';
import AdminStatCard from './AdminStatCard.tsx';
import AnalyticsChart from './AnalyticsChart.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import { snakeToCamel } from '../lib/utils.ts';

type TimeRange = '7d' | '30d' | 'month';

const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const BusinessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;


const FilterButton: React.FC<{ label: string; value: TimeRange; active: boolean; onClick: () => void }> = ({ label, value, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
        {label}
    </button>
);

const Leaderboard: React.FC<{ title: string; data: { name: string; value: string | number }[], icon: React.ReactNode }> = ({ title, data, icon }) => (
    <div className="bg-white p-6 rounded-lg shadow h-full">
        <h3 className="text-lg font-semibold text-neutral-dark mb-4 flex items-center gap-2">{icon}{title}</h3>
        {data.length > 0 ? (
            <ol className="space-y-3">
                {data.map((item, index) => (
                    <li key={index} className="flex items-center gap-4 text-sm p-2 rounded-md hover:bg-gray-50">
                        <span className={`font-bold w-6 text-center text-lg ${index < 3 ? 'text-primary' : 'text-gray-500'}`}>{index + 1}.</span>
                        <span className="flex-grow font-medium text-neutral-dark truncate" title={item.name}>{item.name}</span>
                        <span className="font-semibold text-gray-600 flex-shrink-0">{item.value}</span>
                    </li>
                ))}
            </ol>
        ) : <p className="text-sm text-gray-500 text-center py-8">No data available.</p>}
    </div>
);

// Move components outside to avoid "created during render" error
interface FunnelStageData {
    label: string;
    value: number;
    color: string;
}

const FunnelStage: React.FC<{ stage: FunnelStageData, baseValue: number }> = ({ stage, baseValue }) => {
    const percentage = baseValue > 0 ? (stage.value / baseValue) * 100 : 0;
    return (
        <div className="flex items-center justify-center">
            <div className={`relative ${stage.color} text-white font-bold py-4 text-center`} style={{ width: `${Math.max(percentage, 10)}%` }}>
                <div className="px-2">
                    <p className="text-lg">{stage.value}</p>
                    <p className="text-xs opacity-90">{stage.label}</p>
                </div>
            </div>
        </div>
    );
};

const ConversionRate: React.FC<{ from: number, to: number }> = ({ from, to }) => {
    const rate = from > 0 ? ((to / from) * 100).toFixed(1) : '0.0';
    return (
         <div className="flex items-center justify-center my-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                <span>{rate}%</span>
            </div>
        </div>
    );
};

const ConversionFunnel: React.FC<{ requests: RegistrationRequest[], orders: Order[] }> = ({ requests, orders }) => {
    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => r.status === 'Approved').length;
    const completedPayments = orders.filter(o => o.status === OrderStatus.COMPLETED).length;

    const stages: FunnelStageData[] = [
        { label: 'Submitted Requests', value: totalRequests, color: 'bg-indigo-500' },
        { label: 'Approved Requests', value: approvedRequests, color: 'bg-blue-500' },
        { label: 'Completed Payments', value: completedPayments, color: 'bg-green-500' },
    ];

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full">
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Conversion Funnel</h3>
            <div className="space-y-0">
                <FunnelStage stage={stages[0]} baseValue={totalRequests} />
                <ConversionRate from={stages[0].value} to={stages[1].value} />
                <FunnelStage stage={stages[1]} baseValue={totalRequests} />
                <ConversionRate from={stages[1].value} to={stages[2].value} />
                <FunnelStage stage={stages[2]} baseValue={totalRequests} />
            </div>
        </div>
    );
};


const AdminAnalyticsDashboard: React.FC<{ businesses: Business[], orders: Order[], registrationRequests: RegistrationRequest[] }> = ({ businesses, orders, registrationRequests }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [pageViews, setPageViews] = useState<PageView[]>([]);
    const [loadingPageViews, setLoadingPageViews] = useState(true);

    const { startDate, endDate } = useMemo(() => {
        const end = new Date();
        const start = new Date();
        switch (timeRange) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case 'month':
                start.setDate(1);
                start.setHours(0,0,0,0);
                break;
        }
        return { startDate: start, endDate: end };
    }, [timeRange]);

    // Fetch page views
    useEffect(() => {
        const fetchPageViews = async () => {
            setLoadingPageViews(true);
            try {
                const { data, error } = await supabase
                    .from('page_views')
                    .select('*')
                    .order('viewed_at', { ascending: false });

                if (error) {
                    console.error('Error fetching page views:', error);
                    setPageViews([]);
                } else {
                    setPageViews(snakeToCamel(data) as PageView[]);
                }
            } catch (err) {
                console.error('Error in fetchPageViews:', err);
                setPageViews([]);
            } finally {
                setLoadingPageViews(false);
            }
        };

        fetchPageViews();
    }, []);

    const filteredData = useMemo(() => {
        const filteredOrders = orders.filter(o => {
            const date = new Date(o.confirmedAt || o.submittedAt);
            return date >= startDate && date <= endDate;
        });
        const filteredBusinesses = businesses.filter(b => {
            const date = new Date(b.joinedDate);
            return date >= startDate && date <= endDate;
        });
        const filteredPageViews = pageViews.filter(pv => {
            const date = new Date(pv.viewed_at);
            return date >= startDate && date <= endDate;
        });
        return { orders: filteredOrders, businesses: filteredBusinesses, pageViews: filteredPageViews };
    }, [orders, businesses, pageViews, startDate, endDate]);

    const stats = useMemo(() => {
        const revenue = filteredData.orders
            .filter(o => o.status === OrderStatus.COMPLETED)
            .reduce((sum, o) => sum + o.amount, 0);
        
        // Calculate page view stats
        const totalPageViews = filteredData.pageViews.length;
        const uniqueSessions = new Set(filteredData.pageViews.map(pv => pv.session_id).filter(Boolean)).size;
        const pageViewsByType = filteredData.pageViews.reduce((acc, pv) => {
            acc[pv.page_type] = (acc[pv.page_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        return {
            revenue,
            newOrders: filteredData.orders.length,
            newBusinesses: filteredData.businesses.length,
            totalPageViews,
            uniqueSessions,
            pageViewsByType
        };
    }, [filteredData]);
    
    const revenueChartData: ChartDataPoint[] = useMemo(() => {
        const data: { [key: string]: number } = {};
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        filteredData.orders
            .filter(o => o.status === OrderStatus.COMPLETED && o.confirmedAt)
            .forEach(order => {
                const dateKey = new Date(order.confirmedAt!).toISOString().split('T')[0];
                if (data[dateKey] !== undefined) {
                    data[dateKey] += order.amount;
                }
            });
        
        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [filteredData, startDate, endDate]);

    const pageViewsChartData: ChartDataPoint[] = useMemo(() => {
        const data: { [key: string]: number } = {};
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split('T')[0];
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        filteredData.pageViews.forEach(pv => {
            const dateKey = new Date(pv.viewed_at).toISOString().split('T')[0];
            if (data[dateKey] !== undefined) {
                data[dateKey] += 1;
            }
        });
        
        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [filteredData, startDate, endDate]);
    
    const topViewed = useMemo(() => 
        [...businesses]
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, 5)
            .map(b => ({ name: b.name, value: `${(b.viewCount || 0).toLocaleString()} views` }))
    , [businesses]);

    const topRated = useMemo(() => 
        [...businesses]
            .filter(b => b.reviewCount > 0)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5)
            .map(b => ({ name: b.name, value: `${b.rating.toFixed(1)} ★ (${b.reviewCount})` }))
    , [businesses]);
    
    const handleExport = () => {
        const headers = ["Order ID", "Business Name", "Package", "Amount", "Status", "Date"];
        const rows = filteredData.orders.filter(o => o.status === OrderStatus.COMPLETED).map(order => [
            order.id,
            order.businessName,
            order.packageName,
            order.amount,
            order.status,
            new Date(order.confirmedAt!).toISOString()
        ].join(','));
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `revenue_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-2">
                <FilterButton label="Last 7 Days" value="7d" active={timeRange === '7d'} onClick={() => setTimeRange('7d')} />
                <FilterButton label="Last 30 Days" value="30d" active={timeRange === '30d'} onClick={() => setTimeRange('30d')} />
                <FilterButton label="This Month" value="month" active={timeRange === 'month'} onClick={() => setTimeRange('month')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AdminStatCard title="Total Revenue" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)} icon={<RevenueIcon />} />
                <AdminStatCard title="New Orders" value={stats.newOrders} icon={<OrderIcon />} />
                <AdminStatCard title="New Businesses" value={stats.newBusinesses} icon={<BusinessIcon />} />
            </div>

            {/* Traffic Analytics Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-neutral-dark mb-4">Traffic Analytics</h3>
                {loadingPageViews ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading traffic data...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <AdminStatCard title="Total Page Views" value={stats.totalPageViews.toLocaleString()} icon={<EyeIcon />} />
                            <AdminStatCard title="Unique Sessions" value={stats.uniqueSessions.toLocaleString()} icon={<BusinessIcon />} />
                            <AdminStatCard title="Avg. Views/Day" value={Math.round(stats.totalPageViews / Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))).toLocaleString()} icon={<EyeIcon />} />
                        </div>

                        <div className="mb-6">
                            <AnalyticsChart data={pageViewsChartData} title="Page Views Over Time" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Homepage</p>
                                <p className="text-2xl font-bold text-neutral-dark">{stats.pageViewsByType.homepage || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Business Pages</p>
                                <p className="text-2xl font-bold text-neutral-dark">{stats.pageViewsByType.business || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Blog</p>
                                <p className="text-2xl font-bold text-neutral-dark">{stats.pageViewsByType.blog || 0}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Directory</p>
                                <p className="text-2xl font-bold text-neutral-dark">{stats.pageViewsByType.directory || 0}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AnalyticsChart data={revenueChartData} title="Revenue Over Time" />
                </div>
                <div className="lg:col-span-1">
                    <ConversionFunnel requests={registrationRequests} orders={orders} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Leaderboard title="Most Viewed Businesses" data={topViewed} icon={<EyeIcon />} />
                <Leaderboard title="Top Rated Businesses" data={topRated} icon={<StarIcon />} />
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-neutral-dark">Completed Orders in Period</h3>
                    <button onClick={handleExport} className="text-sm font-semibold bg-secondary text-white px-3 py-1.5 rounded-md hover:opacity-90">Export CSV</button>
                 </div>
                 <div className="overflow-x-auto max-h-96">
                     <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3">Business</th>
                                <th className="px-4 py-3">Package</th>
                                <th className="px-4 py-3">Amount</th>
                                <th className="px-4 py-3">Confirmation Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600">
                             {filteredData.orders.filter(o => o.status === OrderStatus.COMPLETED).map(order => (
                                <tr key={order.id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-neutral-dark">{order.businessName}</td>
                                    <td className="px-4 py-3">{order.packageName}</td>
                                    <td className="px-4 py-3 font-semibold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}</td>
                                    <td className="px-4 py-3">{new Date(order.confirmedAt!).toLocaleDateString('vi-VN')}</td>
                                </tr>
                             ))}
                        </tbody>
                     </table>
                     {filteredData.orders.filter(o => o.status === OrderStatus.COMPLETED).length === 0 && (
                         <p className="text-center text-gray-500 py-8">No completed orders in this period.</p>
                     )}
                 </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsDashboard;