// constants.ts

// FIX: Add HomepageData and HeroSlide to the import
import { BusinessCategory, MembershipTier, AdminUser, AdminUserRole, MembershipPackage, Order, OrderStatus, AppointmentStatus, BlogCategory, AdminPermissions, HomepageData, HeroSlide } from './types.ts';

export const CATEGORIES: string[] = Object.values(BusinessCategory);
export const CITIES: string[] = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

export const POPULAR_SEARCH_SUGGESTIONS: string[] = [
    'Massage thư giãn',
    'Chăm sóc da mụn',
    'Nhuộm tóc balayage',
    'Niềng răng trong suốt',
    'Sơn gel Hàn Quốc',
    'Triệt lông vĩnh viễn'
];

export const FEATURED_LOCATIONS = [
    { 
        name: 'TP. Hồ Chí Minh', 
        // Ho Chi Minh City - Modern skyline with Bitexco Financial Tower and vibrant cityscape
        // Reference: saigonvibes.com - The New Ho Chi Minh City (1600x989)
        imageUrl: 'https://images.unsplash.com/photo-1577702312576-5cf0d7c3d8b4?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    { 
        name: 'Hà Nội', 
        // Hanoi - Old Quarter with traditional Vietnamese architecture, Hoan Kiem Lake, and historic landmarks
        // Reference: cellphones.com.vn - Top 18 địa điểm du lịch ở Hà Nội (1200x675)
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    { 
        name: 'Đà Nẵng', 
        // Da Nang - Dragon Bridge at night, beautiful beaches, and modern coastal cityscape
        // Reference: ivivu.com - Du lịch Đà Nẵng 2026 (2000x1086)
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    { 
        name: 'Cần Thơ', 
        // Can Tho - Mekong Delta city with floating markets, traditional boats, and river life
        // Reference: baocantho.com.vn - TP Cần Thơ phát triển (1000x665)
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=1000&fit=crop&q=80&auto=format'
    },
];

export const BLOG_CATEGORIES: BlogCategory[] = [
    { id: 'cat-1', name: 'Chăm sóc da' },
    { id: 'cat-2', name: 'Chăm sóc tóc' },
    { id: 'cat-3', name: 'Chăm sóc móng' },
    { id: 'cat-4', name: 'Trang điểm' },
    { id: 'cat-5', name: 'Xu hướng' },
];


export const LOCATIONS_HIERARCHY = {
    'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Đống Đa', 'Hai Bà Trưng', 'Cầu Giấy', 'Tây Hồ', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông'],
    'TP. Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 10', 'Quận 11', 'Quận 12', 'Quận Bình Thạnh', 'Quận Phú Nhuận', 'Quận Gò Vấp', 'Quận Tân Bình', 'Quận Tân Phú', 'TP. Thủ Đức', 'Huyện Bình Chánh', 'Huyện Hóc Môn'],
    'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Huyện Hòa Vang'],
    'Hải Phòng': ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An', 'Đồ Sơn', 'Dương Kinh'],
    'Cần Thơ': ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt'],
};

// NOTE: All mock data for businesses, reviews, blog posts etc. has been removed.
// The application will now fetch all dynamic content directly from the Supabase database.

export const PERMISSION_PRESETS: Record<AdminUserRole, AdminPermissions> = {
    [AdminUserRole.ADMIN]: {
        canViewAnalytics: true,
        canManageBusinesses: true,
        canManageRegistrations: true,
        canManageOrders: true,
        canManagePlatformBlog: true,
        canManageUsers: true,
        canManagePackages: true,
        canManageAnnouncements: true,
        canManageSupportTickets: true,
        canManageSiteContent: true,
        canManageSystemSettings: true,
        canUseAdminTools: true,
        canViewActivityLog: true,
        canViewEmailLog: true,
    },
    [AdminUserRole.MODERATOR]: {
        canViewAnalytics: false,
        canManageBusinesses: true,
        canManageRegistrations: true,
        canManageOrders: true,
        canManagePlatformBlog: true,
        canManageUsers: false,
        canManagePackages: false,
        canManageAnnouncements: true,
        canManageSupportTickets: true,
        canManageSiteContent: false,
        canManageSystemSettings: false,
        canUseAdminTools: false,
        canViewActivityLog: true,
        canViewEmailLog: false,
    },
    [AdminUserRole.EDITOR]: {
        canViewAnalytics: false,
        canManageBusinesses: false,
        canManageRegistrations: false,
        canManageOrders: false,
        canManagePlatformBlog: true,
        canManageUsers: false,
        canManagePackages: false,
        canManageAnnouncements: false,
        canManageSupportTickets: false,
        canManageSiteContent: false,
        canManageSystemSettings: false,
        canUseAdminTools: false,
        canViewActivityLog: false,
        canViewEmailLog: false,
    }
};

export const DEFAULT_MEMBERSHIP_PACKAGES: MembershipPackage[] = [
    {
        id: 'pkg_free_1',
        tier: MembershipTier.FREE,
        name: 'Free Listing',
        price: 0,
        durationMonths: 12,
        description: 'Get your business listed on our directory for free.',
        features: ['Basic business profile', 'Visible in search results', 'Contact information displayed'],
        permissions: {
            photoLimit: 3,
            videoLimit: 0,
            featuredLevel: 0,
            customLandingPage: false,
            privateBlog: false,
            seoSupport: false,
            monthlyPostLimit: 0,
            featuredPostLimit: 0,
        },
        isPopular: false,
        isActive: true,
    },
    {
        id: 'pkg_premium_1',
        tier: MembershipTier.PREMIUM,
        name: 'Premium',
        price: 1000000,
        durationMonths: 12,
        description: 'Enhance your visibility and unlock more features to attract customers.',
        features: ['Everything in Free', 'Highlighted search results', 'Custom landing page', 'Photo & video gallery'],
        permissions: {
            photoLimit: 15,
            videoLimit: 3,
            featuredLevel: 1,
            customLandingPage: true,
            privateBlog: false,
            seoSupport: false,
            monthlyPostLimit: 4,
            featuredPostLimit: 1,
        },
        isPopular: true,
        isActive: true,
    },
    {
        id: 'pkg_vip_1',
        tier: MembershipTier.VIP,
        name: 'VIP',
        price: 3000000,
        durationMonths: 12,
        description: 'Maximum exposure and full access to all platform features.',
        features: ['Everything in Premium', 'Top placement in search', 'Advanced SEO support', 'Private blog for your business'],
        permissions: {
            photoLimit: 50,
            videoLimit: 10,
            featuredLevel: 2,
            customLandingPage: true,
            privateBlog: true,
            seoSupport: true,
            monthlyPostLimit: 10,
            featuredPostLimit: 3,
        },
        isPopular: false,
        isActive: true,
    }
];

// FIX: Add missing DEFAULT_HOMEPAGE_DATA constant.
export const DEFAULT_HOMEPAGE_DATA: HomepageData = {
    heroSlides: [
        {
            title: 'Khám phá Vẻ đẹp đích thực',
            subtitle: 'Tìm kiếm hàng ngàn spa, salon, và clinic uy tín gần bạn. Đặt lịch hẹn chỉ trong vài cú nhấp chuột.',
            imageUrl: 'https://picsum.photos/seed/hero1/1920/1080',
        },
        {
            title: 'Nâng tầm Trải nghiệm làm đẹp',
            subtitle: 'Đọc đánh giá thật, khám phá ưu đãi độc quyền và tìm kiếm chuyên gia phù hợp nhất với bạn.',
            imageUrl: 'https://picsum.photos/seed/hero2/1920/1080',
        }
    ],
    sections: [
        {
            id: 'hp-sec-1',
            type: 'featuredBusinesses',
            title: 'Đối tác nổi bật',
            subtitle: 'Những địa điểm được cộng đồng yêu thích và đánh giá cao nhất.',
            visible: true,
        },
        {
            id: 'hp-sec-2',
            type: 'featuredDeals',
            title: 'Ưu đãi hấp dẫn',
            subtitle: 'Đừng bỏ lỡ những khuyến mãi đặc biệt từ các đối tác hàng đầu của chúng tôi.',
            visible: true,
        },
        {
            id: 'hp-sec-4',
            type: 'exploreByLocation',
            title: 'Khám phá theo địa điểm',
            subtitle: 'Tìm kiếm những viên ngọc ẩn trong khu vực của bạn.',
            visible: true,
        },
        {
            id: 'hp-sec-3',
            type: 'featuredBlog',
            title: 'Từ Blog của chúng tôi',
            subtitle: 'Cập nhật những xu hướng, mẹo và kiến thức làm đẹp mới nhất.',
            visible: true,
        },
    ],
};
