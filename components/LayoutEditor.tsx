import React, { useState, useRef } from 'react';
import { LayoutItem } from '../types.ts';

interface LayoutEditorProps {
    currentLayout: LayoutItem[];
    currentVisibility: { [key: string]: boolean };
    onSave: (newLayout: LayoutItem[], newVisibility: { [key: string]: boolean }) => void;
    onCancel: () => void;
}

const sectionNames: { [key: string]: string } = {
    description: 'Giới thiệu (Description)',
    services: 'Dịch vụ (Services)',
    deals: 'Ưu đãi (Deals)',
    team: 'Đội ngũ (Team)',
    gallery: 'Thư viện ảnh (Gallery)',
    businessBlog: 'Blog Doanh nghiệp',
    reviews: 'Đánh giá (Reviews)',
};

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A10.005 10.005 0 00.458 10c1.274 4.057 5.022 7 9.542 7 1.852 0 3.572-.444 5.077-1.22l-2.185-2.185z" />
    </svg>
);


const LayoutEditor: React.FC<LayoutEditorProps> = ({ currentLayout, currentVisibility, onSave, onCancel }) => {
    const [layout, setLayout] = useState<LayoutItem[]>(currentLayout);
    const [visibility, setVisibility] = useState(currentVisibility);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
    };
    
    const handleDragEnd = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
            dragItem.current = null;
            dragOverItem.current = null;
            return;
        }
        
        const newLayout = [...layout];
        const draggedItemContent = newLayout.splice(dragItem.current, 1)[0];
        newLayout.splice(dragOverItem.current, 0, draggedItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        setLayout(newLayout);
    };

    const handleToggleVisibility = (sectionKey: string) => {
        setVisibility(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };

    const handleAddItem = (type: 'text' | 'rule') => {
        const newItem: LayoutItem = {
            id: crypto.randomUUID(),
            type,
            content: type === 'text' ? 'New Custom Heading' : undefined,
        };
        setLayout(prev => [...prev, newItem]);
    };

    const handleUpdateText = (id: string, content: string) => {
        setLayout(prev => prev.map(item => item.id === id ? { ...item, content } : item));
    };

    const handleRemoveItem = (id: string) => {
        if (window.confirm('Are you sure you want to remove this layout element?')) {
            setLayout(prev => prev.filter(item => item.id !== id));
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg border border-primary/20">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                 <h2 className="text-2xl font-bold font-serif text-neutral-dark">Customize Page Layout</h2>
                 <div className="flex gap-3">
                    <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
                    <button onClick={() => onSave(layout, visibility)} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">Save Layout</button>
                 </div>
            </div>
           
            <div className="bg-gray-50 p-4 rounded-md border flex flex-col sm:flex-row items-center gap-4 mb-6">
                <p className="font-semibold text-neutral-dark flex-grow">Add new elements to your layout:</p>
                <div className="flex gap-2">
                     <button onClick={() => handleAddItem('text')} className="px-4 py-2 text-sm bg-secondary text-white rounded-md hover:opacity-90">Add Text/Heading</button>
                     <button onClick={() => handleAddItem('rule')} className="px-4 py-2 text-sm bg-secondary text-white rounded-md hover:opacity-90">Add Separator</button>
                </div>
            </div>

            <p className="text-gray-500 mb-4">Drag and drop to reorder elements. Use the eye icon to show or hide a section.</p>

            <div className="space-y-3">
                {layout.map((item, index) => {
                    const isSection = item.type === 'section';
                    const isText = item.type === 'text';
                    const isRule = item.type === 'rule';
                    
                    const isVisible = isSection && item.key ? (visibility[item.key] ?? true) : true;

                    return (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-4 p-3 border rounded-md cursor-grab active:cursor-grabbing transition-all ${isVisible ? 'bg-white' : 'bg-gray-200 opacity-70'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                            
                            <div className="flex-grow">
                                {isSection && <span className="font-medium text-neutral-dark">{sectionNames[item.key!] || item.key}</span>}
                                {isText && (
                                    <input 
                                        type="text"
                                        value={item.content}
                                        onChange={e => handleUpdateText(item.id, e.target.value)}
                                        className="w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                                    />
                                )}
                                {isRule && <hr className="border-t-2 border-dashed border-gray-300"/>}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {isSection && item.key && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleToggleVisibility(item.key!)}
                                        title={isVisible ? 'Hide Section' : 'Show Section'}
                                        className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
                                    >
                                        {isVisible ? <EyeIcon /> : <EyeOffIcon />}
                                    </button>
                                )}
                                {!isSection && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.id)}
                                        title="Delete Element"
                                        className="p-1 rounded-full text-red-500 hover:bg-red-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LayoutEditor;
