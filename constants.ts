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
        image_url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    {
        name: 'Hà Nội',
        image_url: 'https://images.unsplash.com/photo-1537533511567-f13981a7f174?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    {
        name: 'Đà Nẵng',
        image_url: 'https://images.unsplash.com/photo-1559592448-69fca7ed2047?w=800&h=1000&fit=crop&q=80&auto=format'
    },
    {
        name: 'Cần Thơ',
        image_url: 'https://images.unsplash.com/photo-1599708153386-62e200399088?w=800&h=1000&fit=crop&q=80&auto=format'
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
        can_view_analytics: true,
        can_manage_businesses: true,
        can_manage_registrations: true,
        can_manage_orders: true,
        can_manage_platform_blog: true,
        can_manage_users: true,
        can_manage_packages: true,
        can_manage_announcements: true,
        can_manage_support_tickets: true,
        can_manage_site_content: true,
        can_manage_system_settings: true,
        can_use_admin_tools: true,
        can_view_activity_log: true,
        can_view_email_log: true,
    },
    [AdminUserRole.MODERATOR]: {
        can_view_analytics: false,
        can_manage_businesses: true,
        can_manage_registrations: true,
        can_manage_orders: true,
        can_manage_platform_blog: true,
        can_manage_users: false,
        can_manage_packages: false,
        can_manage_announcements: true,
        can_manage_support_tickets: true,
        can_manage_site_content: false,
        can_manage_system_settings: false,
        can_use_admin_tools: false,
        can_view_activity_log: true,
        can_view_email_log: false,
    },
    [AdminUserRole.EDITOR]: {
        can_view_analytics: false,
        can_manage_businesses: false,
        can_manage_registrations: false,
        can_manage_orders: false,
        can_manage_platform_blog: true,
        can_manage_users: false,
        can_manage_packages: false,
        can_manage_announcements: false,
        can_manage_support_tickets: false,
        can_manage_site_content: false,
        can_manage_system_settings: false,
        can_use_admin_tools: false,
        can_view_activity_log: false,
        can_view_email_log: false,
    }
};

export const DEFAULT_MEMBERSHIP_PACKAGES: MembershipPackage[] = [
    {
        id: 'pkg_free_1',
        tier: MembershipTier.FREE,
        name: 'Free Listing',
        price: 0,
        duration_months: 12,
        description: 'Get your business listed on our directory for free.',
        features: ['Basic business profile', 'Visible in search results', 'Contact information displayed'],
        permissions: {
            photo_limit: 3,
            video_limit: 0,
            featured_level: 0,
            custom_landing_page: false,
            private_blog: false,
            seo_support: false,
            monthly_post_limit: 0,
            featured_post_limit: 0,
        },
        is_popular: false,
        is_active: true,
    },
    {
        id: 'pkg_premium_1',
        tier: MembershipTier.PREMIUM,
        name: 'Premium',
        price: 1000000,
        duration_months: 12,
        description: 'Enhance your visibility and unlock more features to attract customers.',
        features: ['Everything in Free', 'Highlighted search results', 'Custom landing page', 'Photo & video gallery'],
        permissions: {
            photo_limit: 15,
            video_limit: 3,
            featured_level: 1,
            custom_landing_page: true,
            private_blog: false,
            seo_support: false,
            monthly_post_limit: 4,
            featured_post_limit: 1,
        },
        is_popular: true,
        is_active: true,
    },
    {
        id: 'pkg_vip_1',
        tier: MembershipTier.VIP,
        name: 'VIP',
        price: 3000000,
        duration_months: 12,
        description: 'Maximum exposure and full access to all platform features.',
        features: ['Everything in Premium', 'Top placement in search', 'Advanced SEO support', 'Private blog for your business'],
        permissions: {
            photo_limit: 50,
            video_limit: 10,
            featured_level: 2,
            custom_landing_page: true,
            private_blog: true,
            seo_support: true,
            monthly_post_limit: 10,
            featured_post_limit: 3,
        },
        is_popular: false,
        is_active: true,
    }
];

// FIX: Add missing DEFAULT_HOMEPAGE_DATA constant.
export const DEFAULT_HOMEPAGE_DATA: HomepageData = {
    hero_slides: [
        {
            title: 'Khám phá Vẻ đẹp đích thực',
            subtitle: 'Tìm kiếm hàng ngàn spa, salon, và clinic uy tín gần bạn. Đặt lịch hẹn chỉ trong vài cú nhấp chuột.',
            image_url: 'https://picsum.photos/seed/hero1/1920/1080',
        },
        {
            title: 'Nâng tầm Trải nghiệm làm đẹp',
            subtitle: 'Đọc đánh giá thật, khám phá ưu đãi độc quyền và tìm kiếm chuyên gia phù hợp nhất với bạn.',
            image_url: 'https://picsum.photos/seed/hero2/1920/1080',
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
