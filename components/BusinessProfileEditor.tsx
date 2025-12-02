import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessAuthContext.tsx';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { BusinessCategory, Deal, Service, Business, TeamMember, StaffMember, NotificationSettings, StaffMemberRole } from '../types.ts';
import { GoogleGenAI } from "@google/genai";
import { uploadFile } from '../lib/storage.ts';

// FIX: Define blobToBase64 helper function to handle file to base64 conversion.
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
    </div>
);

const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
    </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
            active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {children}
    </button>
);

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const BusinessProfileEditor: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { updateBusiness } = useBusinessData();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Business>(JSON.parse(JSON.stringify(currentBusiness)));
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    
    const [newTeamMember, setNewTeamMember] = useState<TeamMember>({ id: '', business_id: 0, name: '', role: '', image_url: '' });
    
    const [logoPrompt, setLogoPrompt] = useState('');
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    const [logoGenerationError, setLogoGenerationError] = useState<string | null>(null);
    const [generatedLogoUrl, setGeneratedLogoUrl] = useState<string | null>(null);

    // AI Description Generation State
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [aiKeywords, setAiKeywords] = useState('');
    const [generatedDescription, setGeneratedDescription] = useState('');
    const [aiError, setAiError] = useState('');
    
    const [workingHoursList, setWorkingHoursList] = useState(
        Object.entries(currentBusiness?.workingHours || {}).map(([day, time]) => ({ day, time }))
    );

    useEffect(() => {
        const newWorkingHoursObject = workingHoursList.reduce((acc, curr) => {
            if (curr.day.trim()) {
                acc[curr.day.trim()] = curr.time.trim();
            }
            return acc;
        }, {} as { [key: string]: string });
        
        setFormData(prev => ({ ...prev, workingHours: newWorkingHoursObject }));
    }, [workingHoursList]);


    if (!currentBusiness) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumeric = type === 'number';
        setFormData((prev) => ({ ...prev, [name]: isNumeric ? parseFloat(value) : value }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        const category = value as BusinessCategory;

        setFormData(prev => {
            const currentCategories = prev.categories || [];
            if (checked) {
                return { ...prev, categories: [...new Set([...currentCategories, category])] };
            } else {
                const newCategories = currentCategories.filter(c => c !== category);
                return { ...prev, categories: newCategories.length > 0 ? newCategories : currentCategories };
            }
        });
    };
    
    const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast.error("File is too large. Please select a file smaller than 4MB.");
                return;
            }
            const uploadPromise = uploadFile('business-assets', file, `${currentBusiness.id}/logos`);
            toast.promise(uploadPromise, {
                loading: 'Uploading logo...',
                success: (publicUrl) => {
                    setFormData((prev) => ({ ...prev, logoUrl: publicUrl }));
                    setGeneratedLogoUrl(null);
                    return 'Logo uploaded successfully!';
                },
                error: 'Failed to upload logo. Please try again.',
            });
        }
    };

    const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast.error("File is too large. Please select a file smaller than 4MB.");
                return;
            }
            const uploadPromise = uploadFile('business-assets', file, `${currentBusiness.id}/covers`);
            toast.promise(uploadPromise, {
                loading: 'Uploading cover image...',
                success: (publicUrl) => {
                    setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
                    return 'Cover image uploaded successfully!';
                },
                error: 'Failed to upload cover image. Please try again.',
            });
        }
    };
    
    const generateDescription = async () => {
        setIsGeneratingDesc(true);
        setAiError('');
        setGeneratedDescription('');
        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set for AI features.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Write a compelling and professional business description in Vietnamese for a beauty business.
            - Business Name: ${formData.name}
            - Category: ${formData.categories.join(', ')}
            - Key attributes: ${aiKeywords || 'high-quality, professional, friendly'}
            
            The description should be around 2-3 paragraphs long, inviting, and highlight the key features. Do not use markdown formatting.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const text = response.text;
            setGeneratedDescription(text);

        } catch (e) {
            setAiError('Failed to generate description. Please check your connection or API key.');
            console.error(e);
        } finally {
            setIsGeneratingDesc(false);
        }
    };


    const handleGenerateLogo = async () => {
        if (!logoPrompt.trim()) {
            setLogoGenerationError('Please enter a description for your logo.');
            return;
        }
        setIsGeneratingLogo(true);
        setLogoGenerationError(null);
        setGeneratedLogoUrl(null);

        try {
            if (!process.env.API_KEY) {
                throw new Error("API key is not configured.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const fullPrompt = `A modern, minimalist logo for a '${formData.categories[0]}' named '${formData.name}'. The logo should be simple, elegant, and suitable for a beauty brand. Additional guidance: ${logoPrompt}. Use a transparent background.`;
            
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/png',
                  aspectRatio: '1:1',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                setGeneratedLogoUrl(imageUrl);
            } else {
                throw new Error("No image was generated. Please try a different prompt.");
            }
        } catch (e) {
            console.error("Logo generation failed:", e);
            setLogoGenerationError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsGeneratingLogo(false);
        }
    };

    const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, seo: { ...(prev.seo || {}), [name]: value } }));
    };
    
    const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, socials: { ...(prev.socials || {}), [name]: value } }));
    };
    
    const handleWorkingHoursListChange = (index: number, field: 'day' | 'time', value: string) => {
        const newList = [...workingHoursList];
        newList[index][field] = value;
        setWorkingHoursList(newList);
    };

    const addWorkingHoursRow = () => {
        setWorkingHoursList([...workingHoursList, { day: '', time: '' }]);
    };

    const removeWorkingHoursRow = (index: number) => {
        setWorkingHoursList(workingHoursList.filter((_, i) => i !== index));
    };

    const handleTeamChange = (index: number, field: keyof Omit<TeamMember, 'imageUrl'>, value: string) => {
        setFormData(prev => {
            const updatedTeam = [...(prev.team || [])];
            if(updatedTeam[index]) {
                updatedTeam[index] = { ...updatedTeam[index], [field]: value };
            }
            return {...prev, team: updatedTeam};
        });
    };
    const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await blobToBase64(file);
            setFormData(prev => {
                const updatedTeam = [...(prev.team || [])];
                if(updatedTeam[index]) {
                    updatedTeam[index].image_url = base64 as string;
                }
                return { ...prev, team: updatedTeam };
            });
        }
    };
    const handleRemoveTeamMember = (index: number) => {
        setFormData(prev => ({...prev, team: (prev.team || []).filter((_, i) => i !== index)}));
    };
    const handleNewTeamMemberImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const base64 = await blobToBase64(file);
            setNewTeamMember(m => ({ ...m, image_url: base64 as string }));
        }
    };
    const handleAddTeamMember = () => {
      if(newTeamMember.name && newTeamMember.role) {
          const memberToAdd: TeamMember = {
              ...newTeamMember,
              id: crypto.randomUUID(),
              business_id: currentBusiness.id,
              image_url: newTeamMember.image_url || `https://picsum.photos/seed/team-${Date.now()}/200/200`
          };
          setFormData(prev => ({...prev, team: [...(prev.team || []), memberToAdd]}));
          setNewTeamMember({id: '', business_id: 0, name: '', role: '', image_url: ''});
      }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const savePromise = new Promise(resolve => setTimeout(() => {
            updateBusiness(formData);
            resolve('Profile updated');
        }, 1000));

        toast.promise(savePromise, {
            loading: 'Saving profile...',
            success: 'Profile saved successfully!',
            error: 'Failed to save profile.',
        }).finally(() => {
            setIsSaving(false);
        });
    };


    return (
        <form onSubmit={handleSave} className="divide-y divide-gray-200">
            <div className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">Landing Page Editor</h2>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate(`/business/${currentBusiness.slug}`)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                        Preview Page
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSaving} 
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors flex items-center justify-center min-w-[120px] ${isSaving ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'}`}
                    >
                        {isSaving ? <><Spinner/> Saving...</> : 'Save Changes'}
                    </button>
                </div>
            </div>

             <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex space-x-2 px-6">
                    <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')}>Basic Info</TabButton>
                    <TabButton active={activeTab === 'media'} onClick={() => setActiveTab('media')}>Media & Content</TabButton>
                    <TabButton active={activeTab === 'team'} onClick={() => setActiveTab('team')}>Team</TabButton>
                    <TabButton active={activeTab === 'hours'} onClick={() => setActiveTab('hours')}>Working Hours</TabButton>
                    <TabButton active={activeTab === 'social'} onClick={() => setActiveTab('social')}>Social & SEO</TabButton>
                </nav>
            </div>


            <div className="p-6 space-y-8">
                {activeTab === 'info' && (
                    <section>
                        <h3 className="text-lg font-semibold text-neutral-dark mb-4">Basic Information</h3>
                        <div className="space-y-4">
                            <InputField label="Brand Name" name="name" value={formData.name} onChange={handleChange} required />
                            <TextareaField label="Detailed Description" name="description" value={formData.description} onChange={handleChange} rows={5} />
                            
                            {/* AI Description Generator */}
                            <div className="p-4 border rounded-lg bg-gray-50">
                                <p className="text-sm font-medium text-gray-700 mb-2">✨ AI Description Generator</p>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={aiKeywords} 
                                        onChange={(e) => setAiKeywords(e.target.value)}
                                        placeholder="Keywords (e.g., luxury, relaxing)" 
                                        className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        disabled={isGeneratingDesc}
                                    />
                                    <button 
                                        type="button" 
                                        onClick={generateDescription}
                                        disabled={isGeneratingDesc}
                                        className="bg-accent text-neutral-dark px-3 py-2 rounded-md font-semibold text-sm hover:opacity-90 disabled:bg-gray-300 flex items-center"
                                    >
                                        {isGeneratingDesc ? <Spinner /> : null} Generate
                                    </button>
                                </div>
                                {aiError && <p className="text-red-500 text-xs mt-2">{aiError}</p>}
                                {generatedDescription && (
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">AI Suggestion:</p>
                                        <p className="text-sm p-3 bg-white border rounded-md whitespace-pre-line">{generatedDescription}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, description: generatedDescription }));
                                                setGeneratedDescription('');
                                            }}
                                            className="mt-2 text-sm font-semibold text-green-600 hover:underline"
                                        >
                                            Use this description
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Categories</label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {Object.values(BusinessCategory).map(cat => (
                                        <label key={cat} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                value={cat}
                                                checked={formData.categories.includes(cat)}
                                                onChange={handleCategoryChange}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <span className="text-sm">{cat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                         <h3 className="text-lg font-semibold text-neutral-dark mt-8 mb-4">Contact & Location</h3>
                         <div className="space-y-4">
                             <InputField label="Address" name="address" value={formData.address} onChange={handleChange} required />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                                <InputField label="Email" name="email" type="email" value={formData.email || ''} onChange={handleChange} />
                             </div>
                             <InputField label="Website" name="website" type="url" value={formData.website || ''} onChange={handleChange} placeholder="https://your-business.com" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <InputField label="Latitude" name="latitude" type="number" step="any" value={formData.latitude || ''} onChange={handleChange} placeholder="e.g., 10.7769" />
                                 <InputField label="Longitude" name="longitude" type="number" step="any" value={formData.longitude || ''} onChange={handleChange} placeholder="e.g., 106.7009" />
                             </div>
                             <p className="text-xs text-gray-500">Coordinates are used for precise map location. You can find them on OpenStreetMap by right-clicking a location.</p>
                         </div>
                    </section>
                )}

                {activeTab === 'media' && (
                     <section className="space-y-8">
                        <div>
                             <h3 className="text-lg font-semibold text-neutral-dark mb-4">Logo & Cover Images</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Logo Management */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-700">Logo</label>
                                    <div className="flex items-center gap-4">
                                        <img src={formData.logoUrl || 'https://placehold.co/128x128/E6A4B4/FFFFFF?text=Logo'} alt="Current Logo" className="w-32 h-32 object-cover rounded-md border bg-gray-100" />
                                        <div>
                                            <label htmlFor="logo-upload" className="cursor-pointer bg-secondary text-white px-3 py-2 text-sm font-semibold rounded-md hover:opacity-90">Upload File</label>
                                            <input id="logo-upload" type="file" className="hidden" accept="image/*" onChange={handleLogoFileUpload} />
                                            <p className="text-xs text-gray-500 mt-2">PNG, JPG. Max 4MB.</p>
                                        </div>
                                    </div>
                                    {/* AI Generator */}
                                    <div className="p-4 border rounded-lg bg-gray-50">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Or, generate logo with AI</p>
                                        <div className="flex gap-2">
                                            <input type="text" value={logoPrompt} onChange={(e) => setLogoPrompt(e.target.value)} placeholder="e.g., minimalist, floral" className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md text-sm" disabled={isGeneratingLogo} />
                                            <button type="button" onClick={handleGenerateLogo} disabled={isGeneratingLogo} className="bg-accent text-neutral-dark px-3 py-2 rounded-md font-semibold text-sm hover:opacity-90 disabled:bg-gray-300">
                                                 {isGeneratingLogo ? '...' : 'Generate'}
                                            </button>
                                        </div>
                                        {logoGenerationError && <p className="text-red-500 text-xs mt-2">{logoGenerationError}</p>}
                                        {generatedLogoUrl && (
                                            <div className="mt-4 pt-3 border-t flex items-center gap-4">
                                                <img src={generatedLogoUrl} alt="AI generated logo" className="w-20 h-20 object-cover rounded-md border" />
                                                <button type="button" onClick={() => setFormData((prev) => ({ ...prev, logoUrl: generatedLogoUrl }))} className="bg-green-600 text-white px-3 py-2 rounded-md font-semibold text-sm hover:bg-green-700">Use This Logo</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Cover Image */}
                                <div>
                                    <InputField label="Cover Image URL" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="https://..." required />
                                     <div className="flex items-center gap-2 mt-2">
                                        <span className="text-sm text-gray-500">Or</span>
                                        <label htmlFor="cover-image-upload" className="cursor-pointer text-sm font-semibold text-secondary hover:underline">
                                            Upload from device
                                        </label>
                                        <input id="cover-image-upload" type="file" className="hidden" accept="image/*" onChange={handleCoverImageUpload} />
                                    </div>
                                    <div className="mt-2 p-4 bg-gray-50 rounded-md border">
                                        <p className="text-sm text-gray-700">This image appears in listings.</p>
                                        <img src={formData.imageUrl || 'https://placehold.co/400x300/E6A4B4/FFFFFF?text=Cover'} alt="Cover preview" className="mt-2 w-full h-auto object-cover rounded-md aspect-video" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="pt-8 border-t">
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Video Content</h3>
                            <InputField label="YouTube Video URL" name="youtubeUrl" value={formData.youtubeUrl || ''} onChange={handleChange} placeholder="https://www.youtube.com/watch?v=..." />
                            <p className="text-xs text-gray-500 mt-1">This video will be featured on your landing page.</p>
                        </div>
                     </section>
                )}
                
                {activeTab === 'team' && (
                    <section>
                         <h3 className="text-lg font-semibold text-neutral-dark mb-4">Team Members</h3>
                        <div className="space-y-3">
                            {(formData.team || []).map((member, index) => (
                              <div key={index} className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-md border">
                                <div className="flex-1 min-w-[150px]">
                                    <label className="text-xs text-gray-500">Name</label>
                                    <input value={member.name} onChange={(e) => handleTeamChange(index, 'name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                    <label className="text-xs text-gray-500">Role</label>
                                    <input value={member.role} onChange={(e) => handleTeamChange(index, 'role', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={member.image_url} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                                    <label htmlFor={`team-image-upload-${index}`} className="cursor-pointer text-sm font-semibold text-secondary hover:underline">
                                        Change Image
                                    </label>
                                    <input id={`team-image-upload-${index}`} type="file" className="hidden" accept="image/*" onChange={(e) => handleTeamImageUpload(e, index)} />
                                </div>
                                <button type="button" onClick={() => handleRemoveTeamMember(index)} className="text-red-500 hover:text-red-700 font-bold p-2">✕</button>
                              </div>
                            ))}
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t items-end">
                                <InputField label="New Member Name" value={newTeamMember.name} onChange={(e) => setNewTeamMember(m => ({...m, name: e.target.value}))} />
                                <InputField label="Role" value={newTeamMember.role} onChange={(e) => setNewTeamMember(m => ({...m, role: e.target.value}))} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                                    <div className="flex items-center gap-2">
                                        <img src={newTeamMember.image_url || 'https://placehold.co/40x40/E6A4B4/FFFFFF?text=Img'} alt="New member preview" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                        <label htmlFor="new-team-image-upload" className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            Upload
                                        </label>
                                        <input id="new-team-image-upload" type="file" className="hidden" accept="image/*" onChange={handleNewTeamMemberImageUpload} />
                                    </div>
                                </div>
                         </div>
                            <div className="text-right mt-4">
                             <button type="button" onClick={handleAddTeamMember} className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm hover:opacity-90">+ Add Member</button>
                           </div>
                    </section>
                )}

                {activeTab === 'hours' && (
                     <section>
                        <h3 className="text-lg font-semibold text-neutral-dark mb-4">Working Hours</h3>
                        <div className="space-y-3">
                            {workingHoursList.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                    <input value={item.day} onChange={(e) => handleWorkingHoursListChange(index, 'day', e.target.value)} placeholder="Day(s) (e.g., Monday - Friday)" className="w-1/3 px-3 py-2 border rounded-md" />
                                    <input value={item.time} onChange={(e) => handleWorkingHoursListChange(index, 'time', e.target.value)} placeholder="Time (e.g., 9:00 - 21:00)" className="flex-grow px-3 py-2 border rounded-md" />
                                    <button type="button" onClick={() => removeWorkingHoursRow(index)} className="text-red-500 font-bold p-2">✕</button>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addWorkingHoursRow} className="mt-3 text-sm text-secondary font-semibold hover:underline">+ Add hours</button>
                    </section>
                )}

                {activeTab === 'social' && (
                    <section className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">Social Media Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField label="Facebook URL" name="facebook" value={formData.socials?.facebook || ''} onChange={handleSocialChange} />
                                <InputField label="Instagram URL" name="instagram" value={formData.socials?.instagram || ''} onChange={handleSocialChange} />
                                <InputField label="Zalo Phone/Link" name="zalo" value={formData.socials?.zalo || ''} onChange={handleSocialChange} />
                                <InputField label="TikTok URL" name="tiktok" value={formData.socials?.tiktok || ''} onChange={handleSocialChange} />
                            </div>
                        </div>
                         <div className="pt-8 border-t">
                            <h3 className="text-lg font-semibold text-neutral-dark mb-4">SEO Settings</h3>
                            <div className="space-y-4">
                                <InputField label="Meta Title" name="title" value={formData.seo?.title || ''} onChange={handleSeoChange} maxLength={60} />
                                <TextareaField label="Meta Description" name="description" value={formData.seo?.description || ''} onChange={handleSeoChange} rows={3} maxLength={160} />
                                <InputField label="Meta Keywords" name="keywords" value={formData.seo?.keywords || ''} onChange={handleSeoChange} />
                            </div>
                        </div>
                    </section>
                )}
            </div>
            
            <div className="p-6 flex justify-end">
                 <button type="submit" disabled={isSaving} className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors flex items-center justify-center min-w-[160px] ${isSaving ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'}`}>
                    {isSaving ? <><Spinner/> Saving...</> : 'Save All Changes'}
                </button>
            </div>
        </form>
    );
};

export default BusinessProfileEditor;