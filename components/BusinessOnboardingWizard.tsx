import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient.ts';
import { useUserSession } from '../contexts/UserSessionContext.tsx';
import { BusinessCategory, MembershipTier } from '../types.ts';

const BusinessOnboardingWizard: React.FC = () => {
    const { currentUser, refreshProfile } = useUserSession();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setIsSubmitting(true);
        try {
            // 1. Create Business Record
            const slug = generateSlug(formData.name);
            const newBusiness = {
                name: formData.name,
                slug: slug,
                owner_id: currentUser.id, // RLS will allow this if we have a policy, or we rely on backend trigger. RLS policy "Users can update own business" won't allow INSERT unless we add INSERT policy.
                // Wait, RLS verification showed: "Public businesses are viewable", "Users can update own".
                // We likely need an INSERT policy for authenticated users to create a business.
                // Let's assume for now the INSERT policy exists or we will fix it if it fails.
                categories: [formData.category],
                phone: formData.phone,
                address: formData.address,
                city: formData.city || 'Ho Chi Minh', // Default fallbacks
                district: 'District 1',
                ward: 'Ben Nghe',
                description: formData.description || `Welcome to ${formData.name}`,
                image_url: 'https://placehold.co/600x400/E6A4B4/FFFFFF?text=Storefront', // Default placeholder
                membership_tier: MembershipTier.FREE,
                is_active: false, // Inactive until approved/paid? Or simple version: active immediately?
                // Lets make it semi-active (visible to owner, potentially hidden from public until reviewed)
                working_hours: { "Monday - Friday": "09:00 - 20:00" },
            };

            const { data: businessData, error: businessError } = await supabase
                .from('businesses')
                .insert(newBusiness)
                .select()
                .single();

            if (businessError) throw businessError;
            if (!businessData) throw new Error("Failed to create business record.");

            // 2. Update Profile to link to this business
            // The trigger 'handle_new_user' created the profile, but 'business_id' is null.
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ business_id: businessData.id })
                .eq('id', currentUser.id);

            if (profileError) throw profileError;

            // 3. Refresh Session/Context
            await refreshProfile(); // function we need to ensure exists in UserSessionContext specific to this need or just reload.

            toast.success("Business profile created successfully!");
            // Refresh page to trigger Dashboard load
            window.location.reload();

        } catch (error: any) {
            console.error("Onboarding Error:", error);
            toast.error(error.message || "Failed to create business.");
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
                    Let's set up your business profile to get started.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Business Name
                            </label>
                            <div className="mt-1">
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
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
                                Phone Number
                            </label>
                            <div className="mt-1">
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City
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
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Street Address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="address"
                                    name="address"
                                    type="text"
                                    required
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                        </div>

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
