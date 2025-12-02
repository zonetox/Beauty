
import React, { useState } from 'react';
import { Business } from '../types.ts';
import { GoogleGenAI } from "@google/genai";

interface EditBusinessModalProps {
  business: Business;
  onClose: () => void;
  onSave: (updatedBusiness: Business) => void;
}

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
            active ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {children}
    </button>
);

const EditBusinessModal: React.FC<EditBusinessModalProps> = ({ business, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<Business>(JSON.parse(JSON.stringify(business))); // Deep copy

  const isEditMode = business && business.id !== 0;


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSeoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({
          ...prev,
          seo: {
              ...(prev.seo || {}),
              [name]: value,
          }
      }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b">
             <h2 className="text-2xl font-bold font-serif text-neutral-dark">
                {isEditMode ? 'Edit Business Details' : 'Add New Business'}
             </h2>
        </div>
        <div className="border-b border-gray-200">
            <nav className="flex space-x-2 px-6">
                <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>General Info</TabButton>
                <TabButton active={activeTab === 'seo'} onClick={() => setActiveTab('seo')}>SEO</TabButton>
            </nav>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow">
          <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Business Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Website</label>
                      <input type="url" name="website" value={formData.website || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={5} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        name="isFeatured" 
                        checked={formData.isFeatured || false} 
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Mark as Featured</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Featured businesses will be displayed prominently on the homepage.</p>
                  </div>
                </div>
              )}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="seo-title" className="block text-sm font-medium text-gray-700">Meta Title</label>
                    <input type="text" id="seo-title" name="title" value={formData.seo?.title || ''} onChange={handleSeoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 50-60 characters. This is what appears in the browser tab and search results.</p>
                  </div>
                  <div>
                    <label htmlFor="seo-description" className="block text-sm font-medium text-gray-700">Meta Description</label>
                    <textarea id="seo-description" name="description" value={formData.seo?.description || ''} onChange={handleSeoChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    <p className="text-xs text-gray-500 mt-1">Recommended: 150-160 characters. A short summary to entice users in search results.</p>
                  </div>
                  <div>
                    <label htmlFor="seo-keywords" className="block text-sm font-medium text-gray-700">Meta Keywords</label>
                    <input type="text" id="seo-keywords" name="keywords" value={formData.seo?.keywords || ''} onChange={handleSeoChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    <p className="text-xs text-gray-500 mt-1">Comma-separated keywords (e.g., spa hanoi, massage, hair salon).</p>
                  </div>
                </div>
              )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBusinessModal;
