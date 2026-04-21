import React, { useState, useMemo, useEffect } from 'react';
import { Business, Order, OrderStatus, ChartDataPoint, RegistrationRequest, PageView } from '../types.ts';
import AdminStatCard from './AdminStatCard.tsx';
import AnalyticsChart from './AnalyticsChart.tsx';
import { supabase } from '../lib/supabaseClient.ts';
import { snakeToCamel } from '../lib/utils.ts';
import { ensureNumber, ensureArray } from '../lib/typeHelpers.ts';

type TimeRange = '7d' | '30d' | 'month';

const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const BusinessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.022 7-9.542 7-4.478 0-8.268-2.943-9.542-7z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;


const FilterButton: React.FC<{ label: string; value: TimeRange; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-6 py-2.5 text-[10px] uppercase font-bold tracking-[0.2em] rounded-full transition-all duration-500 border ${active ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white/40 text-neutral-400 border-white/50 hover:bg-white/60 hover:text-primary'}`}
    >
        {label}
    </button>
);

const Leaderboard: React.FC<{ title: string; data: { name: string; value: string | number }[], icon: React.ReactNode }> = ({ title, data, icon }) => (
    <div className="glass-card p-10 rounded-[2rem] shadow-premium border border-white/40 h-full">
        <h3 className="text-2xl font-serif text-primary mb-8 flex items-center gap-4">{icon}{title}</h3>
        {data.length > 0 ? (
            <ol className="space-y-4">
                {data.map((item, index) => (
                    <li key={index} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-primary/5 transition-all duration-500 group">
                        <span className={`font-serif text-2xl w-8 text-center ${index < 3 ? 'text-gold' : 'text-neutral-300'}`}>{index + 1}</span>
                        <span className="flex-grow text-sm font-light text-primary truncate" title={item.name}>{item.name}</span>
                        <span className="text-[10px] font-bold text-neutral-400-widest group-hover:text-gold transition-colors">{item.value}</span>
                    </li>
                ))}
            </ol>
        ) : <p className="text-sm font-light italic text-neutral-400 text-center py-12">Dữ liệu đang được tinh tuyển...</p>}
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
            <div className={`relative ${stage.color} text-white font-bold py-4 text-center transition-all`} style={{ width: `${Math.max(percentage, 10)}%`, minWidth: '60px' }}>
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
    const totalRequests = ensureArray(requests).length;
    const approvedRequests = ensureArray(requests).filter(r => r?.status === 'Approved').length;
    const completedPayments = ensureArray(orders).filter(o => o?.status === OrderStatus.COMPLETED).length;

    const stages: FunnelStageData[] = [
        { label: 'Yêu cầu đăng ký', value: totalRequests, color: 'bg-primary/80' },
        { label: 'Được chấp thuận', value: approvedRequests, color: 'bg-primary/60' },
        { label: 'Hoàn tất thanh toán', value: completedPayments, color: 'bg-gold/60' },
    ];

    return (
        <div className="glass-card p-10 rounded-[2rem] shadow-premium border border-white/40 h-full">
            <h3 className="text-2xl font-serif text-primary mb-8 tracking-wide">Phễu chuyển đổi</h3>
            <div className="space-y-0">
                {stages[0] && <FunnelStage stage={stages[0]} baseValue={totalRequests} />}
                {stages[0] && stages[1] && <ConversionRate from={stages[0].value} to={stages[1].value} />}
                {stages[1] && <FunnelStage stage={stages[1]} baseValue={totalRequests} />}
                {stages[1] && stages[2] && <ConversionRate from={stages[1].value} to={stages[2].value} />}
                {stages[2] && <FunnelStage stage={stages[2]} baseValue={totalRequests} />}
            </div>
        </div>
    );
};


const AdminAnalyticsDashboard: React.FC<{ businesses: Business[], orders: Order[], registrationRequests: RegistrationRequest[] }> = ({ businesses, orders, registrationRequests }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [pageViews, setPageViews] = useState<PageView[]>([]);
    const [loadingPageViews, setLoadingPageViews] = useState(true);

    const { start_date, end_date } = useMemo(() => {
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
                start.setHours(0, 0, 0, 0);
                break;
        }
        return { start_date: start, end_date: end };
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
            const date = new Date(o.confirmed_at || o.submitted_at);
            return date >= start_date && date <= end_date;
        });
        const filteredBusinesses = businesses.filter(b => {
            const date = new Date(b.joined_date);
            return date >= start_date && date <= end_date;
        });
        const filteredPageViews = pageViews.filter(pv => {
            const date = new Date(pv.viewed_at);
            return date >= start_date && date <= end_date;
        });
        return { orders: filteredOrders, businesses: filteredBusinesses, pageViews: filteredPageViews };
    }, [orders, businesses, pageViews, start_date, end_date]);

    const stats = useMemo(() => {
        const revenue = ensureArray(filteredData?.orders)
            .filter(o => o?.status === OrderStatus.COMPLETED)
            .reduce((sum, o) => sum + ensureNumber(o?.amount, 0), 0);

        // Calculate page view stats
        const pvArray = ensureArray(filteredData?.pageViews);
        const totalPageViews = pvArray.length;
        const uniqueSessions = new Set(pvArray.map(pv => pv?.session_id).filter(Boolean)).size;
        const pageViewsByType = pvArray.reduce((acc, pv) => {
            const pageType = pv?.page_type ?? 'unknown';
            acc[pageType] = (acc[pageType] ?? 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            revenue,
            newOrders: ensureArray(filteredData?.orders).length,
            newBusinesses: ensureArray(filteredData?.businesses).length,
            totalPageViews,
            uniqueSessions,
            pageViewsByType
        };
    }, [filteredData]);

    const revenueChartData: ChartDataPoint[] = useMemo(() => {
        const data: { [key: string]: number } = {};
        const currentDate = new Date(start_date);

        while (currentDate <= end_date) {
            const dateKey = currentDate.toISOString().split('T')[0];
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        ensureArray(filteredData?.orders)
            .filter(o => o?.status === OrderStatus.COMPLETED && o?.confirmed_at)
            .forEach(order => {
                const dateKey = new Date(order?.confirmed_at ?? new Date()).toISOString().split('T')[0];
                if (dateKey && Object.prototype.hasOwnProperty.call(data, dateKey)) {
                    data[dateKey]! += ensureNumber(order?.amount, 0);
                }
            });

        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [filteredData, start_date, end_date]);

    const pageViewsChartData: ChartDataPoint[] = useMemo(() => {
        const data: { [key: string]: number } = {};
        const currentDate = new Date(start_date);

        while (currentDate <= end_date) {
            const dateKey = currentDate.toISOString().split('T')[0];
            data[dateKey] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        ensureArray(filteredData?.pageViews).forEach(pv => {
            const dateKey = new Date(pv?.viewed_at ?? new Date()).toISOString().split('T')[0];
            if (dateKey && Object.prototype.hasOwnProperty.call(data, dateKey)) {
                data[dateKey]! += 1;
            }
        });

        return Object.entries(data).map(([label, value]) => ({ label, value }));
    }, [filteredData, start_date, end_date]);

    const topViewed = useMemo(() =>
        ensureArray(businesses)
            .sort((a, b) => ensureNumber(b?.view_count, 0) - ensureNumber(a?.view_count, 0))
            .slice(0, 5)
            .map(b => ({ name: b?.name ?? 'Unknown', value: `${ensureNumber(b?.view_count, 0).toLocaleString()} views` }))
        , [businesses]);

    const topRated = useMemo(() =>
        ensureArray(businesses)
            .filter(b => ensureNumber(b?.review_count, 0) > 0)
            .sort((a, b) => ensureNumber(b?.rating, 0) - ensureNumber(a?.rating, 0))
            .slice(0, 5)
            .map(b => ({ name: b?.name ?? 'Unknown', value: `${ensureNumber(b?.rating, 0).toFixed(1)} ★ (${ensureNumber(b?.review_count, 0)})` }))
        , [businesses]);

    const handleExport = () => {
        const headers = ["Order ID", "Business Name", "Package", "Amount", "Status", "Date"];
        const rows = filteredData.orders.filter(o => o.status === OrderStatus.COMPLETED).map(order => [
            order.id,
            order.business_name,
            order.package_name,
            order.amount,
            order.status,
            new Date(order.confirmed_at!).toISOString()
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
        <div className="space-y-12 animate-fade-in-up">
            <div className="flex items-center gap-3">
                <FilterButton label="7 Ngày qua" value="7d" active={timeRange === '7d'} onClick={() => setTimeRange('7d')} />
                <FilterButton label="30 Ngày qua" value="30d" active={timeRange === '30d'} onClick={() => setTimeRange('30d')} />
                <FilterButton label="Tháng này" value="month" active={timeRange === 'month'} onClick={() => setTimeRange('month')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AdminStatCard title="Tổng doanh thu" value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)} icon={<RevenueIcon />} />
                <AdminStatCard title="Đơn hàng mới" value={stats.newOrders} icon={<OrderIcon />} />
                <AdminStatCard title="Đối tác mới" value={stats.newBusinesses} icon={<BusinessIcon />} />
            </div>

            {/* Traffic Analytics Section */}
            <div className="glass-card p-10 rounded-[2rem] shadow-premium border border-white/40">
                <h3 className="text-2xl font-serif text-primary mb-10 tracking-wide">Phân tích lưu lượng truy cập</h3>
                {loadingPageViews ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6"></div>
                        <p className="text-sm font-light italic text-neutral-400">Đang đồng bộ dữ liệu truy cập...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <AdminStatCard title="Tổng lượt xem" value={stats.totalPageViews.toLocaleString()} icon={<EyeIcon />} />
                            <AdminStatCard title="Phiên truy cập duy nhất" value={stats.uniqueSessions.toLocaleString()} icon={<BusinessIcon />} />
                            <AdminStatCard title="Trung bình lượt xem/ngày" value={Math.round(stats.totalPageViews / Math.max(1, Math.ceil((end_date.getTime() - start_date.getTime()) / (1000 * 60 * 60 * 24)))).toLocaleString()} icon={<EyeIcon />} />
                        </div>

                        <div className="mb-12">
                            <AnalyticsChart data={pageViewsChartData} title="Biến động lượt xem trang" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Trang chủ', value: stats.pageViewsByType.homepage || 0 },
                                { label: 'Trang doanh nghiệp', value: stats.pageViewsByType.business || 0 },
                                { label: 'Tạp chí Beauty', value: stats.pageViewsByType.blog || 0 },
                                { label: 'Danh bạ', value: stats.pageViewsByType.directory || 0 }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-primary/5 p-6 rounded-2xl border border-primary/5 hover:bg-primary/10 transition-all duration-500 shadow-inner">
                                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">{item.label}</p>
                                    <p className="text-3xl font-serif text-primary">{item.value.toLocaleString()}</p>
                                </div>
                            ))}
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

            <div className="glass-card p-10 rounded-[2rem] shadow-premium border border-white/40">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl font-serif text-primary tracking-wide">Đơn hàng hoàn tất</h3>
                    <button onClick={handleExport} className="text-[10px] uppercase font-bold tracking-[0.2em] bg-gold text-white px-6 py-3 rounded-full hover:scale-105 transition-all shadow-lg shadow-gold/20">Xuất báo cáo CSV</button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest border-b border-primary/5 sticky top-0 bg-background/95 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-5">Đối tác</th>
                                <th className="px-6 py-5">Gói thành viên</th>
                                <th className="px-6 py-5">Giá trị</th>
                                <th className="px-6 py-5">Ngày xác nhận</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600">
                            {filteredData.orders.filter(o => o.status === OrderStatus.COMPLETED).map(order => (
                                <tr key={order.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-5 font-serif text-lg text-primary">{order.business_name}</td>
                                    <td className="px-6 py-5">
                                        <span className="text-[10px] font-bold px-3 py-1 bg-primary/5 text-primary border border-primary/10 rounded-full uppercase tracking-widest">{order.package_name}</span>
                                    </td>
                                    <td className="px-6 py-5 font-serif text-lg text-gold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.amount)}</td>
                                    <td className="px-6 py-5 font-light italic">{new Date(order.confirmed_at!).toLocaleDateString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.orders.filter(o => o.status === OrderStatus.COMPLETED).length === 0 && (
                        <div className="py-20 text-center">
                            <p className="text-sm font-light italic text-neutral-400">Không có dữ liệu đơn hàng trong giai đoạn này.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsDashboard;
