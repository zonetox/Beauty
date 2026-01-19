

import React, { useState } from 'react';
// FIX: Import the correct `useHomepageData` hook from the dedicated HomepageDataContext.
import { useHomepageData } from '../contexts/HomepageDataContext.tsx';
import { HomepageData, HeroSlide } from '../types.ts';
import toast from 'react-hot-toast';

const HomepageEditor: React.FC = () => {
    const { homepageData, updateHomepageData } = useHomepageData();
    const [data, setData] = useState<HomepageData>(JSON.parse(JSON.stringify(homepageData)));

    const handleSlideChange = (index: number, field: keyof HeroSlide, value: string) => {
        const newSlides = [...data.heroSlides];
        newSlides[index] = { ...newSlides[index], [field]: value };
        setData(prev => ({ ...prev, heroSlides: newSlides }));
    };

    const handleAddSlide = () => {
        const newSlide: HeroSlide = { title: 'New Slide Title', subtitle: 'New slide subtitle.', imageUrl: 'https://picsum.photos/seed/new-slide/1920/1080' };
        setData(prev => ({ ...prev, heroSlides: [...prev.heroSlides, newSlide] }));
    };

    const handleRemoveSlide = (index: number) => {
        setData(prev => ({ ...prev, heroSlides: prev.heroSlides.filter((_, i) => i !== index) }));
    };

    const handleSectionVisibilityChange = (id: string) => {
        const newSections = data.sections.map(section =>
            section.id === id ? { ...section, visible: !section.visible } : section
        );
        setData(prev => ({ ...prev, sections: newSections }));
    };
    
    const handleSave = () => {
        updateHomepageData(data);
        toast.success('Homepage content saved!');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-neutral-dark">Homepage Editor</h2>
                <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-primary-dark">Save Homepage</button>
            </div>

            {/* Hero Slides Editor */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-neutral-dark">Hero Slides</h3>
                <div className="space-y-4">
                    {data.heroSlides.map((slide, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <input value={slide.title} onChange={e => handleSlideChange(index, 'title', e.target.value)} className="w-full p-2 border rounded" placeholder="Title" />
                                <textarea value={slide.subtitle} onChange={e => handleSlideChange(index, 'subtitle', e.target.value)} className="w-full p-2 border rounded" placeholder="Subtitle" rows={2} />
                                <input value={slide.imageUrl} onChange={e => handleSlideChange(index, 'imageUrl', e.target.value)} className="w-full p-2 border rounded" placeholder="Image URL" />
                            </div>
                            <div className="flex flex-col items-center justify-between">
                                <img src={slide.imageUrl} alt="preview" className="w-full h-24 object-cover rounded mb-2" />
                                <button onClick={() => handleRemoveSlide(index)} className="text-red-500 font-semibold text-sm hover:underline">Remove Slide</button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleAddSlide} className="mt-4 bg-secondary text-white px-3 py-1 rounded-md text-sm font-semibold">+ Add Slide</button>
            </div>
            
            {/* Sections Editor */}
             <div>
                <h3 className="text-lg font-semibold mb-4 text-neutral-dark">Homepage Sections</h3>
                <p className="text-sm text-gray-500 mb-4">Toggle visibility of sections on the homepage. Reordering is not available in this version.</p>
                <div className="space-y-3">
                    {data.sections.map(section => (
                        <div key={section.id} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{section.title}</p>
                                <p className="text-xs text-gray-500">{section.subtitle}</p>
                            </div>
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input type="checkbox" className="sr-only" checked={section.visible} onChange={() => handleSectionVisibilityChange(section.id)} />
                                    <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${section.visible ? 'translate-x-full bg-primary' : ''}`}></div>
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomepageEditor;
