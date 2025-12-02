import React, { useState } from 'react';
import { useBusinessAuth, useDealsData } from '../contexts/BusinessContext.tsx';
import { Deal, DealStatus } from '../types.ts';

// Modal for adding/editing deals
const EditDealModal: React.FC<{ deal: Partial<Deal> | null; onSave: (deal: Partial<Deal>) => void; onClose: () => void; }> = ({ deal, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Deal>>(deal || { status: DealStatus.ACTIVE, title: '', description: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isNumeric = type === 'number';
        setFormData(prev => ({ ...prev, [name]: isNumeric ? (value ? parseFloat(value) : undefined) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-4 border-b"><h3 className="text-lg font-bold">{deal?.id ? 'Edit Deal' : 'Add New Deal'}</h3></div>
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        {/* Form fields */}
                        <div><label>Title</label><input name="title" value={formData.title || ''} onChange={handleChange} required className="w-full p-2 border rounded"/></div>
                        <div><label>Description</label><textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} required className="w-full p-2 border rounded"/></div>
                        <div><label>Image URL</label><input name="image_url" value={formData.image_url || ''} onChange={handleChange} className="w-full p-2 border rounded"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label>Start Date</label><input name="start_date" type="date" value={formData.start_date?.split('T')[0] || ''} onChange={handleChange} className="w-full p-2 border rounded"/></div>
                            <div><label>End Date</label><input name="end_date" type="date" value={formData.end_date?.split('T')[0] || ''} onChange={handleChange} className="w-full p-2 border rounded"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label>Original Price (VND)</label><input name="original_price" type="number" value={formData.original_price || ''} onChange={handleChange} className="w-full p-2 border rounded"/></div>
                            <div><label>Deal Price (VND)</label><input name="deal_price" type="number" value={formData.deal_price || ''} onChange={handleChange} className="w-full p-2 border rounded"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div><label>Discount %</label><input name="discount_percentage" type="number" value={formData.discount_percentage || ''} onChange={handleChange} className="w-full p-2 border rounded"/></div>
                             <div><label>Status</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded">{Object.values(DealStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-4 flex justify-end gap-3"><button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-primary text-white rounded">Save Deal</button></div>
                </form>
            </div>
        </div>
    );
};


const DealsManager: React.FC = () => {
    const { currentBusiness } = useBusinessAuth();
    const { addDeal, updateDeal, deleteDeal } = useDealsData();

    const [editingDeal, setEditingDeal] = useState<Partial<Deal> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!currentBusiness) return null;

    const myDeals = currentBusiness.deals || [];

    const openModal = (deal: Partial<Deal> | null) => {
        setEditingDeal(deal);
        setIsModalOpen(true);
    };

    const handleSaveDeal = (dealData: Partial<Deal>) => {
        const promise = dealData.id
            ? updateDeal({ ...dealData, business_id: currentBusiness.id } as Deal)
            : addDeal({ ...dealData, business_id: currentBusiness.id } as Omit<Deal, 'id'>);
        
        promise.then(() => setIsModalOpen(false));
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure?")) {
            deleteDeal(id);
        }
    };

    return (
        <div className="p-8">
            {isModalOpen && <EditDealModal deal={editingDeal} onSave={handleSaveDeal} onClose={() => setIsModalOpen(false)} />}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold font-serif text-neutral-dark">Deals Management</h2>
                <button onClick={() => openModal(null)} className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm">+ Add New Deal</button>
            </div>

            <div className="space-y-3">
                {myDeals.map(deal => (
                    <div key={deal.id} className="flex items-center gap-4 p-3 border rounded-md bg-white shadow-sm">
                        <div className="flex-grow">
                            <p className="font-semibold text-neutral-dark">{deal.title}</p>
                            <p className="text-sm text-gray-500 truncate">{deal.description}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${deal.status === DealStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-gray-200'}`}>{deal.status}</span>
                        <div className="flex gap-2">
                            <button onClick={() => openModal(deal)} className="text-secondary font-semibold text-sm hover:underline">Edit</button>
                            <button onClick={() => handleDelete(deal.id)} className="text-red-500 font-semibold text-sm hover:underline">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
             {myDeals.length === 0 && <div className="text-center py-12 bg-gray-50 rounded-lg"><p>No deals created yet.</p></div>}
        </div>
    );
};

export default DealsManager;
