

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusinessAuth } from '../contexts/BusinessAuthContext';
import { useBusinessData } from '../contexts/BusinessDataContext';
import { StaffMember, NotificationSettings, StaffMemberRole, Business } from '../types.ts';

// Reusable components
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-neutral-dark">{title}</h3>
        </div>
        <div className="p-4 space-y-4">
            {children}
        </div>
    </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input {...props} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
    </div>
);

const Toggle: React.FC<{ label: string; enabled: boolean; onChange: () => void }> = ({ label, enabled, onChange }) => (
    <label className="flex items-center justify-between cursor-pointer">
        <span className="text-gray-700">{label}</span>
        <div className="relative">
            <input type="checkbox" className="sr-only" checked={enabled} onChange={onChange} />
            <div className="block bg-gray-200 w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${enabled ? 'translate-x-full bg-primary' : ''}`}></div>
        </div>
    </label>
);

const Spinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const AccountSettings: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { updateBusiness } = useBusinessData();
    
    const [formData, setFormData] = useState<Business | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentBusiness) {
            // Deep copy to prevent direct mutation of context state
            setFormData(JSON.parse(JSON.stringify(currentBusiness)));
        }
    }, [currentBusiness]);

    if (!formData) return null;

    const handleOwnerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Note: This changes business name, email, phone which might be distinct from owner info
        // In a more complex app, owner info would be in the 'profiles' table.
        // For now, we edit the business contact info.
        setFormData(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
    };
    
    const handleNotificationChange = (key: keyof NotificationSettings) => {
        setFormData(prev => {
            if (!prev) return null;
            const currentSettings = prev.notificationSettings || { reviewAlerts: false, bookingRequests: false, platformNews: false };
            return {
                ...prev,
                notificationSettings: {
                    ...currentSettings,
                    [key]: !currentSettings[key]
                }
            };
        });
    };

    const handleAddStaff = () => {
        const newStaff: StaffMember = {
            id: crypto.randomUUID(),
            name: '',
            email: '',
            role: StaffMemberRole.EDITOR,
        };
        setFormData(prev => prev ? { ...prev, staff: [...(prev.staff || []), newStaff] } : null);
    };

    const handleStaffChange = (index: number, field: keyof Omit<StaffMember, 'id'>, value: string) => {
        setFormData(prev => {
            if (!prev) return null;
            const updatedStaff = [...(prev.staff || [])];
            if (updatedStaff[index]) {
                 updatedStaff[index] = { ...updatedStaff[index], [field]: value as any };
            }
            return { ...prev, staff: updatedStaff };
        });
    };

    const handleRemoveStaff = (id: string) => {
        setFormData(prev => prev ? { ...prev, staff: (prev.staff || []).filter(s => s.id !== id) } : null);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const savePromise = updateBusiness(formData);

        toast.promise(savePromise, {
            loading: 'Saving settings...',
            success: 'Settings saved successfully!',
            error: 'Failed to save settings.',
        }).finally(() => {
            setIsSaving(false);
        });
    };
    
    return (
        <form onSubmit={handleSave} className="p-8 bg-gray-50/50 space-y-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark">Account Settings</h2>
            
            <SectionCard title="Contact Information">
                <InputField label="Business Name" name="name" value={formData.name} onChange={handleOwnerInfoChange} />
                <InputField label="Contact Email" type="email" name="email" value={formData.email || ''} onChange={handleOwnerInfoChange} />
                <InputField label="Contact Phone" type="tel" name="phone" value={formData.phone} onChange={handleOwnerInfoChange} />
            </SectionCard>

            <SectionCard title="Change Password">
                <p className="text-sm text-gray-500">This feature is managed through your main login page. If you've forgotten your password, please log out and use the "Forgot Password" link.</p>
                <button type="button" disabled className="px-4 py-2 bg-primary text-white rounded-md opacity-50 cursor-not-allowed">
                    Update Password
                </button>
            </SectionCard>
            
            <SectionCard title="Staff Management (for notifications, etc.)">
                <div className="space-y-3">
                    {(formData.staff || []).map((member, index) => (
                        <div key={member.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-md">
                            <input value={member.name} onChange={e => handleStaffChange(index, 'name', e.target.value)} placeholder="Name" className="md:col-span-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                            <input type="email" value={member.email} onChange={e => handleStaffChange(index, 'email', e.target.value)} placeholder="Email" className="md:col-span-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
                            <select value={member.role} onChange={e => handleStaffChange(index, 'role', e.target.value)} className="md:col-span-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
                                {Object.values(StaffMemberRole).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            <button type="button" onClick={() => handleRemoveStaff(member.id)} className="text-red-500 font-semibold text-sm hover:underline justify-self-end">Remove</button>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddStaff} className="text-secondary font-semibold text-sm hover:underline mt-2">+ Add Staff Member</button>
            </SectionCard>

            <SectionCard title="Notification Settings">
                <Toggle label="Email me about new reviews" enabled={formData.notificationSettings?.reviewAlerts || false} onChange={() => handleNotificationChange('reviewAlerts')} />
                <Toggle label="Email me about new booking requests" enabled={formData.notificationSettings?.bookingRequests || false} onChange={() => handleNotificationChange('bookingRequests')} />
                <Toggle label="Email me about platform news and updates" enabled={formData.notificationSettings?.platformNews || false} onChange={() => handleNotificationChange('platformNews')} />
            </SectionCard>
            
            <div className="flex justify-end pt-6 border-t">
                 <button 
                    type="submit" 
                    disabled={isSaving} 
                    className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors flex items-center justify-center ${isSaving ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'}`}
                >
                    {isSaving ? <><Spinner/> Saving...</> : 'Save All Settings'}
                </button>
            </div>
        </form>
    );
};

export default AccountSettings;