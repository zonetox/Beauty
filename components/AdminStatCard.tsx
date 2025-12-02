import React from 'react';

const AdminStatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' }> = ({ title, value, icon, change, changeType }) => {
    const changeColor = changeType === 'increase' ? 'text-green-600' : 'text-red-600';
    const changeIcon = changeType === 'increase' ? '↑' : '↓';

    return (
        <div className="bg-white p-6 rounded-lg shadow flex items-center">
            <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
            <div className="ml-4">
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-neutral-dark">{value}</p>
                {change && (
                    <p className={`text-xs font-semibold ${changeColor}`}>
                        {changeIcon} {change}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AdminStatCard;
