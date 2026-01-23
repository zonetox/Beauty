// constants.ts

// FIX: Add HomepageData and HeroSlide to the import
import { BusinessCategory, MembershipTier, AdminUserRole, MembershipPackage, BlogCategory, AdminPermissions, HomepageData } from './types.ts';

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
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    {
        name: 'Hà Nội',
        imageUrl: 'https://images.unsplash.com/photo-1537533511567-f13981a7f174?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    {
        name: 'Đà Nẵng',
        imageUrl: 'https://images.unsplash.com/photo-1559592448-69fca7ed2047?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    {
        name: 'Cần Thơ',
        imageUrl: 'https://images.unsplash.com/photo-1599708153386-62e200399088?w=800&h=1000&fit=crop&q=80&auto=format'
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

export const LOCATION_COORDINATES: Record<string, [number, number]> = {
    'TP. Hồ Chí Minh': [10.7769, 106.7009],
    'Hà Nội': [21.0285, 105.8542],
    'Đà Nẵng': [16.0544, 108.2022],
    'Hải Phòng': [20.8449, 106.6881],
    'Cần Thơ': [10.0371, 105.7882],
    // Districts of HCM (Approximate)
    'Quận 1': [10.7757, 106.7004],
    'Quận 3': [10.7844, 106.6844],
    'Quận 7': [10.7324, 106.7214],
    'TP. Thủ Đức': [10.8231, 106.7129],
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
// Toast messages used throughout the application
export const TOAST_MESSAGES = {
    SUCCESS: {
        LOGIN: 'Đăng nhập thành công!',
        REGISTER: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực.',
        LOGOUT: 'Đã đăng xuất thành công.',
        UPDATE_PROFILE: 'Cập nhật hồ sơ thành công!',
        UPDATE_BUSINESS: 'Cập nhật thông tin doanh nghiệp thành công!',
        CHANGE_PASSWORD: 'Đổi mật khẩu thành công.',
        SEND_RESET_EMAIL: 'Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư.',
        RESET_PASSWORD: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.',
        DELETE_ACCOUNT: 'Tài khoản đã được xóa vĩnh viễn.',
        CREATED: 'Tạo mới thành công!',
        UPDATED: 'Cập nhật thành công!',
        DELETED: 'Xóa thành công!',
    },
    ERROR: {
        GENERIC: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        LOGIN_FAILED: 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
        REGISTER_FAILED: 'Đăng ký thất bại. Email có thể đã tồn tại.',
        PERMISSION_DENIED: 'Bạn không có quyền thực hiện hành động này.',
        DATA_FETCH_FAILED: 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối mạng.',
        INVALID_INPUT: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.',
    },
    INFO: {
        LOADING: 'Đang xử lý...',
        AUTH_REQUIRED: 'Vui lòng đăng nhập để tiếp tục.',
    }
};

// Validation constants for forms
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 6,
    MIN_PASSWORD_LENGTH: 6,
    MAX_TITLE_LENGTH: 200,
    MAX_DESCRIPTION_LENGTH: 5000,
    MAX_EXCERPT_LENGTH: 500,
    PHONE_REGEX: /^(0|\+84)(\s|\.)?((3[2-9])|(5[689])|(7[06-9])|(8[1-689])|(9[0-46-9]))(\d)(\s|\.)?(\d{3})(\s|\.)?(\d{3})$/, // Simple Vietnam phone regex
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
