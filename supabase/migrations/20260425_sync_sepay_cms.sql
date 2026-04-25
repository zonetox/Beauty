-- Migration: Sync SePay and Visual CMS Fields
-- Date: 2026-04-25
-- Description: Adds CMS config to businesses and initializes SePay settings.
-- 1. Add Visual CMS configuration columns to businesses table
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS landing_page_config JSONB DEFAULT '{}'::JSONB,
    ADD COLUMN IF NOT EXISTS published_landing_page_config JSONB DEFAULT '{}'::JSONB;
COMMENT ON COLUMN public.businesses.landing_page_config IS 'Lưu trữ cấu hình chỉnh sửa (Draft) của Visual CMS';
COMMENT ON COLUMN public.businesses.published_landing_page_config IS 'Lưu trữ cấu hình đã được công bố cho khách hàng xem';
-- 2. Ensure orders table has payment_proof_url for SePay link
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
-- 3. Initialize/Update SePay config in app_settings
-- We use id = 1 as the primary settings record
INSERT INTO public.app_settings (id, settings_data)
SELECT 1,
    '{"sepay_config": {"is_enabled": false, "api_key": "", "webhook_secret": "", "qr_template": "https://api.vietqr.io/image/{{BANK_ID}}-{{ACCOUNT_NO}}-compact2.jpg?amount={{AMOUNT}}&addInfo={{CONTENT}}"}}'::jsonb
WHERE NOT EXISTS (
        SELECT 1
        FROM public.app_settings
        WHERE id = 1
    );
UPDATE public.app_settings
SET settings_data = settings_data || '{"sepay_config": {"is_enabled": false, "api_key": "", "webhook_secret": "", "qr_template": "https://api.vietqr.io/image/{{BANK_ID}}-{{ACCOUNT_NO}}-compact2.jpg?amount={{AMOUNT}}&addInfo={{CONTENT}}"}}'::jsonb
WHERE id = 1
    AND NOT (settings_data ? 'sepay_config');
-- 4. Initial Membership Packages
INSERT INTO public.membership_packages (
        id,
        name,
        price,
        duration_months,
        description,
        features,
        is_popular,
        is_active
    )
VALUES (
        'free_trial',
        'Gói Dùng Thử',
        0,
        1,
        'Trải nghiệm 30 ngày đầy đủ tính năng',
        ARRAY ['12 Section chuẩn', 'Visual CMS', 'QR Payment'],
        false,
        true
    ),
    (
        'premium_monthly',
        'Gói Premium (Tháng)',
        499000,
        1,
        'Dành cho salon chuyên nghiệp',
        ARRAY ['12 Section chuẩn', 'Visual CMS', 'Xóa Logo 1Beauty', 'Hỗ trợ 24/7'],
        true,
        true
    ),
    (
        'premium_yearly',
        'Gói Premium (Năm)',
        4990000,
        12,
        'Tiết kiệm 2 tháng sử dụng',
        ARRAY ['Tất cả tính năng Premium', 'Ưu tiên hiển thị Search', 'Hỗ trợ Marketing'],
        false,
        true
    ) ON CONFLICT (id) DO
UPDATE
SET price = EXCLUDED.price,
    duration_months = EXCLUDED.duration_months,
    description = EXCLUDED.description,
    features = EXCLUDED.features;