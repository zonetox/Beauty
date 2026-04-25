import React from 'react';

interface BentoStatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: string;
    onClick?: () => void;
    className?: string;
    description?: string;
}

const BentoStatCard: React.FC<BentoStatCardProps> = ({
    title,
    value,
    icon,
    change,
    onClick,
    className = '',
    description
}) => {
    return (
        <div
            onClick={onClick}
            className={`
                group relative overflow-hidden
                glass-card p-8 rounded-[2.5rem]
                border border-white/40 shadow-premium
                transition-all duration-500 hover:-translate-y-2
                ${onClick ? 'cursor-pointer active:scale-95' : ''}
                ${className}
            `}
        >
            {/* Background Glow Effect */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between mb-4">
                    <div className="
                        p-4 rounded-2xl bg-white/50 border border-white/20
                        text-primary shadow-sm
                        group-hover:bg-primary group-hover:text-white group-hover:shadow-lg
                        transition-all duration-500
                    ">
                        {icon}
                    </div>
                    {change && (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold tracking-tighter text-accent bg-accent/5 px-2 py-1 rounded-lg">
                                {change}
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                        {title}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl md:text-5xl font-outfit font-semibold text-primary tracking-tight">
                            {value}
                        </span>
                    </div>
                    {description && (
                        <p className="text-neutral-400 text-[10px] font-light italic mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BentoStatCard;
