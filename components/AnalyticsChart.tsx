import React from 'react';
import { ChartDataPoint } from '../types.ts';

const AnalyticsChart: React.FC<{ data: ChartDataPoint[], title: string }> = ({ data, title }) => {
    const chartHeight = 250;
    const chartWidth = 500; // SVG viewbox width
    const maxValue = Math.max(...data.map(d => d.value), 0);
    const yAxisLabels = [0, maxValue / 2, maxValue];

    const formatCurrency = (value: number) => {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}tr`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
        return value;
    };
    
    return (
        <div className="bg-white p-6 rounded-lg shadow h-full">
            <h3 className="text-lg font-semibold text-neutral-dark mb-4">{title}</h3>
            <div className="w-full h-[300px]">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Y-axis labels and grid lines */}
                    {yAxisLabels.map((label, index) => (
                        <g key={index}>
                            <text
                                x="0"
                                y={chartHeight - (label / maxValue * (chartHeight - 20))}
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
                                y1={chartHeight - (label / maxValue * (chartHeight - 20))}
                                y2={chartHeight - (label / maxValue * (chartHeight - 20))}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                            />
                        </g>
                    ))}

                    {/* Bars and X-axis labels */}
                    {data.map((point, index) => {
                        const barWidth = (chartWidth - 30) / data.length * 0.8;
                        const barHeight = point.value > 0 ? (point.value / maxValue * (chartHeight - 20)) : 0;
                        const x = 30 + (index * ((chartWidth - 30) / data.length)) + ((chartWidth - 30) / data.length * 0.1);
                        const y = chartHeight - barHeight;

                        return (
                            <g key={point.label} className="group">
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
                                    {new Date(point.label).toLocaleDateString('en-US', { day: 'numeric'})}
                                </text>
                                <title>{`${new Date(point.label).toLocaleDateString()}: ${new Intl.NumberFormat('vi-VN').format(point.value)} VND`}</title>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default AnalyticsChart;