import { LandingPageConfig } from '../../../types.ts';

export const DEFAULT_UNIFIED_CONFIG: LandingPageConfig = {
    theme_id: 'luxury-minimal',
    sections: {
        hero: {
            enabled: true,
            order: 1,
            content: {
                title: 'Tinh Hoa Làm Đẹp & Trị Liệu',
                subtitle: 'Đẳng cấp chuyên gia - Trải nghiệm chuẩn 5 sao',
                description: 'Chúng tôi mang đến giải pháp làm đẹp toàn diện, kết hợp công nghệ hiện đại và sự tận tâm từ tâm hồn.',
                image_url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?q=80&w=2070',
                cta_text: 'ĐẶT LỊCH NGAY',
                cta_link: '#booking'
            }
        },
        about: {
            enabled: true,
            order: 2,
            content: {
                title: 'Câu Chuyện Thương Hiệu',
                subtitle: 'Hành trình kiến tạo vẻ đẹp tự nhiên',
                description: 'Khởi nguồn từ khao khát mang lại sự tự tin cho phái đẹp, chúng tôi đã không ngừng nỗ lực để trở thành biểu tượng của sự tinh tế và chất lượng trong ngành thẩm mỹ.',
                image_url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2070'
            }
        },
        services: {
            enabled: true,
            order: 3,
            content: {
                title: 'Dịch Vụ Nổi Bật',
                subtitle: 'Chăm sóc toàn diện từ Thân - Tâm - Trí',
                description: 'Tận hưởng các liệu trình được thiết kế cá nhân hóa cho nhu cầu của bạn.',
                items: [
                    { id: '1', name: 'Chăm sóc da mặt chuyên sâu', price: '450k', image_url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400' },
                    { id: '2', name: 'Massage trị liệu đá nóng', price: '550k', image_url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=400' },
                    { id: '3', name: 'Nail nghệ thuật cao cấp', price: '250k', image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400' }
                ]
            }
        },
        gallery: {
            enabled: true,
            order: 4,
            content: {
                title: 'Không Gian & Khoảnh Khắc',
                subtitle: 'Góc nhìn chân thực về sự trải nghiệm',
                items: [
                    { id: 'g1', url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400' },
                    { id: 'g2', url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=400' },
                    { id: 'g3', url: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400' },
                    { id: 'g4', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400' }
                ]
            }
        },
        team: {
            enabled: true,
            order: 5,
            content: {
                title: 'Đội Ngũ Chuyên Gia',
                subtitle: 'Những bàn tay vàng kiến tạo vẻ đẹp',
                items: [
                    { id: 't1', name: 'Dr. Minh Anh', role: 'Bác sĩ Da liễu', image_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=MA' },
                    { id: 't2', name: 'Expert Thảo Vy', role: 'Bậc thầy Nail', image_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=TV' }
                ]
            }
        },
        vouchers: {
            enabled: true,
            order: 6,
            content: {
                title: 'Ưu Đãi Đặc Biệt',
                subtitle: 'Dành riêng cho khách hàng trực tuyến',
                items: [
                    { id: 'v1', title: 'Giảm 20% lần đầu', code: 'WELCOME20', image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400' }
                ]
            }
        },
        reviews: {
            enabled: true,
            order: 7,
            content: {
                title: 'Khách Hàng Nói Gì',
                subtitle: 'Xây dựng niềm tin từ sự hài lòng',
                items: [
                    { id: 'r1', name: 'Ngọc Hà', rating: 5, comment: 'Dịch vụ tuyệt vời, không gian rất thư giãn!', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=NH' },
                    { id: 'r2', name: 'Minh Tuấn', rating: 5, comment: 'Đã quay lại lần thứ 3 vì quả nhiên chất lượng quá tốt.', avatar_url: 'https://api.dicebear.com/7.x/notionists/svg?seed=MT' }
                ]
            }
        },
        blog: {
            enabled: true,
            order: 8,
            content: {
                title: 'Tin Tức & Bí Quyết',
                subtitle: 'Cập nhật kiến thức làm đẹp mới nhất',
                items: [
                    { id: 'b1', title: '5 bước chăm sóc da mùa hè', excerpt: 'Bí quyết giúp làn da luôn ẩm mượt...', image_url: 'https://images.unsplash.com/photo-1544161515-4af6b1d462c2?w=400' }
                ]
            }
        },
        video: {
            enabled: true,
            order: 9,
            content: {
                title: 'Video Showcase',
                subtitle: 'Hành trình trải nghiệm thực tế',
                video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            }
        },
        trust: {
            enabled: true,
            order: 10,
            content: {
                title: 'Chứng Chỉ & Uy Tín',
                subtitle: 'Cam kết chất lượng cao nhất',
                items: [
                    { id: 'tr1', label: 'Chứng nhận 5 sao', icon: 'award' },
                    { id: 'tr2', label: 'Sản phẩm Organic', icon: 'shield' }
                ]
            }
        },
        cta: {
            enabled: true,
            order: 11,
            content: {
                title: 'Sẵn Sàng Để Tỏa Sáng?',
                subtitle: 'Hãy để chúng tôi chăm sóc bạn ngay hôm nay',
                cta_text: 'ĐẶT LỊCH NGAY',
                cta_link: '#booking'
            }
        },
        contact: {
            enabled: true,
            order: 12,
            content: {
                title: 'Liên Hệ & Địa Chỉ',
                subtitle: 'Chúng tôi luôn lắng nghe bạn',
                description: 'Tọa lạc tại trung tâm thành phố, thuận tiện cho việc di chuyển.',
                cta_text: 'CHỈ ĐƯỜNG',
                cta_link: 'https://maps.google.com'
            }
        }
    }
};
