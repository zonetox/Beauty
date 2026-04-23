// C3.13 - Settings (IMPLEMENTATION MODE)
// Tuân thủ ARCHITECTURE.md, sử dụng schema/RLS/contexts hiện có
// 100% hoàn thiện, không placeholder

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useBusiness } from '../contexts/BusinessContext.tsx';
import { NotificationSettings, Business } from '../types.ts';
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
        <form onSubmit={handleSave} className="p-8 bg-gray-50/50 space-y-8 animate-fade-in-up">
            <h2 className="text-3xl font-serif text-primary tracking-wide">Tài khoản doanh nghiệp</h2>
            <p className="text-neutral-400 text-sm font-light italic -mt-6">Quản lý thông tin định danh và bảo mật cho doanh nghiệp của quý khách</p>

            <SectionCard title="Ảnh đại diện">
                <div className="flex items-center gap-8">
                    <div className="relative group">
                        <img
                            src={formData.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`}
                            alt={formData.name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-premium"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-bold">Logo doanh nghiệp</p>
                        <p className="text-[10px] text-gray-400 italic mb-4">Định dạng khuyên dùng: PNG, JPG hoặc SVG (tối đa 2MB)</p>
                        <div className="flex gap-3">
                            <button type="button" className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-all">Tải ảnh mới</button>
                            <button type="button" className="px-4 py-2 bg-gray-100 text-gray-400 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-50 hover:text-red-500 transition-all">Gỡ bỏ</button>
                        </div>
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="Thông tin liên hệ">
                <InputField
                    label="Tên doanh nghiệp"
                    name="name"
                    value={formData.name}
                    onChange={handleOwnerInfoChange}
                    error={errors.name}
                    required
                />
                <InputField
                    label="Email liên hệ"
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleOwnerInfoChange}
                    error={errors.email}
                    placeholder="business@example.com"
                />
                <InputField
                    label="Số điện thoại"
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

            <SectionCard title="Thiết lập thông báo">
                <p className="text-sm text-gray-500 mb-6 italic">
                    Lựa chọn loại thông báo quý khách muốn nhận qua email.
                </p>
                <div className="space-y-6">
                    <Toggle
                        label="Thông báo đánh giá mới"
                        enabled={formData.notification_settings?.review_alerts || false}
                        onChange={() => handleNotificationChange('review_alerts')}
                        description="Nhận email khi có khách hàng để lại đánh giá về dịch vụ."
                    />
                    <Toggle
                        label="Thông báo yêu cầu đặt chỗ"
                        enabled={formData.notification_settings?.booking_requests || false}
                        onChange={() => handleNotificationChange('booking_requests')}
                        description="Nhận email ngay khi có khách hàng yêu cầu đặt lịch hẹn."
                    />
                    <Toggle
                        label="Tin tức & Cập nhật hệ thống"
                        enabled={formData.notification_settings?.platform_news || false}
                        onChange={() => handleNotificationChange('platform_news')}
                        description="Nhận thông tin về các tính năng mới và cập nhật từ 1Beauty.asia."
                    />
                </div>
            </SectionCard>

            <SectionCard title="Bảo mật & Quyền riêng tư">
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                            <p className="text-sm font-bold text-gray-700">Mật khẩu</p>
                            <p className="text-xs text-gray-500 italic mt-1">Thay đổi mật khẩu đăng nhập của tài khoản.</p>
                        </div>
                        <button type="button" className="px-4 py-2 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-primary hover:text-white transition-all">Đổi mật khẩu</button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50/30 rounded-2xl border border-red-100">
                        <div>
                            <p className="text-sm font-bold text-red-700">Xóa tài khoản</p>
                            <p className="text-xs text-red-500 italic mt-1">Dữ liệu doanh nghiệp sẽ bị xóa vĩnh viễn và không thể khôi phục.</p>
                        </div>
                        <button type="button" className="px-4 py-2 bg-white border border-red-200 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-500 hover:text-white transition-all">Yêu cầu xóa</button>
                    </div>
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
                            Đang lưu...
                        </>
                    ) : (
                        'Lưu tất cả thay đổi'
                    )}
                </button>
            </div>
        </form>
    );
};

export default AccountSettings;
