// components/EditPackageModal.tsx

import React, { useState, useEffect } from 'react';
import { MembershipPackage, MembershipTier } from '../types.ts';

interface EditPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: MembershipPackage) => void;
  packageToEdit?: MembershipPackage | null;
}

const EditPackageModal: React.FC<EditPackageModalProps> = ({ isOpen, onClose, onSave, packageToEdit }) => {
  const isEditMode = Boolean(packageToEdit);

  const getInitialFormData = (): Omit<MembershipPackage, 'id'> => {
    if (packageToEdit) {
      return { ...packageToEdit };
    }
    return {
      tier: MembershipTier.PREMIUM,
      name: '',
      price: 0,
      durationMonths: 12,
      description: '',
      features: [''],
      permissions: {
        photoLimit: 10,
        videoLimit: 2,
        featuredLevel: 1,
        customLandingPage: true,
        privateBlog: false,
        seoSupport: false,
        monthlyPostLimit: 5,
        featuredPostLimit: 0,
      },
      isPopular: false,
      isActive: true,
    };
  };

  const [formData, setFormData] = useState<Partial<MembershipPackage>>(getInitialFormData());

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(getInitialFormData());
    }
  }, [packageToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const isNumeric = ['price', 'durationMonths', 'photoLimit', 'videoLimit', 'featuredLevel', 'monthlyPostLimit', 'featuredPostLimit'].includes(name.split('.').pop() || '');

    if (name.startsWith('permissions.')) {
      const key = name.split('.')[1];
      setFormData(prev => {
        if (!prev) return prev;
        const updated: Partial<MembershipPackage> = {
          ...prev,
          permissions: {
            ...(prev.permissions || {
              photoLimit: 0,
              videoLimit: 0,
              featuredLevel: 0,
              customLandingPage: false,
              privateBlog: false,
              seoSupport: false,
              monthlyPostLimit: 0,
              featuredPostLimit: 0,
            }),
            [key]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumeric ? Number(value) : value),
          } as MembershipPackage['permissions']
        };
        return updated;
      });
    } else {
      setFormData(prev => {
        if (!prev) return prev;
        const updated: Partial<MembershipPackage> = {
          ...prev,
          [name]: isCheckbox ? (e.target as HTMLInputElement).checked : (isNumeric ? Number(value) : value)
        };
        return updated;
      });
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...(prev!.features || []), ''] }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({ ...prev, features: (prev!.features || []).filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as MembershipPackage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold font-serif text-neutral-dark">{isEditMode ? 'Edit Package' : 'Add New Package'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Package Name</label>
                <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tier</label>
                <select name="tier" value={formData.tier} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
                  {Object.values(MembershipTier).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (VND)</label>
                <input type="number" name="price" value={formData.price || 0} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Months)</label>
                <input type="number" name="durationMonths" value={formData.durationMonths || 12} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features List</label>
              <div className="space-y-2">
                {(formData.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input type="text" value={feature} onChange={e => handleFeatureChange(index, e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-md" />
                    <button type="button" onClick={() => removeFeature(index)} className="text-red-500 font-bold p-2">&times;</button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addFeature} className="mt-2 text-sm text-secondary font-semibold">+ Add Feature</button>
            </div>

            {/* Permissions */}
            <div className="pt-4 border-t">
              <h4 className="text-md font-semibold mb-2">Permissions & Limits</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Photo Limit</label>
                  <input type="number" name="permissions.photoLimit" value={formData.permissions?.photoLimit || 0} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Video Limit</label>
                  <input type="number" name="permissions.videoLimit" value={formData.permissions?.videoLimit || 0} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Post Limit</label>
                  <input type="number" name="permissions.monthlyPostLimit" value={formData.permissions?.monthlyPostLimit || 0} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Featured Post Limit</label>
                  <input type="number" name="permissions.featuredPostLimit" value={formData.permissions?.featuredPostLimit || 0} onChange={handleChange} className="mt-1 w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 mt-4 gap-4">
                <label className="flex items-center"><input type="checkbox" name="permissions.customLandingPage" checked={formData.permissions?.customLandingPage || false} onChange={handleChange} className="h-4 w-4 mr-2" /> Custom Landing Page</label>
                <label className="flex items-center"><input type="checkbox" name="permissions.privateBlog" checked={formData.permissions?.privateBlog || false} onChange={handleChange} className="h-4 w-4 mr-2" /> Private Blog</label>
                <label className="flex items-center"><input type="checkbox" name="permissions.seoSupport" checked={formData.permissions?.seoSupport || false} onChange={handleChange} className="h-4 w-4 mr-2" /> SEO Support</label>
                <label className="flex items-center"><input type="checkbox" name="isPopular" checked={formData.isPopular || false} onChange={handleChange} className="h-4 w-4 mr-2" /> Mark as Popular</label>
              </div>
            </div>

          </div>
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">Save Package</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPackageModal;