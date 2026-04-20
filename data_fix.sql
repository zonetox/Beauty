-- SQL Script to synchronize demo businesses with actual admin accounts
-- Run this in Supabase SQL Editor
-- ---------------------------------------------------------
-- STEP 1: Link all businesses that have no owner to 'user1@gmail.com'
-- ---------------------------------------------------------
UPDATE businesses
SET owner_id = 'd41f11b9-03a3-4ac3-bb82-e62dc4de860b'::uuid
WHERE owner_id IS NULL;
-- ---------------------------------------------------------
-- STEP 2: ENSURE VALID SLUGS (Fixes 'Role Resolution Failed' and broken links)
-- ---------------------------------------------------------
UPDATE businesses
SET slug = lower(replace(name, ' ', '-')) || '-' || floor(random() * 1000)::text
WHERE slug IS NULL
    OR slug = '';
-- ---------------------------------------------------------
-- STEP 3: FIX COORDINATES (Ensure visibility on Map)
-- ---------------------------------------------------------
UPDATE businesses
SET latitude = CASE
        WHEN latitude = 0
        OR latitude IS NULL THEN 10.7769
        ELSE latitude
    END,
    longitude = CASE
        WHEN longitude = 0
        OR longitude IS NULL THEN 106.7009
        ELSE longitude
    END
WHERE latitude IS NULL
    OR longitude IS NULL
    OR (
        latitude = 0
        AND longitude = 0
    );
-- OPTIONAL: If you want to link another business to 'phucnguyen@gmail.com'
-- UPDATE businesses SET owner_id = '9d43360e-d9a3-4f7d-a4df-ac990d322fc4'::uuid WHERE name = 'Tên Doanh Nghiệp Cụ Thể';