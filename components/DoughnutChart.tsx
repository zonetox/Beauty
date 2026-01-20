import React from 'react';
import { ChartDataPoint } from '../types.ts';

const COLORS = ['#BFA16A', '#4A4A4A', '#EAE0D1', '#A98C5A'];

const DoughnutChart: React.FC<{ data: ChartDataPoint[], title: string }> = ({ data, title }) => {
    // Handle empty data case
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow h-full">
                <h3 className="text-lg font-semibold text-neutral-dark mb-4">{title}</h3>
                <div className="w-full h-[200px] flex items-center justify-center text-gray-500">
                    <p>No data available</p>
                </div>
            </div>
        );
    }
    
    const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
    let cumulativePercent = 0;

    const segments = data.map((item, index) => {
        const value = item.value || 0;
        const percent = totalValue > 0 ? (value / totalValue) : 0;
        const dashArray = 2 * Math.PI * 40; // Circumference of the circle
        const dashOffset = Math.max(dashArray * (1 - percent), 0);
        const rotation = Math.max(cumulativePercent * 360, 0);
        cumulativePercent += percent;

        // Ensure all values are finite
        const safePercent = isFinite(percent) ? percent : 0;
        const safeDashArray = isFinite(dashArray) ? dashArray : 0;
        const safeDashOffset = isFinite(dashOffset) ? dashOffset : 0;
        const safeRotation = isFinite(rotation) ? rotation : 0;

        return {
            ...item,
            percent: safePercent,
            dashArray: safeDashArray,
            dashOffset: safeDashOffset,
            rotation: safeRotation,
            color: COLORS[index % COLORS.length],
        };
    });

    return (
        <div className="bg-white p-6 rounded-lg shadow h-full">
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">{title}</h3>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                        {segments.map((segment, index) => (
                            <circle
                                key={index}
                                r="40"
                                cx="50"
                                cy="50"
                                fill="transparent"
                                stroke={segment.color}
                                strokeWidth="20"
                                strokeDasharray={segment.dashArray}
                                strokeDashoffset={segment.dashOffset}
                                transform={`rotate(${segment.rotation} 50 50)`}
                            >
                              <title>{`${segment.label}: ${segment.value} (${(segment.percent * 100).toFixed(1)}%)`}</title>
                            </circle>
                        ))}
                    </svg>
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-neutral-dark">{totalValue}</p>
                            <p className="text-xs text-gray-500">Total</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1">
                    <ul className="space-y-2">
                        {segments.map((segment, index) => (
                            <li key={index} className="flex items-center text-sm">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: segment.color }}></span>
                                <span className="font-semibold text-neutral-dark">{segment.label}:</span>
                                <span className="ml-auto text-gray-600">{segment.value} ({ (segment.percent * 100).toFixed(1) }%)</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DoughnutChart;