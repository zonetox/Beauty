import React from 'react';
import { Business, LandingPageConfig } from '../types.ts';
import UnifiedLandingPageRenderer from '../src/features/landing-pages/UnifiedLandingPageRenderer.tsx';

interface LandingPagePreviewProps {
  business: Business;
  config: LandingPageConfig;
  onClose: () => void;
  isEditing?: boolean;
  onUpdateContent?: (sectionKey: string, content: any) => void;
}

const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({
  business,
  config,
  onClose,
  isEditing = false,
  onUpdateContent
}) => {
  // Create a preview version of the business with the new config
  const previewBusiness: Business = {
    ...business,
    landing_page_config: config,
  };

  const handleBookNowClick = () => {
    // In preview, just show a message or do nothing
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 overflow-y-auto">
      <div className="min-h-screen bg-white">
        {/* Preview Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-neutral-dark">Trình xem trước Landing Page</h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditing ? 'Đang trong chế độ chỉnh sửa trực quan' : 'Giao diện hiển thị với khách hàng'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-all font-bold text-xs uppercase tracking-widest"
          >
            Đóng Xem Trước
          </button>
        </div>

        <UnifiedLandingPageRenderer
          business={previewBusiness}
          config={config}
          isEditing={isEditing}
          onUpdateContent={onUpdateContent}
          onBookNowClick={handleBookNowClick}
        />
      </div>
    </div>
  );
};

export default LandingPagePreview;
