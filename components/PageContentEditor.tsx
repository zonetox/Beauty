

import React, { useState } from 'react';
import { usePageContent } from '../contexts/AdminPlatformContext.tsx';
import LayoutEditor from './LayoutEditor.tsx';
import { LayoutItem } from '../types.ts';

type PageName = 'about' | 'contact' | 'homepage';

const PageContentEditor: React.FC = () => {
    const { getPageContent, updatePageContent } = usePageContent();
    const [selectedPage, setSelectedPage] = useState<PageName>('about');
    const [isEditing, setIsEditing] = useState(false);

    // Homepage uses different editor (HomepageEditor), show message
    if (selectedPage === 'homepage') {
        return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Trang chủ sử dụng Homepage Editor</h3>
                <p className="text-blue-700 mb-4">
                    Để chỉnh sửa trang chủ, vui lòng chuyển sang tab <strong>&quot;Homepage Editor&quot;</strong> trong menu bên trái.
                </p>
                <p className="text-sm text-blue-600">
                    Homepage Editor cho phép bạn chỉnh sửa Hero Slides và các sections trên trang chủ.
                </p>
            </div>
        );
    }

    const pageData = getPageContent(selectedPage);

    if (!pageData) {
        return <p>Error: Could not load page data for &quot;{selectedPage}&quot;.</p>;
    }

    const handleSave = (newLayout: LayoutItem[], newVisibility: { [key: string]: boolean }) => {
        updatePageContent(selectedPage, { layout: newLayout, visibility: newVisibility });
        setIsEditing(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <label htmlFor="page-select" className="font-semibold">Editing Page:</label>
                    <select
                        id="page-select"
                        value={selectedPage}
                        onChange={(e) => {
                            setSelectedPage(e.target.value as PageName);
                            setIsEditing(false); // Exit edit mode when switching pages
                        }}
                        className="p-2 border rounded-md bg-gray-50"
                        disabled={isEditing}
                    >
                        <option value="homepage">Trang chủ</option>
                        <option value="about">Về chúng tôi</option>
                        <option value="contact">Liên hệ</option>
                    </select>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-secondary text-white font-semibold rounded-md hover:opacity-90"
                    >
                        Edit Layout
                    </button>
                )}
            </div>

            {isEditing ? (
                <LayoutEditor
                    currentLayout={pageData.layout}
                    currentVisibility={pageData.visibility}
                    onSave={handleSave}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <div className="bg-gray-100 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2">Current Layout Preview</h3>
                    <p className="text-sm text-gray-600 mb-4">This is a simplified view of the sections on the &quot;{selectedPage}&quot; page. Click &quot;Edit Layout&quot; to reorder, hide, or add elements.</p>
                    <div className="space-y-2">
                        {pageData.layout.map(item => (
                            <div key={item.id} className={`p-3 rounded-md ${pageData.visibility[item.key || ''] === false ? 'bg-gray-300' : 'bg-white border'}`}>
                                <span className="font-medium">{item.type}: </span>
                                <span className="text-gray-700">{item.key || item.content || 'Separator'}</span>
                                {pageData.visibility[item.key || ''] === false && <span className="text-xs font-bold text-red-600 ml-2">(HIDDEN)</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageContentEditor;
