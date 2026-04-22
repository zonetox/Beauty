import { ThemeSettings, Business, BusinessCategory } from '../../../types.ts';

export interface TemplatePreset {
    id: string;
    name: string;
    theme: ThemeSettings;
    styles: {
        heroOverlay?: string;
        cardStyle?: 'flat' | 'elevated' | 'glass';
        mapFilter?: string;
        galleryLayout?: 'grid' | 'masonry';
        buttonStyle?: 'sharp' | 'pill' | 'shadow';
    };
}

export const TEMPLATE_PRESETS: Record<string, TemplatePreset> = {
    'luxury-minimal': {
        id: 'luxury-minimal',
        name: 'Luxury Minimal',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#D4AF37', // Metallic Gold
                primary_dark: '#B8972F',
                secondary: '#2D2D2D',
                accent: '#A65E5E', // Luxury Rose
                background: '#F9F5F1', // Airy Cream
                neutral_dark: '#1A1A1A',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Cormorant Garamond',
            },
        },
        styles: {
            heroOverlay: 'rgba(249, 245, 241, 0.4)',
            cardStyle: 'glass',
            mapFilter: 'grayscale(100%) contrast(110%) opacity(0.8)',
            galleryLayout: 'masonry',
            buttonStyle: 'pill'
        }
    },
    'korean-clinic': {
        id: 'korean-clinic',
        name: 'Korean Clinic',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#769E9F', // Muted Teal
                primary_dark: '#5C7C7D',
                secondary: '#3D4D4D',
                accent: '#D9E8E8',
                background: '#F2F7F7', // Clean white-blue
                neutral_dark: '#1E2929',
            },
            fonts: {
                sans: 'Montserrat',
                serif: 'Lora',
            },
        },
        styles: {
            heroOverlay: 'rgba(242, 247, 247, 0.3)',
            cardStyle: 'elevated',
            mapFilter: 'sepia(10%) contrast(90%)',
            galleryLayout: 'grid',
            buttonStyle: 'pill'
        }
    },
    'nature-spa': {
        id: 'nature-spa',
        name: 'Nature Spa',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#6B8E23', // Olive Green
                primary_dark: '#556B2F',
                secondary: '#3E442B',
                accent: '#E9EDDE',
                background: '#F5F5F0', // Earthy white
                neutral_dark: '#2F3325',
            },
            fonts: {
                sans: 'Lato',
                serif: 'Source Serif Pro',
            },
        },
        styles: {
            heroOverlay: 'rgba(245, 245, 240, 0.5)',
            cardStyle: 'elevated',
            mapFilter: 'hue-rotate(20deg) brightness(0.9)',
            galleryLayout: 'masonry',
            buttonStyle: 'shadow'
        }
    },
    'dark-premium': {
        id: 'dark-premium',
        name: 'Dark Premium',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#CD7F32', // Bronze
                primary_dark: '#A0522D',
                secondary: '#E5E5E5',
                accent: '#333333',
                background: '#121212', // Deep Charcoal
                neutral_dark: '#FFFFFF',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Playfair Display',
            },
        },
        styles: {
            heroOverlay: 'rgba(0, 0, 0, 0.6)',
            cardStyle: 'glass',
            mapFilter: 'invert(100%) hue-rotate(180deg) brightness(0.8)',
            galleryLayout: 'masonry',
            buttonStyle: 'sharp'
        }
    },
    'modern-beauty': {
        id: 'modern-beauty',
        name: 'Modern Beauty',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#A65E5E', // Luxury Rose
                primary_dark: '#8C4D4D',
                secondary: '#1A1A1A',
                accent: '#D4AF37', // Gold
                background: '#FFFFFF',
                neutral_dark: '#1A1A1A',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Cormorant Garamond',
            },
        },
        styles: {
            heroOverlay: 'rgba(255, 255, 255, 0.2)',
            cardStyle: 'elevated',
            mapFilter: 'saturate(1.2)',
            galleryLayout: 'grid',
            buttonStyle: 'pill'
        }
    },
    'luna-spa': {
        id: 'luna-spa',
        name: 'Luna Spa — Thiên Nhiên',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#6B8C6B',    // Natural Forest Green
                primary_dark: '#4E6B4E',
                secondary: '#3B4A3B',
                accent: '#C8A97E',     // Warm Sand
                background: '#F7F4EF', // Warm Cream
                neutral_dark: '#2C3A2C',
            },
            fonts: {
                sans: 'Lato',
                serif: 'Playfair Display',
            },
        },
        styles: {
            heroOverlay: 'rgba(107, 140, 107, 0.18)',
            cardStyle: 'elevated',
            mapFilter: 'hue-rotate(30deg) saturate(0.8) brightness(0.95)',
            galleryLayout: 'masonry',
            buttonStyle: 'pill'
        }
    },
    'pink-nail': {
        id: 'pink-nail',
        name: 'Pink Nail — Tinh Tế',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#D4748C',    // Soft Blush Pink
                primary_dark: '#B85872',
                secondary: '#7A4955',
                accent: '#F5C2CE',     // Light Pink
                background: '#FFF8F9', // Blush White
                neutral_dark: '#3D2B30',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Cormorant Garamond',
            },
        },
        styles: {
            heroOverlay: 'rgba(212, 116, 140, 0.12)',
            cardStyle: 'glass',
            mapFilter: 'sepia(15%) saturate(1.1)',
            galleryLayout: 'grid',
            buttonStyle: 'pill'
        }
    }
};

export const DEMO_CONTENT: Record<string, Partial<Business>> = {
    'luna-spa': {
        name: 'Luna Spa & Massage',
        slogan: 'Tinh hoa trị liệu - Cân bằng Thân - Tâm - Trí',
        description: 'Luna Spa mang đến những liệu pháp chăm sóc sức khỏe và tinh thần thuần túy, giúp bạn cân bằng cuộc sống và tỏa sáng mỗi ngày. Với hơn 10 năm kinh nghiệm, chúng tôi tự hào mang đến không gian thư giãn đẳng cấp cùng đội ngũ kỹ thuật viên chuyên nghiệp hàng đầu.',
        address: '123 Đường Hoa Hồng, P.2, Q.3, TP.HCM',
        city: 'Hồ Chí Minh',
        district: 'Quận 3',
        ward: 'Phường 2',
        phone: '0123 456 789',
        email: 'lunaspa@gmail.com',
        website: 'https://lunaspa.vn',
        categories: [BusinessCategory.SPA],
        image_url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?q=80&w=2070', // Spa treatment
        logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=LS&backgroundColor=6B8C6B',
        hero_slides: [
            {
                title: 'Tinh hoa trị liệu',
                subtitle: 'Cân bằng thân - tâm - trí trong không gian thuần khiết',
                image_url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2070'
            }
        ],
        working_hours: {
            'Thứ 2 - Thứ 6': '09:00 - 21:00',
            'Thứ 7 - CN': '08:30 - 22:00'
        },
        socials: {
            facebook: 'https://facebook.com/lunaspa',
            instagram: 'https://instagram.com/lunaspa'
        }
    },
    'pink-nail': {
        name: 'Nailora Beauty & Care',
        slogan: 'Tinh tế trong từng chi tiết nhỏ',
        description: 'Nailora mang đến cho bạn những bộ móng tinh tế, thời thượng cùng trải nghiệm thư giãn tuyệt vời. Chúng tôi sử dụng các dòng sơn cao cấp, an toàn cho sức khỏe và quy trình vệ sinh chuẩn y khoa.',
        address: '456 Đường Lavender, P.Thảo Điền, TP.Thủ Đức',
        city: 'Hồ Chí Minh',
        district: 'Thủ Đức',
        ward: 'Thảo Điền',
        phone: '0988 777 666',
        email: 'nailora@beauty.vn',
        categories: [BusinessCategory.NAIL, BusinessCategory.SALON],
        image_url: 'https://images.unsplash.com/photo-1604654894610-df490668711d?q=80&w=1974', // Nails
        logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=NB&backgroundColor=D4748C',
        hero_slides: [
            {
                title: 'Nghệ thuật trên đôi tay',
                subtitle: 'Khám phá bộ sưu tập màu sơn độc bản mùa lễ hội',
                image_url: 'https://images.unsplash.com/photo-1632345031435-07ca6838876f?q=80&w=2070'
            }
        ],
        working_hours: {
            'Hàng ngày': '10:00 - 20:30'
        },
        socials: {
            instagram: 'https://instagram.com/nailora.beauty',
            tiktok: 'https://tiktok.com/@nailora'
        }
    }
};

export const DEFAULT_TEMPLATE = 'luxury-minimal';
