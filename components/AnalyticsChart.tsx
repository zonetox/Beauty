import React from 'react';
import { ChartDataPoint } from '../types.ts';

const AnalyticsChart: React.FC<{ data: ChartDataPoint[], title: string }> = ({ data, title }) => {
    const chartHeight = 250;
    const chartWidth = 500; // SVG viewbox width
    
    // Handle empty data case
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow h-full">
                <h3 className="text-lg font-semibold text-neutral-dark mb-4">{title}</h3>
                <div className="w-full h-[300px] flex items-center justify-center text-gray-500">
                    <p>No data available</p>
                </div>
            </div>
        );
    }
    
    const maxValue = Math.max(...data.map(d => d.value || 0), 1); // Use 1 as minimum to avoid division by zero
    const yAxisLabels = [0, maxValue / 2, maxValue];

    const formatCurrency = (value: number) => {
        if (isNaN(value) || !isFinite(value)) return '0';
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
        return value.toString();
    };
    
    // Helper function to calculate Y position safely
    const calculateY = (label: number): number => {
        if (maxValue === 0 || !isFinite(label) || !isFinite(maxValue)) return chartHeight;
        const ratio = label / maxValue;
        if (!isFinite(ratio)) return chartHeight;
        return chartHeight - (ratio * (chartHeight - 20));
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow h-full">
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">{title}</h3>
            <div className="w-full h-[300px]">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Y-axis labels and grid lines */}
                    {yAxisLabels.map((label, index) => {
                        const yPos = calculateY(label);
                        if (!isFinite(yPos)) return null;
                        
                        return (
                            <g key={index}>
                                <text
                                    x="0"
                                    y={yPos}
                                    dy="0.3em"
                                    fontSize="10"
                                    fill="#9ca3af"
                                    textAnchor="start"
                                >
                                    {formatCurrency(label)}
                                </text>
                                <line
                                    x1="30"
                                    x2={chartWidth}
                                    y1={yPos}
                                    y2={yPos}
                                    stroke="#e5e7eb"
                                    strokeWidth="1"
                                />
                            </g>
                        );
                    })}

                    {/* Bars and X-axis labels */}
                    {data.map((point, index) => {
                        const value = point.value || 0;
                        const safeDataLength = Math.max(data.length, 1);
                        const barWidth = Math.max((chartWidth - 30) / safeDataLength * 0.8, 0);
                        const barHeight = maxValue > 0 && value > 0 
                            ? Math.max((value / maxValue * (chartHeight - 20)), 0) 
                            : 0;
                        const x = 30 + (index * ((chartWidth - 30) / safeDataLength)) + ((chartWidth - 30) / safeDataLength * 0.1);
                        const y = Math.max(chartHeight - barHeight, 0);
                        
                        // Ensure all values are finite numbers
                        if (!isFinite(x) || !isFinite(y) || !isFinite(barWidth) || !isFinite(barHeight)) {
                            return null;
                        }

                        return (
                            <g key={point.label || index} className="group">
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="#BFA16A"
                                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                                />
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight + 10}
                                    fontSize="8"
                                    fill="#6b7280"
                                    textAnchor="middle"
                                >
                                    {point.label ? new Date(point.label).toLocaleDateString('en-US', { day: 'numeric'}) : ''}
                                </text>
                                <title>{`${point.label ? new Date(point.label).toLocaleDateString() : 'N/A'}: ${new Intl.NumberFormat('vi-VN').format(value)} VND`}</title>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default AnalyticsChart;