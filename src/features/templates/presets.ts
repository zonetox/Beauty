import { ThemeSettings } from '../../../types.ts';

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
                primary: '#BFA16A', // Gold
                primary_dark: '#A98C5A',
                secondary: '#4A4A4A',
                accent: '#EAE0D1',
                background: '#FDFCF9', // Bone/Cream
                neutral_dark: '#2D2D2D',
            },
            fonts: {
                sans: 'Inter',
                serif: 'Playfair Display',
            },
        },
        styles: {
            heroOverlay: 'rgba(253, 252, 249, 0.4)',
            cardStyle: 'flat',
            mapFilter: 'grayscale(100%) opacity(0.8)',
            galleryLayout: 'masonry',
            buttonStyle: 'sharp'
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
                primary: '#FF007A', // Vibrant Pink
                primary_dark: '#CC0062',
                secondary: '#333333',
                accent: '#FFEBEE',
                background: '#FFFFFF', // Pure White
                neutral_dark: '#1A1A1A',
            },
            fonts: {
                sans: 'Montserrat',
                serif: 'Inter',
            },
        },
        styles: {
            heroOverlay: 'rgba(255, 255, 255, 0.2)',
            cardStyle: 'elevated',
            mapFilter: 'saturate(1.2)',
            galleryLayout: 'grid',
            buttonStyle: 'pill'
        }
    }
};

export const DEFAULT_TEMPLATE = 'luxury-minimal';
