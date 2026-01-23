import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient.ts';
import { useAuth } from '../providers/AuthProvider.tsx';
import { BusinessCategory, MembershipTier } from '../types.ts';

// D3.1 FIX: Fix onboarding wizard edge cases - validation, error handling, user feedback
const BusinessOnboardingWizard: React.FC = () => {
    const { user: currentUser, refreshAuth } = useAuth();
    // const navigate = useNavigate(); // Unused
    // const [step, setStep] = useState(1); // Unused
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Form State
    const [formData, setFormData] = useState({
        name: currentUser?.user_metadata?.full_name || '',
        phone: currentUser?.user_metadata?.phone || '',
        category: BusinessCategory.SPA, // Default
        address: '',
        city: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // D3.1 FIX: Add validation
    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name || formData.name.trim().length < 2) {
            newErrors.name = 'Business name must be at least 2 characters';
        }

        if (!formData.phone || !/^[0-9+\-\s()]+$/.test(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
        }

        if (!formData.address || formData.address.trim().length < 5) {
            newErrors.address = 'Please enter a complete street address';
        }

        if (!formData.city || formData.city.trim().length < 2) {
            newErrors.city = 'Please enter a valid city name';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    };

    // D3.1 FIX: Improved error handling and user feedback
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            toast.error("You must be logged in to create a business.");
            return;
        }

        // Validate form before submission
        if (!validateForm()) {
            toast.error("Please fix the errors in the form.");
            return;
        }

        setIsSubmitting(true);
        let createdBusinessId: number | null = null;

        try {
            // 1. Create Business Record
            const slug = generateSlug(formData.name);
            const newBusiness = {
                name: formData.name.trim(),
                slug: slug,
                owner_id: currentUser.id,
                categories: [formData.category],
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                city: formData.city.trim() || 'Ho Chi Minh',
                district: 'District 1',
                ward: 'Ben Nghe',
                description: formData.description.trim() || `Welcome to ${formData.name.trim()}`,
                image_url: 'https://placehold.co/600x400/E6A4B4/FFFFFF?text=Storefront',
                membership_tier: MembershipTier.FREE,
                is_active: false,
                working_hours: { "Monday - Friday": "09:00 - 20:00" },
            };

            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .insert(newBusiness)
                .select()
                .single();

            if (businessError) {
                // D3.4 FIX: Better error messages for user feedback
                if (businessError.code === '23505') {
                    throw new Error("A business with this name already exists. Please choose a different name.");
                } else if (businessError.code === '42501') {
                    throw new Error("You don't have permission to create a business. Please contact support.");
                } else {
                    throw new Error(`Failed to create business: ${businessError.message}`);
                }
            }

            if (!businessData) {
                throw new Error("Failed to create business record. Please try again.");
            }

            createdBusinessId = businessData.id;

            // 2. Update Profile to link to this business
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ business_id: businessData.id })
                .eq('id', currentUser.id);

            if (profileError) {
                // D3.4 FIX: Rollback business creation if profile update fails
                if (createdBusinessId) {
                    await supabase.from('businesses').delete().eq('id', createdBusinessId);
                }
                throw new Error(`Failed to link business to your profile: ${profileError.message}`);
            }

            // 3. Refresh Session/Context
            await refreshAuth();

            toast.success("Business profile created successfully!");
            // Small delay before reload to show success message
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error: unknown) {
            console.error("Onboarding Error:", error);
            // D3.4 FIX: Always show error feedback to user
            const errorMessage = error instanceof Error ? error.message : "Failed to create business. Please try again.";
            toast.error(errorMessage);

            // D3.1 FIX: Set form-level error for better UX
            setErrors({ submit: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-dark font-serif">
                    Welcome to BeautyDir
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Let&apos;s set up your business profile to get started.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Business Name <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Primary Category
                            </label>
                            <div className="mt-1">
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                >
                                    {Object.values(BusinessCategory).map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.phone && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    required
                                    placeholder="e.g. Ho Chi Minh"
                                    value={formData.city}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.city ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.city && (
                                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Street Address <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.address ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.address && (
                                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                )}
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="rounded-md bg-red-50 p-4">
                                <p className="text-sm text-red-800">{errors.submit}</p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                            >
                                {isSubmitting ? 'Creating Profile...' : 'Create Business Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BusinessOnboardingWizard;





