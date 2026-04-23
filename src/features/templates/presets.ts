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
        name: 'Luxury Minimal — Sang Trọng',
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
        name: 'Korean Clinic — Chuẩn Hàn',
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
        name: 'Nature Spa — Thuần Khiết',
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
        name: 'Dark Premium — Huyền Bí',
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
        name: 'Modern Beauty — Hiện Đại',
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
    },
    'golden-ratio': {
        id: 'golden-ratio',
        name: 'The Golden Ratio — Tỷ Lệ Vàng',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#B2A59B',    // Earthy Taupe
                primary_dark: '#968A7D',
                secondary: '#4A4540',  // Deep Espresso
                accent: '#D4AF37',     // Classical Gold
                background: '#F5F2F0', // Marble White
                neutral_dark: '#2D2D2A',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Playfair Display',
            },
        },
        styles: {
            heroOverlay: 'rgba(178, 165, 155, 0.1)',
            cardStyle: 'flat',
            mapFilter: 'contrast(1.05) brightness(1.02)',
            galleryLayout: 'masonry',
            buttonStyle: 'sharp'
        }
    },
    'luxury-hair': {
        id: 'luxury-hair',
        name: 'Luxury Hair — Đẳng Cấp',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#8D4949',    // Rich Sienna
                primary_dark: '#6E3838',
                secondary: '#422E2E',
                accent: '#C5A059',     // Antique Brass
                background: '#FAF7F2', // Creamy Linen
                neutral_dark: '#1E1E1E',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Cormorant Garamond',
            },
        },
        styles: {
            heroOverlay: 'rgba(141, 73, 73, 0.15)',
            cardStyle: 'elevated',
            mapFilter: 'saturate(1.2) contrast(1.1)',
            galleryLayout: 'grid',
            buttonStyle: 'pill'
        }
    },
    'q-clinic': {
        id: 'q-clinic',
        name: 'Q Clinic — Modern',
        theme: {
            logo_url: '/logo.svg',
            favicon_url: '/favicon.svg',
            colors: {
                primary: '#B01B4D',    // Deep Raspberry
                primary_dark: '#880E4F',
                secondary: '#4A148C',  // Medical Purple
                accent: '#AD1457',     // Magenta
                background: '#FFF5F8', // Clinic White/Pink
                neutral_dark: '#263238',
            },
            fonts: {
                sans: 'Outfit',
                serif: 'Lora',
            },
        },
        styles: {
            heroOverlay: 'rgba(176, 27, 77, 0.08)',
            cardStyle: 'glass',
            mapFilter: 'brightness(1.05) contrast(0.95)',
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
        },
        services: [
            { id: 'S1', business_id: 0, name: 'Massage Thư Giãn Toàn Thân', price: '350.000đ', description: 'Liệu trình massage bằng tinh dầu thiên nhiên, giúp giảm căng thẳng và mệt mỏi.', image_url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=800', duration_minutes: 60, position: 1 },
            { id: 'S2', business_id: 0, name: 'Chăm Sóc Da Mặt Chuyên Sâu', price: '450.000đ', description: 'Làm sạch sâu, cấp ẩm và phục hồi làn da với dưỡng chất từ tảo biển tươi.', image_url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800', duration_minutes: 60, position: 2 },
            { id: 'S3', business_id: 0, name: 'Gội Đầu Dưỡng Sinh', price: '150.000đ', description: 'Kỹ thuật gội kết hợp massage ấn huyệt cổ vai gáy, dùng thảo dược thiên nhiên.', image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800', duration_minutes: 45, position: 3 }
        ],
        gallery: [
            { id: 'G1', business_id: 0, url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=800', type: 'IMAGE' as any, category: 'Interior' as any, position: 1 },
            { id: 'G2', business_id: 0, url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=800', type: 'IMAGE' as any, category: 'Interior' as any, position: 2 },
            { id: 'G3', business_id: 0, url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800', type: 'IMAGE' as any, category: 'Interior' as any, position: 3 }
        ],
        team: [
            { id: 'T1', business_id: 0, name: 'Lê Ngọc', role: 'Chuyên viên Massage', image_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=LN' },
            { id: 'T2', business_id: 0, name: 'Trần Mai', role: 'Kỹ thuật viên Da liễu', image_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=TM' }
        ],
        reviews: [
            { id: 'R1', business_id: 0, user_name: 'Minh Thư', user_avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=MT', rating: 5, comment: 'Không gian ấm cúng, thư giãn hoàn toàn. Nhân viên rất nhẹ nhàng và chuyên nghiệp.', submitted_date: new Date().toISOString(), status: 'Visible' as any }
        ]
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
    },
    'golden-ratio': {
        name: 'Ratio Aesthetics Clinic',
        slogan: 'The Golden Balance of Beauty',
        description: 'Tại Ratio, chúng tôi tin vào tỷ lệ vàng của vẻ đẹp. Phương pháp của chúng tôi kết hợp khoa học tiên tiến với sự hài hòa về thẩm mỹ để phục hồi, tái tạo và làm trẻ hóa làn da của bạn.',
        address: '789 Đường Tôn Dật Tiên, Phú Mỹ Hưng, Quận 7',
        city: 'Hồ Chí Minh',
        district: 'Quận 7',
        ward: 'Tân Phong',
        phone: '0900 111 222',
        email: 'contact@ratio.vn',
        categories: [BusinessCategory.CLINIC, BusinessCategory.SPA],
        image_url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2070', // Modern clinic interior
        logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=RA&backgroundColor=B2A59B',
        hero_slides: [
            {
                title: 'The Golden Balance',
                subtitle: 'Vẻ đẹp khởi nguồn từ sự hài hòa hoàn hảo',
                image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2070' // Professional beauty shot
            }
        ],
        working_hours: {
            'Thứ 2 - Thứ 7': '08:00 - 20:00',
            'Chủ Nhật': '09:00 - 18:00'
        }
    },
    'luxury-hair': {
        name: 'The Hair Masters',
        slogan: 'Luxurious Hair For You',
        description: 'Đăng ký trực tuyến để trải nghiệm dịch vụ chăm sóc tóc chuyên nghiệp. Tại salon của chúng tôi, những bậc thầy làm tóc hàng đầu thế giới sẽ mang đến cho bạn mái tóc hoàn mỹ trong không gian sang trọng và âm nhạc tinh tế.',
        address: '101 Đường Lê Lợi, Quận 1',
        city: 'Hồ Chí Minh',
        district: 'Quận 1',
        ward: 'Bến Nghé',
        phone: '0911 222 333',
        email: 'salon@hairmasters.vn',
        categories: [BusinessCategory.SALON],
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2074', // Luxury salon
        logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=HM&backgroundColor=8D4949',
        hero_slides: [
            {
                title: 'LUXURIOUS HAIR FOR YOU',
                subtitle: 'Khám phá bí mật đằng sau mái tóc rạng ngời',
                image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2069' // Model with luxury hair
            }
        ],
        working_hours: {
            'Hàng ngày': '09:00 - 21:00'
        },
        services: [
            { id: 'S1', business_id: 0, name: 'Cắt Tóc & Tạo Kiểu Cao Cấp', price: '300.000đ', description: 'Được phục vụ bởi các thợ chính và Master. Bao gồm gội massage nhẹ.', image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', duration_minutes: 45, position: 1 },
            { id: 'S2', business_id: 0, name: 'Uốn/Duỗi Công Nghệ Nano', price: '1.200.000đ', description: 'Trải nghiệm công nghệ nano bảo vệ tóc tối đa, uốn chuẩn salon.', image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800', duration_minutes: 120, position: 2 }
        ],
        gallery: [
            { id: 'G1', business_id: 0, url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', type: 'IMAGE' as any, category: 'Interior' as any, position: 1 },
            { id: 'G2', business_id: 0, url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800', type: 'IMAGE' as any, category: 'Interior' as any, position: 2 }
        ]
    },
    'q-clinic': {
        name: 'Q Clinic & Beauty',
        slogan: 'Trust your beauty to professionals',
        description: 'Chúng tôi sử dụng những công nghệ hiện đại và an toàn nhất trong ngành thẩm mỹ y khoa. Hãy để đội ngũ bác sĩ chuyên gia của Q Clinic chăm sóc và nâng tầm vẻ đẹp tự nhiên của bạn.',
        address: '202 Đường Nguyễn Văn Linh, Quận 7',
        city: 'Hồ Chí Minh',
        district: 'Quận 7',
        ward: 'Tân Phong',
        phone: '0922 333 444',
        email: 'info@qclinic.vn',
        categories: [BusinessCategory.CLINIC],
        image_url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053', // Clinic operation
        logo_url: 'https://api.dicebear.com/7.x/initials/svg?seed=QC&backgroundColor=B01B4D',
        hero_slides: [
            {
                title: 'Trust your beauty to professionals',
                subtitle: 'Sắc đẹp của bạn là sứ mệnh của chúng tôi',
                image_url: 'https://images.unsplash.com/photo-1576091160550-2173bdb999ef?q=80&w=2070' // Healthcare professional
            }
        ],
        working_hours: {
            'Thứ 2 - Thứ 6': '08:30 - 19:30',
            'Thứ 7 - CN': '09:00 - 17:30'
        }
    }
};

export const DEFAULT_TEMPLATE = 'luxury-minimal';
