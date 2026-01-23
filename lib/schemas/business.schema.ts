import { z } from 'zod';

/**
 * BUSINESS REGISTRATION SCHEMAS
 * 
 * Đảm bảo đồng bộ giữa Frontend - Backend - Database
 */

// ============================================
// FRONTEND FORM SCHEMA
// ============================================

export const BusinessRegistrationFormSchema = z.object({
    // Account Information
    email: z.string()
        .email('Email không hợp lệ')
        .min(1, 'Email là bắt buộc'),

    password: z.string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(100, 'Mật khẩu quá dài'),

    confirmPassword: z.string()
        .min(1, 'Vui lòng xác nhận mật khẩu'),

    // Business Information
    business_name: z.string()
        .min(2, 'Tên doanh nghiệp phải có ít nhất 2 ký tự')
        .max(200, 'Tên doanh nghiệp quá dài'),

    phone: z.string()
        .regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),

    address: z.string()
        .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
        .max(500, 'Địa chỉ quá dài'),

    category: z.string()
        .min(1, 'Vui lòng chọn danh mục'),

    description: z.string()
        .max(1000, 'Mô tả quá dài')
        .optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
});

export type BusinessRegistrationFormData = z.infer<typeof BusinessRegistrationFormSchema>;

// ============================================
// DATABASE SCHEMAS
// ============================================

/**
 * Profile Schema - MUST match database table structure
 */
export const DatabaseProfileSchema = z.object({
    id: z.string().uuid(),
    updated_at: z.string().datetime().nullable(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable(),
    email: z.string().nullable(),
    business_id: z.number().nullable(),
    favorites: z.array(z.number()).nullable(),
    user_type: z.enum(['user', 'business']).default('user'), // NEW FIELD
});

export type DatabaseProfile = z.infer<typeof DatabaseProfileSchema>;

/**
 * Business Schema - MUST match database table structure
 */
export const DatabaseBusinessSchema = z.object({
    id: z.number(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().nullable(),
    name: z.string(),
    slug: z.string(),
    category: z.string(),
    description: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    website: z.string().nullable(),
    address: z.string().nullable(),
    city: z.string().nullable(),
    district: z.string().nullable(),
    ward: z.string().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    logo_url: z.string().nullable(),
    cover_image_url: z.string().nullable(),
    rating: z.number().nullable(),
    review_count: z.number().nullable(),
    view_count: z.number().nullable(),
    is_verified: z.boolean().nullable(),
    is_featured: z.boolean().nullable(),
    status: z.enum(['Active', 'Inactive', 'Pending']).nullable(),
    subscription_tier: z.enum(['Free', 'Basic', 'Premium', 'Enterprise']).nullable(),
    subscription_expires_at: z.string().datetime().nullable(),
    business_hours: z.record(z.string(), z.unknown()).nullable(),
    social_links: z.record(z.string(), z.unknown()).nullable(),
    amenities: z.array(z.string()).nullable(),
    payment_methods: z.array(z.string()).nullable(),
    languages: z.array(z.string()).nullable(),
    certifications: z.array(z.string()).nullable(),
    owner_id: z.string().uuid().nullable(),
});

export type DatabaseBusiness = z.infer<typeof DatabaseBusinessSchema>;

// ============================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================

/**
 * Request schema for atomic business registration
 */
export const RegisterBusinessRequestSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    full_name: z.string(),
    business_name: z.string(),
    phone: z.string(),
    address: z.string(),
    category: z.string(),
    description: z.string().optional(),
});

export type RegisterBusinessRequest = z.infer<typeof RegisterBusinessRequestSchema>;

/**
 * Response schema from register_business_atomic function
 */
export const RegisterBusinessResponseSchema = z.object({
    business_id: z.number(),
    slug: z.string(),
});

export type RegisterBusinessResponse = z.infer<typeof RegisterBusinessResponseSchema>;
