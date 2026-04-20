import React, { useState, useEffect } from 'react';
import { useCMS } from '../contexts/CMSContext.tsx';

interface EditableProps {
    id: string;
    type: 'text' | 'textarea' | 'image';
    value: string;
    className?: string;
    children: React.ReactNode;
}

const Editable: React.FC<EditableProps> = ({ id, type, value, className = '', children }) => {
    const { isEditing, setStagedChange, stagedChanges } = useCMS();
    const [localValue, setLocalValue] = useState(value);

    // Sync with global staged changes if any, otherwise with initial value
    const currentValue = stagedChanges[id] !== undefined ? stagedChanges[id] : value;

    useEffect(() => {
        setLocalValue(currentValue);
    }, [currentValue]);

    if (!isEditing) {
        return <>{children}</>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newVal = e.target.value;
        setLocalValue(newVal);
        setStagedChange(id, newVal);
    };

    return (
        <div className={`relative group border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors p-1 rounded ${className}`}>
            {/* Edit Indicator Overlay */}
            <div className="absolute -top-3 -right-3 z-20 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Sửa {type === 'image' ? 'Ảnh' : 'Chữ'}
            </div>

            {type === 'text' && (
                <input
                    type="text"
                    value={localValue}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none focus:ring-2 focus:ring-primary/30 rounded px-1 text-inherit font-inherit"
                />
            )}

            {type === 'textarea' && (
                <textarea
                    value={localValue}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-transparent border-none focus:ring-2 focus:ring-primary/30 rounded px-1 text-inherit font-inherit resize-none"
                />
            )}

            {type === 'image' && (
                <div className="relative">
                    {children}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded">
                        <div className="bg-white text-primary px-3 py-1 rounded-md text-sm font-bold shadow-lg">
                            Thay đổi URL ảnh
                        </div>
                        <input
                            type="text"
                            value={localValue}
                            onChange={handleChange}
                            placeholder="Nhập URL ảnh mới..."
                            className="absolute bottom-2 left-2 right-2 p-2 rounded border border-primary text-xs"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Editable;
