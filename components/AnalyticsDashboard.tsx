import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth, useAnalyticsData } from '../contexts/BusinessContext.tsx';
import { AnalyticsDataPoint, TrafficSource } from '../types';

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

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100 h-full">
            <h3 className="font-semibold text-neutral-dark mb-4">{title}</h3>
            <div className="flex justify-around items-end h-64 space-x-2">
                {data.map((item, index) => (
                    <div key={item.date} className="flex flex-col items-center flex-1 h-full">
                        <div className="flex-grow flex items-end w-full">
                           <div
                                className="w-full bg-primary/20 rounded-t-md hover:bg-primary/40 transition-colors"
                                style={{ height: `${(values[index] / maxValue) * 100}%` }}
                                title={`${values[index]} ${dataKey.replace('page', ' page')}`}
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
                            <div className={`${sourceColors[source.source]} h-2.5 rounded-full`} style={{ width: `${source.percentage}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const AnalyticsDashboard: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { getAnalyticsByBusinessId } = useAnalyticsData();

    const analytics = useMemo(() => {
        if (!currentBusiness) return null;
        return getAnalyticsByBusinessId(currentBusiness.id);
    }, [currentBusiness, getAnalyticsByBusinessId]);

    const stats = useMemo(() => {
        if (!analytics) return { totalViews: 0, totalClicks: 0, conversionRate: 0, avgTime: 0 };
        const totalViews = analytics.timeSeries.reduce((sum, item) => sum + item.pageViews, 0);
        const totalClicks = analytics.timeSeries.reduce((sum, item) => sum + item.callClicks + item.contactClicks + item.directionClicks, 0);
        const conversionRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        return {
            totalViews,
            totalClicks,
            conversionRate,
            avgTime: analytics.averageTimeOnPage
        };
    }, [analytics]);
    
    const handleExport = () => {
        toast.info("Export functionality is not implemented in this demo. In a real application, this would generate a CSV or Excel file.");
    };

    if (!currentBusiness || !analytics) {
        return <div className="p-8 text-center text-gray-500">Analytics data is not available for this business.</div>;
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="p-8 bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-serif text-neutral-dark">Statistics & Analytics</h2>
                    <p className="text-gray-500">Measure your landing page performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
                        <option>Last 7 Days</option>
                        <option disabled>Last 30 Days</option>
                        <option disabled>This Month</option>
                    </select>
                    <button onClick={handleExport} className="bg-secondary text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:opacity-90">
                        Export
                    </button>
                </div>
            </div>

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
                    <BarChart data={analytics.timeSeries} dataKey="pageViews" title="Page Views Over Time" />
                </div>
                <div className="lg:col-span-1">
                    <TrafficSources sources={analytics.trafficSources} />
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;