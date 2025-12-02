
import React, { useState } from 'react';
import { useBusinessData } from '../contexts/BusinessDataContext.tsx';
import { Business } from '../types.ts';

const BulkImportTool: React.FC = () => {
    const { addBusiness } = useBusinessData();
    const [jsonInput, setJsonInput] = useState('');
    const [importLog, setImportLog] = useState<string[]>([]);

    const handleImport = () => {
        let newLog: string[] = [];
        try {
            const businessesToImport: Partial<Business>[] = JSON.parse(jsonInput);
            if (!Array.isArray(businessesToImport)) {
                throw new Error("Input must be a JSON array of business objects.");
            }

            let successCount = 0;
            businessesToImport.forEach((biz, index) => {
                try {
                    // Basic validation
                    if (!biz.name || !biz.address || !biz.phone) {
                        throw new Error(`Business at index ${index} is missing required fields (name, address, phone).`);
                    }
                    const newBusiness: Business = {
                        id: Date.now() + index, // Simple unique ID generation
                        slug: biz.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now() + index}`,
                        isVerified: false,
                        isActive: true,
                        rating: 0,
                        reviewCount: 0,
                        viewCount: 0,
                        joinedDate: new Date().toISOString(),
                        ...biz,
                    } as Business; // Cast after merging defaults
                    
                    addBusiness(newBusiness);
                    successCount++;
                    newLog.push(`SUCCESS: Imported "${biz.name}".`);
                } catch (e) {
                    newLog.push(`ERROR: Failed to import business at index ${index}. ${e instanceof Error ? e.message : String(e)}`);
                }
            });
            newLog.unshift(`--- Import complete: ${successCount} / ${businessesToImport.length} successful. ---`);
            setImportLog(newLog);
            setJsonInput('');

        } catch (e) {
            setImportLog([`FATAL ERROR: Invalid JSON format. ${e instanceof Error ? e.message : String(e)}`]);
        }
    };

    return (
        <div>
            <h3 className="text-md font-semibold text-neutral-dark mb-2">Bulk Import Businesses</h3>
            <p className="text-sm text-gray-500 mb-4">Paste a JSON array of business objects to import. Ensure each object has at least 'name', 'address', and 'phone'.</p>
            <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                rows={8}
                placeholder='[{"name": "New Spa", "address": "123 Main St", "phone": "555-1234"}, ...]'
                className="w-full p-2 border rounded-md font-mono text-xs"
            />
            <button onClick={handleImport} className="mt-2 bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm">
                Import Data
            </button>
            {importLog.length > 0 && (
                <div className="mt-4 p-2 bg-gray-800 text-white rounded-md max-h-48 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{importLog.join('\n')}</pre>
                </div>
            )}
        </div>
    );
};

export default BulkImportTool;
