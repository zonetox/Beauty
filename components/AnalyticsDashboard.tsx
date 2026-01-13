// C3.10 - Analytics Dashboard (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { AnalyticsDataPoint, TrafficSource } from '../types.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

// Reusable components
const StatCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-neutral-dark mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
);

const BarChart: React.FC<{ data: AnalyticsDataPoint[]; dataKey: 'pageViews' | 'totalClicks'; title: string }> = ({ data, dataKey, title }) => {
    const values = data.map(d => {
        if (dataKey === 'totalClicks') {
            return d.callClicks + d.contactClicks + d.directionClicks;
        }
        return d[dataKey];
    });
    const maxValue = Math.max(...values, 1); // Avoid division by zero

    if (data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-full flex items-center justify-center">
                <p className="text-gray-500">No data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-full">
            <h3 className="font-semibold text-neutral-dark mb-4">{title}</h3>
            <div className="flex justify-around items-end h-64 space-x-2">
                {data.map((item, index) => (
                    <div key={item.date} className="flex flex-col items-center flex-1 h-full">
                        <div className="flex-grow flex items-end w-full">
                           <div
                                className="w-full bg-primary/20 rounded-t-md hover:bg-primary/40 transition-colors cursor-pointer"
                                style={{ height: `${(values[index] / maxValue) * 100}%` }}
                                title={`${values[index]} ${dataKey === 'pageViews' ? 'page views' : 'clicks'}`}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrafficSources: React.FC<{ sources: TrafficSource[] }> = ({ sources }) => {
    const sourceColors: { [key: string]: string } = {
        Google: 'bg-red-400',
        Homepage: 'bg-blue-400',
        Blog: 'bg-green-400',
        'Direct Search': 'bg-yellow-400',
    };

    if (sources.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-full flex items-center justify-center">
                <p className="text-gray-500">No traffic data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-full">
            <h3 className="font-semibold text-neutral-dark mb-4">Traffic Sources</h3>
            <div className="space-y-3">
                {sources.map(source => (
                    <div key={source.source}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{source.source}</span>
                            <span className="text-gray-500">{source.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className={`${sourceColors[source.source] || 'bg-gray-400'} h-2.5 rounded-full transition-all`} style={{ width: `${source.percentage}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

type TimeRange = '7d' | '30d' | 'month' | 'all';

const AnalyticsDashboard: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getAnalyticsByBusinessId, loading } = useAnalyticsData();
    const [timeRange, setTimeRange] = useState<TimeRange>('7d');

    // Move hooks before early return to follow Rules of Hooks
    const analytics = useMemo(() => {
        if (!currentBusiness) return undefined;
        return getAnalyticsByBusinessId(currentBusiness.id);
    }, [currentBusiness, getAnalyticsByBusinessId]);

    // Filter data by time range
    const filteredData = useMemo(() => {
        if (!analytics) return { timeSeries: [], trafficSources: [] };
        
        const now = new Date();
        let cutoffDate: Date;
        
        switch (timeRange) {
            case '7d':
                cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            default:
                cutoffDate = new Date(0);
        }
        
        const filtered = analytics.timeSeries.filter(item => new Date(item.date) >= cutoffDate);
        return {
            timeSeries: filtered,
            trafficSources: analytics.trafficSources
        };
    }, [analytics, timeRange]);

    const stats = useMemo(() => {
        if (!filteredData.timeSeries.length) return { totalViews: 0, totalClicks: 0, conversionRate: 0, avgTime: 0, totalConversions: 0 };
        const totalViews = filteredData.timeSeries.reduce((sum, item) => sum + item.pageViews, 0);
        const totalClicks = filteredData.timeSeries.reduce((sum, item) => sum + item.callClicks + item.contactClicks + item.directionClicks, 0);
        // Conversion rate: (Total Conversions / Total Page Views) * 100
        const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        const avgTime = analytics?.averageTimeOnPage || 0;
        return {
            totalViews,
            totalClicks,
            conversionRate,
            avgTime: avgTime,
            totalConversions: totalClicks
        };
    }, [filteredData, analytics]);
    
    const handleExport = () => {
        if (!analytics || filteredData.timeSeries.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            // Create CSV content
            const headers = ['Date', 'Page Views', 'Call Clicks', 'Contact Clicks', 'Direction Clicks', 'Total Clicks'];
            const rows = filteredData.timeSeries.map(item => [
                item.date,
                item.pageViews,
                item.callClicks,
                item.contactClicks,
                item.directionClicks,
                item.callClicks + item.contactClicks + item.directionClicks
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `analytics-${currentBusiness.name}-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('Analytics data exported successfully!');
        } catch (error) {
            toast.error('Failed to export analytics data');
            console.error('Export error:', error);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <LoadingState message="Loading analytics..." />
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No analytics data available"
                    message="Analytics data will appear here once your business page starts receiving traffic."
                />
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    const hasData = filteredData.timeSeries.length > 0;

    return (
        <div className="p-8 bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-neutral-dark">Statistics & Analytics</h2>
                    <p className="text-gray-500">Measure your landing page performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={handleExport}
                        disabled={!hasData}
                        className="bg-secondary text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {!hasData ? (
                <EmptyState
                    title="No data for selected period"
                    message={`No analytics data available for ${timeRange === '7d' ? 'the last 7 days' : timeRange === '30d' ? 'the last 30 days' : timeRange === 'month' ? 'this month' : 'all time'}. Try selecting a different time range.`}
                    action={
                        <button
                            onClick={() => setTimeRange('all')}
                            className="text-primary hover:underline"
                        >
                            View All Time
                        </button>
                    }
                />
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Page Views" value={stats.totalViews.toLocaleString()} />
                        <StatCard title="Total Clicks" value={stats.totalClicks.toLocaleString()} subtext="Call, Contact, Directions" />
                        <StatCard title="Conversion Rate" value={`${stats.conversionRate.toFixed(2)}%`} subtext="Clicks / Views" />
                        <StatCard title="Avg. Time on Page" value={formatTime(stats.avgTime)} />
                    </div>

                    {/* Charts & Data */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <BarChart data={filteredData.timeSeries} dataKey="pageViews" title="Page Views Over Time" />
                        </div>
                        <div className="lg:col-span-1">
                            <TrafficSources sources={filteredData.trafficSources} />
                        </div>
                    </div>

                    {/* Additional Chart: Clicks Over Time */}
                    {filteredData.timeSeries.length > 0 && (
                        <div className="mt-8">
                            <BarChart data={filteredData.timeSeries} dataKey="totalClicks" title="Total Clicks Over Time" />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
