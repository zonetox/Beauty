// C3.13 - Settings (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusiness } from '../contexts/BusinessContext.tsx';
import { StaffMember, NotificationSettings, StaffMemberRole, Business } from '../types.ts';
import LoadingState from './LoadingState.tsx';
import EmptyState from './EmptyState.tsx';

// Reusable components
const SectionCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-neutral-dark">{title}</h3>
        </div>
        <div className="p-4 space-y-4">
            {children}
        </div>
    </div>
);

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    required?: boolean;
}> = ({ label, error, required, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            {...props}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${error ? 'border-red-500' : 'border-gray-300'
                }`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const Toggle: React.FC<{
    label: string;
    enabled: boolean;
    onChange: () => void;
    description?: string;
}> = ({ label, enabled, onChange, description }) => (
    <div className="flex items-start justify-between">
        <div className="flex-1">
            <label className="text-gray-700 font-medium cursor-pointer" onClick={onChange}>{label}</label>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${enabled ? 'bg-primary' : 'bg-gray-200'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
);

const AccountSettings: React.FC = () => {
    const { currentBusiness, updateBusiness } = useBusiness();

    const [formData, setFormData] = useState<Business | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        phone?: string;
        staff?: { [index: number]: { name?: string; email?: string } };
    }>({});

    useEffect(() => {
        if (currentBusiness) {
            // Deep copy to prevent direct mutation of context state
            setFormData(JSON.parse(JSON.stringify(currentBusiness)));
            setErrors({});
        }
    }, [currentBusiness]);

    if (!currentBusiness) {
        return (
            <div className="p-8">
                <EmptyState
                    title="No business found"
                    message="Please select a business to manage settings."
                />
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="p-8">
                <LoadingState message="Loading account settings..." />
            </div>
        );
    }

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Business name must be at least 2 characters';
        } else if (formData.name.trim().length > 200) {
            newErrors.name = 'Business name must be less than 200 characters';
        }

        if (formData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                newErrors.email = 'Please enter a valid email address';
            }
        }

        if (formData.phone) {
            const phoneRegex = /^[0-9+\-\s()]+$/;
            if (!phoneRegex.test(formData.phone)) {
                newErrors.phone = 'Please enter a valid phone number';
            }
        }

        // Validate staff members
        if (formData.staff && formData.staff.length > 0) {
            const staffErrors: { [index: number]: { name?: string; email?: string } } = {};
            formData.staff.forEach((member, index) => {
                if (member.name && member.name.trim().length < 2) {
                    if (!staffErrors[index]) staffErrors[index] = {};
                    staffErrors[index].name = 'Name must be at least 2 characters';
                }
                if (member.email) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(member.email)) {
                        if (!staffErrors[index]) staffErrors[index] = {};
                        staffErrors[index].email = 'Please enter a valid email address';
                    }
                }
            });
            if (Object.keys(staffErrors).length > 0) {
                newErrors.staff = staffErrors;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOwnerInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
        // Clear error when user types
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleNotificationChange = (key: keyof NotificationSettings) => {
        setFormData(prev => {
            if (!prev) return null;
            const currentSettings = prev.notification_settings || {
                review_alerts: false,
                booking_requests: false,
                platform_news: false
            };
            return {
                ...prev,
                notification_settings: {
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
                updatedStaff[index] = { ...updatedStaff[index], [field]: value as unknown as string };
            }
            return { ...prev, staff: updatedStaff };
        });
        // Clear error when user types
        if (errors.staff && errors.staff[index]) {
            setErrors(prev => ({
                ...prev,
                staff: {
                    ...prev.staff,
                    [index]: {
                        ...prev.staff![index],
                        [field]: undefined
                    }
                }
            }));
        }
    };

    const handleRemoveStaff = (id: string) => {
        setFormData(prev => prev ? { ...prev, staff: (prev.staff || []).filter(s => s.id !== id) } : null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors before saving');
            return;
        }

        setIsSaving(true);
        try {
            await updateBusiness(formData);
            toast.success('Settings saved successfully!');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save settings';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="p-8 bg-gray-50/50 space-y-8">
            <h2 className="text-2xl font-bold font-serif text-neutral-dark">Account Settings</h2>

            <SectionCard title="Contact Information">
                <InputField
                    label="Business Name"
                    name="name"
                    value={formData.name}
                    onChange={handleOwnerInfoChange}
                    error={errors.name}
                    required
                />
                <InputField
                    label="Contact Email"
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleOwnerInfoChange}
                    error={errors.email}
                    placeholder="business@example.com"
                />
                <InputField
                    label="Contact Phone"
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleOwnerInfoChange}
                    error={errors.phone}
                    placeholder="+84 123 456 789"
                />
            </SectionCard>

            <SectionCard title="Change Password">
                <p className="text-sm text-gray-600 mb-4">
                    Password changes are managed through your main login page. If you&apos;ve forgotten your password,
                    please log out and use the &quot;Forgot Password&quot; link on the login page.
                </p>
                <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md opacity-50 cursor-not-allowed"
                >
                    Update Password (Not Available Here)
                </button>
            </SectionCard>

            <SectionCard title="Staff Management">
                <p className="text-sm text-gray-600 mb-4">
                    Add staff members who can help manage your business profile. They will receive notifications
                    based on their role.
                </p>
                <div className="space-y-3">
                    {(formData.staff || []).map((member, index) => (
                        <div
                            key={member.id}
                            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start p-3 bg-gray-50 rounded-md border border-gray-200"
                        >
                            <div className="md:col-span-1">
                                <input
                                    value={member.name}
                                    onChange={e => handleStaffChange(index, 'name', e.target.value)}
                                    placeholder="Name"
                                    className={`block w-full px-3 py-2 border rounded-md ${errors.staff?.[index]?.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.staff?.[index]?.name && (
                                    <p className="mt-1 text-xs text-red-500">{errors.staff[index].name}</p>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <input
                                    type="email"
                                    value={member.email}
                                    onChange={e => handleStaffChange(index, 'email', e.target.value)}
                                    placeholder="Email"
                                    className={`block w-full px-3 py-2 border rounded-md ${errors.staff?.[index]?.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.staff?.[index]?.email && (
                                    <p className="mt-1 text-xs text-red-500">{errors.staff[index].email}</p>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <select
                                    id={`staff-role-${index}`}
                                    value={member.role}
                                    onChange={e => handleStaffChange(index, 'role', e.target.value)}
                                    title="Chọn vai trò nhân viên"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    {Object.values(StaffMemberRole).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveStaff(member.id)}
                                className="text-red-500 font-semibold text-sm hover:underline justify-self-end"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    {(!formData.staff || formData.staff.length === 0) && (
                        <p className="text-sm text-gray-500 italic">No staff members added yet.</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleAddStaff}
                    className="text-secondary font-semibold text-sm hover:underline mt-2"
                >
                    + Add Staff Member
                </button>
            </SectionCard>

            <SectionCard title="Notification Settings">
                <p className="text-sm text-gray-600 mb-4">
                    Choose which notifications you want to receive via email.
                </p>
                <div className="space-y-4">
                    <Toggle
                        label="Email me about new reviews"
                        enabled={formData.notification_settings?.review_alerts || false}
                        onChange={() => handleNotificationChange('review_alerts')}
                        description="Get notified when customers leave new reviews"
                    />
                    <Toggle
                        label="Email me about new booking requests"
                        enabled={formData.notification_settings?.booking_requests || false}
                        onChange={() => handleNotificationChange('booking_requests')}
                        description="Get notified when customers request appointments"
                    />
                    <Toggle
                        label="Email me about platform news and updates"
                        enabled={formData.notification_settings?.platform_news || false}
                        onChange={() => handleNotificationChange('platform_news')}
                        description="Receive updates about new features and platform announcements"
                    />
                </div>
            </SectionCard>

            <div className="flex justify-end pt-6 border-t">
                <button
                    type="submit"
                    disabled={isSaving}
                    className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white transition-colors flex items-center justify-center gap-2 ${isSaving
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                        </>
                    ) : (
                        'Save All Settings'
                    )}
                </button>
            </div>
        </form>
    );
};

export default AccountSettings;
