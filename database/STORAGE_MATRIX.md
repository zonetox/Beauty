# Storage Policies Matrix - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## BUCKET OVERVIEW

### Bucket: `avatars`
- **Purpose:** User profile avatars
- **Path Structure:** `/user/{user_id}/{filename}`
- **Public Read:** ✅ Yes (public assets)
- **Public Write:** ❌ No (authenticated users only, own folder)

### Bucket: `business-logos`
- **Purpose:** Business logos
- **Path Structure:** `/business/{business_id}/{filename}`
- **Public Read:** ✅ Yes (public assets)
- **Public Write:** ❌ No (business owners/admins only)

### Bucket: `business-gallery`
- **Purpose:** Business gallery images and media
- **Path Structure:** `/business/{business_id}/{filename}`
- **Public Read:** ✅ Yes (public assets)
- **Public Write:** ❌ No (business owners/admins only)

### Bucket: `blog-images`
- **Purpose:** Blog post images (platform and business blogs)
- **Path Structure:** `/blog/{blog_post_id}/{filename}`
- **Public Read:** ✅ Yes (public assets)
- **Public Write:** ❌ No (admins/authenticated users, ownership verified at app level)

---

## STORAGE POLICIES MATRIX

### Bucket: avatars

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT (Read) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) |
| INSERT (Upload) | ❌ No | ✅ Own folder only (`/user/{user_id}/`) | ✅ Own folder only | ✅ Any folder |
| UPDATE | ❌ No | ✅ Own files only | ✅ Own files only | ✅ Any file |
| DELETE | ❌ No | ✅ Own files only | ✅ Own files only | ✅ Any file |

**Notes:**
- Public read access for all avatars
- Users can only upload to `/user/{their_user_id}/` folder
- Users cannot upload to other users' folders
- Admins have full access

---

### Bucket: business-logos

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT (Read) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) |
| INSERT (Upload) | ❌ No | ❌ No | ✅ Own business folder (`/business/{business_id}/`) | ✅ Any folder |
| UPDATE | ❌ No | ❌ No | ✅ Own business files only | ✅ Any file |
| DELETE | ❌ No | ❌ No | ✅ Own business files only | ✅ Any file |

**Notes:**
- Public read access for all logos
- Business owners can only upload to `/business/{their_business_id}/` folder
- Business owners cannot upload to other businesses' folders
- Admins have full access

---

### Bucket: business-gallery

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT (Read) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) |
| INSERT (Upload) | ❌ No | ❌ No | ✅ Own business folder (`/business/{business_id}/`) | ✅ Any folder |
| UPDATE | ❌ No | ❌ No | ✅ Own business files only | ✅ Any file |
| DELETE | ❌ No | ❌ No | ✅ Own business files only | ✅ Any file |

**Notes:**
- Public read access for all gallery images
- Business owners can only upload to `/business/{their_business_id}/` folder
- Business owners cannot upload to other businesses' folders
- Admins have full access

---

### Bucket: blog-images

| Operation | Anonymous | User | Business Owner | Admin |
|-----------|-----------|------|----------------|-------|
| SELECT (Read) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) | ✅ Yes (public) |
| INSERT (Upload) | ❌ No | ✅ Yes (authenticated) | ✅ Yes (authenticated) | ✅ Any folder |
| UPDATE | ❌ No | ✅ Own files (if applicable) | ✅ Own files (if applicable) | ✅ Any file |
| DELETE | ❌ No | ✅ Own files (if applicable) | ✅ Own files (if applicable) | ✅ Any file |

**Notes:**
- Public read access for all blog images
- Authenticated users can upload (ownership verified at application level via business_blog_posts RLS)
- Business owners upload for their blog posts (RLS on business_blog_posts enforces ownership)
- Admins have full access
- Path structure: `/blog/{blog_post_id}/` (can be platform blog ID or business blog UUID)

---

## PATH STRUCTURE RULES

### Valid Paths

**avatars:**
- ✅ `/user/{user_id}/{filename}`
- ❌ `/user/{other_user_id}/{filename}` (for non-owners)
- ❌ `/business/{business_id}/{filename}` (wrong bucket)

**business-logos:**
- ✅ `/business/{business_id}/{filename}`
- ❌ `/business/{other_business_id}/{filename}` (for non-owners)
- ❌ `/user/{user_id}/{filename}` (wrong bucket)

**business-gallery:**
- ✅ `/business/{business_id}/{filename}`
- ❌ `/business/{other_business_id}/{filename}` (for non-owners)
- ❌ `/user/{user_id}/{filename}` (wrong bucket)

**blog-images:**
- ✅ `/blog/{blog_post_id}/{filename}`
- ✅ `/blog/{business_blog_uuid}/{filename}`
- ✅ `/blog/{platform_blog_id}/{filename}`

### Path Security

- Paths must start with the correct prefix (`/user/`, `/business/`, `/blog/`)
- Business ID in path must match user's business ownership (enforced by policy)
- User ID in path must match `auth.uid()` (enforced by policy)
- No wildcard paths allowed
- No path guessing possible (paths are explicit)

---

## SECURITY VERIFICATION CASES

### Positive Cases (Should Work)

1. ✅ Anonymous user can read all avatars (public read)
2. ✅ Anonymous user can read all business logos (public read)
3. ✅ Anonymous user can read all gallery images (public read)
4. ✅ Anonymous user can read all blog images (public read)
5. ✅ User can upload avatar to `/user/{their_user_id}/` folder
6. ✅ User can update/delete their own avatar files
7. ✅ Business owner can upload logo to `/business/{their_business_id}/` folder
8. ✅ Business owner can upload gallery images to `/business/{their_business_id}/` folder
9. ✅ Business owner can update/delete their own business files
10. ✅ Admin can upload/update/delete files in any folder

### Negative Cases (Should NOT Work)

1. ❌ Anonymous user cannot upload any files
2. ❌ User cannot upload to `/user/{other_user_id}/` folder
3. ❌ User cannot upload to `/business/{business_id}/` folder
4. ❌ Business owner cannot upload to `/business/{other_business_id}/` folder
5. ❌ Business owner cannot upload to `/user/{user_id}/` folder (wrong bucket)
6. ❌ User cannot update/delete other users' avatar files
7. ❌ Business owner cannot update/delete other businesses' files
8. ❌ User cannot overwrite files they don't own
9. ❌ No public write access (all buckets require authentication for write)
10. ❌ Invalid paths (wrong prefix) are rejected

---

## HELPER FUNCTIONS

### `public.extract_business_id_from_path(path TEXT)`
- Extracts business_id from path like `/business/123/filename.jpg`
- Returns BIGINT or NULL
- Used for path validation

### `public.extract_user_id_from_path(path TEXT)`
- Extracts user_id from path like `/user/{uuid}/filename.jpg`
- Returns UUID or NULL
- Used for path validation

### `split_part(name, '/', n)`
- PostgreSQL function
- Extracts folder names from file path
- Used in policies: `split_part(name, '/', 1)` = first folder, `split_part(name, '/', 2)` = second folder

---

## POLICY ENFORCEMENT DETAILS

### Path Validation

Policies use `storage.foldername(name)` to extract folder structure:
- `(storage.foldername(name))[1]` = First folder (e.g., "user", "business", "blog")
- `(storage.foldername(name))[2]` = Second folder (e.g., user_id, business_id, blog_post_id)

### Role Checking

Policies reuse helper functions from RLS policies:
- `public.is_admin(public.get_user_email())` - Checks admin_users table
- `public.is_business_owner(auth.uid(), business_id)` - Checks businesses.owner_id

### Security Principles

1. ✅ No public write (all INSERT/UPDATE/DELETE require authentication)
2. ✅ Public read for all buckets (public assets)
3. ✅ Path-based access control (users can only access their own folders)
4. ✅ Database-based role checking (no hardcode)
5. ✅ No wildcard paths (explicit path validation)
6. ✅ No signed URLs needed for public assets (buckets are public)

---

## NOTES

- All buckets are PUBLIC (public read access)
- Write access is restricted by policies (no public write)
- Path structure enforces organization and security
- Policies use database-based role checking (no hardcode)
- Helper functions from `rls_policies_v1.sql` must exist
- Buckets must be created via Supabase Dashboard or API before policies can be applied
- Policies are enforced at storage level (Supabase Storage RLS)
- File type and size validation should be handled at application level

---

## MIGRATION FROM EXISTING STORAGE

If migrating from existing storage setup:

1. **Existing bucket:** `business-assets` (from codebase)
   - **Action:** Migrate to new bucket structure:
     - Business logos → `business-logos` bucket
     - Business gallery → `business-gallery` bucket
   - **Update code:** Update `lib/storage.ts` to use new bucket names

2. **Path structure change:**
   - Old: `${businessId}/gallery` (flat structure)
   - New: `/business/{business_id}/{filename}` (explicit structure)
   - **Action:** Update upload paths in code

3. **Avatar storage:**
   - **Action:** Create `avatars` bucket if not exists
   - **Path:** `/user/{user_id}/{filename}`

4. **Blog images:**
   - **Action:** Create `blog-images` bucket if not exists
   - **Path:** `/blog/{blog_post_id}/{filename}`

---

**Storage Policies Version:** 1.0  
**Status:** READY  
**Next:** A4.3 - Security Verification (Testing)

