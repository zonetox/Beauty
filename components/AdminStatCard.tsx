import React from 'react';

const AdminStatCard: React.FC<{ title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' }> = ({ title, value, icon, change, changeType }) => {
    return (
        <div className="glass-card p-10 rounded-[2rem] flex flex-col justify-between shadow-premium hover:-translate-y-2 transition-all duration-700 border border-white/40 group">
            <div className="flex items-center justify-between mb-8">
                <div className="bg-primary/5 text-primary p-5 rounded-full group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">{icon}</div>
                {change && (
                    <span className={`text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full uppercase border ${changeType === 'increase' ? 'bg-green-500/5 text-green-600 border-green-500/10' : 'bg-red-500/5 text-red-600 border-red-500/10'}`}>
                        {changeType === 'increase' ? '↑' : '↓'} {change}
                    </span>
                )}
            </div>
            <div>
                <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{title}</p>
                <p className="text-4xl font-serif text-primary tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default AdminStatCard;
