# Roles & Permissions Model - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## OVERVIEW

Tài liệu này định nghĩa toàn bộ roles và permissions cho hệ thống 1Beauty.asia. Permissions được lưu trong database (`admin_users.permissions` JSONB) và được enforce bởi RLS policies. Frontend chỉ đọc permissions từ database, không hardcode.

**Nguyên tắc:**
- ✅ Permission = tầng logic trên RLS (không thay thế RLS)
- ✅ RLS policies enforce security ở database level
- ✅ Permissions control UI rendering và business logic
- ❌ Không hardcode permission ở frontend
- ❌ Không bypass RLS bằng permission

---

## B2.1 - ROLE DEFINITION (FINAL)

### Danh sách Roles

Hệ thống có **6 roles** chính:

1. **anonymous** - Người dùng chưa đăng nhập
2. **user** - Người dùng đã đăng nhập (regular user)
3. **business_owner** - Chủ doanh nghiệp
4. **admin** - Quản trị viên toàn quyền
5. **moderator** - Quản trị viên giới hạn
6. **editor** - Biên tập viên nội dung

### Role Scope & Capability

#### 1. Anonymous

**Scope:**
- Không có authentication (`auth.uid() IS NULL`)
- Chỉ có thể xem nội dung công khai

**Capabilities:**
- ✅ Đọc active businesses (public data)
- ✅ Đọc services/deals/media của active businesses
- ✅ Đọc visible reviews của active businesses
- ✅ Đọc published blog posts (platform + business blogs)
- ✅ Đọc announcements
- ✅ Đọc app settings (public config)
- ✅ Đọc page content (public pages)
- ❌ Không thể tạo/update/delete bất kỳ data nào
- ❌ Không thể truy cập admin panel
- ❌ Không thể truy cập business dashboard

**Source of Truth:** Supabase Auth session (no session = anonymous)

---

#### 2. User (Authenticated)

**Scope:**
- Có authentication (`auth.uid() IS NOT NULL`)
- Có profile trong `profiles` table
- Không phải business owner (`businesses.owner_id != auth.uid()`)
- Không phải admin (email không trong `admin_users`)

**Capabilities:**
- ✅ Tất cả capabilities của Anonymous
- ✅ Đọc/update own profile
- ✅ Tạo reviews (cho bất kỳ business nào)
- ✅ Update/delete own reviews
- ✅ Tạo appointments (cho bất kỳ business nào)
- ✅ Tạo orders (membership packages)
- ✅ Quản lý favorites (thêm/xóa business vào favorites)
- ❌ Không thể quản lý business data
- ❌ Không thể truy cập admin panel
- ❌ Không thể truy cập business dashboard

**Source of Truth:** 
- Authentication: `auth.users` (Supabase Auth)
- Profile: `profiles` table
- Role check: `businesses.owner_id != auth.uid()` AND `admin_users.email != auth.users.email`

---

#### 3. Business Owner

**Scope:**
- Có authentication (`auth.uid() IS NOT NULL`)
- Có profile trong `profiles` table
- Sở hữu ít nhất 1 business (`businesses.owner_id = auth.uid()`)
- Không phải admin (email không trong `admin_users`)

**Capabilities:**
- ✅ Tất cả capabilities của User
- ✅ Đọc/update own business (kể cả khi inactive)
- ✅ CRUD services cho own business
- ✅ CRUD deals cho own business
- ✅ CRUD team_members cho own business
- ✅ CRUD media_items (gallery) cho own business
- ✅ CRUD business_blog_posts cho own business
- ✅ Update reviews của own business (để reply)
- ✅ CRUD appointments cho own business
- ✅ CRUD support_tickets cho own business
- ✅ Đọc orders của own business
- ✅ Upload files vào storage buckets (business-logos, business-gallery)
- ❌ Không thể quản lý businesses khác
- ❌ Không thể truy cập admin panel
- ❌ Không thể approve registration requests

**Source of Truth:**
- Authentication: `auth.users` (Supabase Auth)
- Profile: `profiles` table
- Ownership: `businesses.owner_id = auth.uid()`
- Role check: `businesses.owner_id = auth.uid()` AND `admin_users.email != auth.users.email`

---

#### 4. Admin

**Scope:**
- Có authentication (`auth.uid() IS NOT NULL`)
- Email trong `admin_users` table
- `admin_users.is_locked = FALSE`
- `admin_users.role = 'Admin'`
- `admin_users.permissions` = full permissions (all true)

**Capabilities:**
- ✅ Tất cả capabilities của Business Owner (nếu sở hữu business)
- ✅ Tất cả capabilities của User
- ✅ **Platform Management:**
  - View analytics
  - Manage all businesses (CRUD)
  - Approve/reject registration requests
  - Manage orders (all businesses)
  - Manage platform blog posts
  - Manage users (profiles)
  - Manage membership packages
  - Manage announcements
  - Manage support tickets (all businesses)
  - Manage site content (homepage, pages)
  - Manage system settings
  - Use admin tools
  - View activity log
  - View email log
- ✅ Bypass RLS (via Edge Functions with service role key)
- ✅ Create businesses (via Edge Function)
- ✅ Create admin users (via Edge Function)

**Source of Truth:**
- Authentication: `auth.users` (Supabase Auth)
- Admin status: `admin_users` table
- Permissions: `admin_users.permissions` JSONB column
- Role check: `admin_users.email = auth.users.email AND is_locked = FALSE AND role = 'Admin'`

---

#### 5. Moderator

**Scope:**
- Có authentication (`auth.uid() IS NOT NULL`)
- Email trong `admin_users` table
- `admin_users.is_locked = FALSE`
- `admin_users.role = 'Moderator'`
- `admin_users.permissions` = limited permissions (subset of admin)

**Capabilities:**
- ✅ Tất cả capabilities của User
- ✅ **Limited Platform Management:**
  - ❌ View analytics (NO)
  - ✅ Manage businesses (YES)
  - ✅ Approve/reject registration requests (YES)
  - ✅ Manage orders (YES)
  - ✅ Manage platform blog posts (YES)
  - ❌ Manage users (NO)
  - ❌ Manage packages (NO)
  - ✅ Manage announcements (YES)
  - ✅ Manage support tickets (YES)
  - ❌ Manage site content (NO)
  - ❌ Manage system settings (NO)
  - ❌ Use admin tools (NO)
  - ✅ View activity log (YES)
  - ❌ View email log (NO)

**Source of Truth:**
- Authentication: `auth.users` (Supabase Auth)
- Admin status: `admin_users` table
- Permissions: `admin_users.permissions` JSONB column
- Role check: `admin_users.email = auth.users.email AND is_locked = FALSE AND role = 'Moderator'`

---

#### 6. Editor

**Scope:**
- Có authentication (`auth.uid() IS NOT NULL`)
- Email trong `admin_users` table
- `admin_users.is_locked = FALSE`
- `admin_users.role = 'Editor'`
- `admin_users.permissions` = minimal permissions (content only)

**Capabilities:**
- ✅ Tất cả capabilities của User
- ✅ **Content Management Only:**
  - ❌ View analytics (NO)
  - ❌ Manage businesses (NO)
  - ❌ Approve/reject registration requests (NO)
  - ❌ Manage orders (NO)
  - ✅ Manage platform blog posts (YES) - **ONLY CAPABILITY**
  - ❌ Manage users (NO)
  - ❌ Manage packages (NO)
  - ❌ Manage announcements (NO)
  - ❌ Manage support tickets (NO)
  - ❌ Manage site content (NO)
  - ❌ Manage system settings (NO)
  - ❌ Use admin tools (NO)
  - ❌ View activity log (NO)
  - ❌ View email log (NO)

**Source of Truth:**
- Authentication: `auth.users` (Supabase Auth)
- Admin status: `admin_users` table
- Permissions: `admin_users.permissions` JSONB column
- Role check: `admin_users.email = auth.users.email AND is_locked = FALSE AND role = 'Editor'`

---

## B2.2 - PERMISSION MAPPING (ROLE × CAPABILITY)

### Capabilities Definition

Capabilities là các hành động cụ thể mà user có thể thực hiện. Mỗi capability map với:
- **RLS Policy:** Enforce ở database level
- **Permission Check:** Control UI rendering và business logic
- **Storage Policy:** Control file upload/download

### Capabilities List

#### User Capabilities
- `view_public_content` - Xem nội dung công khai
- `manage_own_profile` - Quản lý profile của chính mình
- `create_reviews` - Tạo reviews
- `manage_own_reviews` - Quản lý reviews của chính mình
- `create_appointments` - Tạo appointments
- `create_orders` - Tạo orders (membership packages)
- `manage_favorites` - Quản lý favorites

#### Business Owner Capabilities
- `manage_own_business` - Quản lý business của chính mình
- `manage_services` - CRUD services cho own business
- `manage_deals` - CRUD deals cho own business
- `manage_team_members` - CRUD team members cho own business
- `manage_gallery` - CRUD media items (gallery) cho own business
- `publish_business_blog` - CRUD business blog posts
- `reply_to_reviews` - Reply reviews của own business
- `manage_appointments` - CRUD appointments cho own business
- `manage_support_tickets` - CRUD support tickets cho own business
- `upload_business_files` - Upload files vào business storage buckets

#### Admin Capabilities (Platform Management)
- `view_analytics` - Xem analytics
- `manage_all_businesses` - CRUD tất cả businesses
- `approve_business_registration` - Approve/reject registration requests
- `manage_all_orders` - Quản lý orders của tất cả businesses
- `manage_platform_blog` - CRUD platform blog posts
- `manage_users` - Quản lý user profiles
- `manage_packages` - Quản lý membership packages
- `manage_announcements` - CRUD announcements
- `manage_all_support_tickets` - Quản lý support tickets của tất cả businesses
- `manage_site_content` - Quản lý homepage và page content
- `manage_system_settings` - Quản lý system settings
- `use_admin_tools` - Sử dụng admin tools
- `view_activity_log` - Xem activity log
- `view_email_log` - Xem email log

---

### PERMISSION MATRIX (ROLE × CAPABILITY)

| Capability | Anonymous | User | Business Owner | Admin | Moderator | Editor |
|------------|-----------|------|----------------|-------|-----------|--------|
| **User Capabilities** |
| view_public_content | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage_own_profile | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_reviews | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage_own_reviews | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_appointments | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| create_orders | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| manage_favorites | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Business Owner Capabilities** |
| manage_own_business | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| manage_services | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| manage_deals | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| manage_team_members | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| manage_gallery | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| publish_business_blog | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| reply_to_reviews | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| manage_appointments | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| manage_support_tickets | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| upload_business_files | ❌ | ❌ | ✅ | ✅* | ❌ | ❌ |
| **Admin Capabilities** |
| view_analytics | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| manage_all_businesses | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| approve_business_registration | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| manage_all_orders | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| manage_platform_blog | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| manage_users | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| manage_packages | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| manage_announcements | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| manage_all_support_tickets | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| manage_site_content | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| manage_system_settings | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| use_admin_tools | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| view_activity_log | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| view_email_log | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

**Note:** ✅* = Admin có thể làm cho tất cả businesses (không chỉ own business)

---

## B2.3 - ADMIN SUB-ROLES

### Admin Role Hierarchy

Admin roles được phân cấp theo quyền hạn:

```
Admin (Full)
  ├─ Moderator (Limited)
  └─ Editor (Content Only)
```

### Admin Permissions Structure

Permissions được lưu trong `admin_users.permissions` (JSONB column) với structure:

```typescript
interface AdminPermissions {
  canViewAnalytics: boolean;
  canManageBusinesses: boolean;
  canManageRegistrations: boolean;
  canManageOrders: boolean;
  canManagePlatformBlog: boolean;
  canManageUsers: boolean;
  canManagePackages: boolean;
  canManageAnnouncements: boolean;
  canManageSupportTickets: boolean;
  canManageSiteContent: boolean;
  canManageSystemSettings: boolean;
  canUseAdminTools: boolean;
  canViewActivityLog: boolean;
  canViewEmailLog: boolean;
}
```

### Admin Role: Full Permissions

**Role:** `AdminUserRole.ADMIN`

**Permissions (all true):**
```json
{
  "canViewAnalytics": true,
  "canManageBusinesses": true,
  "canManageRegistrations": true,
  "canManageOrders": true,
  "canManagePlatformBlog": true,
  "canManageUsers": true,
  "canManagePackages": true,
  "canManageAnnouncements": true,
  "canManageSupportTickets": true,
  "canManageSiteContent": true,
  "canManageSystemSettings": true,
  "canUseAdminTools": true,
  "canViewActivityLog": true,
  "canViewEmailLog": true
}
```

**Capabilities:**
- Full platform management
- Access to all admin features
- Can use Edge Functions (via service role)
- Can create businesses, admin users
- Can view all analytics and logs

**RLS Access:**
- Can read/write all tables (via RLS policies: `*_admin` policies)
- Can bypass RLS via Edge Functions (service role key)

---

### Moderator Role: Limited Permissions

**Role:** `AdminUserRole.MODERATOR`

**Permissions (subset):**
```json
{
  "canViewAnalytics": false,
  "canManageBusinesses": true,
  "canManageRegistrations": true,
  "canManageOrders": true,
  "canManagePlatformBlog": true,
  "canManageUsers": false,
  "canManagePackages": false,
  "canManageAnnouncements": true,
  "canManageSupportTickets": true,
  "canManageSiteContent": false,
  "canManageSystemSettings": false,
  "canUseAdminTools": false,
  "canViewActivityLog": true,
  "canViewEmailLog": false
}
```

**Capabilities:**
- ✅ Can manage businesses (CRUD)
- ✅ Can approve/reject registration requests
- ✅ Can manage orders
- ✅ Can manage platform blog
- ✅ Can manage announcements
- ✅ Can manage support tickets
- ✅ Can view activity log
- ❌ Cannot view analytics
- ❌ Cannot manage users
- ❌ Cannot manage packages
- ❌ Cannot manage site content
- ❌ Cannot manage system settings
- ❌ Cannot use admin tools
- ❌ Cannot view email log

**Use Case:**
- Day-to-day platform operations
- Business and content moderation
- Support ticket management
- Không có quyền truy cập sensitive data (analytics, system settings)

**RLS Access:**
- Same RLS policies as Admin (all `*_admin` policies)
- Permissions control UI rendering, not RLS access

---

### Editor Role: Content Only

**Role:** `AdminUserRole.EDITOR`

**Permissions (minimal):**
```json
{
  "canViewAnalytics": false,
  "canManageBusinesses": false,
  "canManageRegistrations": false,
  "canManageOrders": false,
  "canManagePlatformBlog": true,
  "canManageUsers": false,
  "canManagePackages": false,
  "canManageAnnouncements": false,
  "canManageSupportTickets": false,
  "canManageSiteContent": false,
  "canManageSystemSettings": false,
  "canUseAdminTools": false,
  "canViewActivityLog": false,
  "canViewEmailLog": false
}
```

**Capabilities:**
- ✅ Can manage platform blog posts (CRUD) - **ONLY CAPABILITY**
- ❌ Cannot access any other admin features
- ❌ Cannot manage businesses
- ❌ Cannot manage users
- ❌ Cannot view analytics

**Use Case:**
- Content creation and editing
- Platform blog management only
- Không có quyền quản lý platform operations

**RLS Access:**
- Same RLS policies as Admin for `blog_posts` table
- Permissions control UI rendering (chỉ hiển thị blog management UI)

---

## PERMISSION PRESETS

Permission presets được định nghĩa trong `constants.ts`:

```typescript
export const PERMISSION_PRESETS: Record<AdminUserRole, AdminPermissions> = {
  [AdminUserRole.ADMIN]: { /* all true */ },
  [AdminUserRole.MODERATOR]: { /* limited */ },
  [AdminUserRole.EDITOR]: { /* content only */ }
};
```

**Usage:**
- Khi tạo admin user mới, sử dụng preset tương ứng với role
- Presets là default values, có thể customize per user
- Permissions được lưu trong `admin_users.permissions` JSONB column

---

## PERMISSION vs RLS

### Relationship

**RLS (Row Level Security):**
- Enforce ở database level
- Determine: **AI ĐƯỢC ĐỌC/GHI DATA NÀO**
- Example: Business owner chỉ có thể update own business (RLS: `businesses_update_owner_or_admin`)

**Permissions:**
- Tầng logic trên RLS
- Determine: **AI ĐƯỢC XEM/THỰC HIỆN HÀNH ĐỘNG NÀO**
- Example: Moderator có `canManageBusinesses = true` → UI hiển thị business management panel

### Rules

1. **RLS là bắt buộc:** Permissions không thể bypass RLS
   - Nếu RLS block → Permission không thể override
   - Example: Editor có `canManagePlatformBlog = true` nhưng RLS vẫn enforce chỉ admin mới được delete blog posts

2. **Permissions control UI:** Permissions quyết định UI rendering
   - Frontend check permissions từ database
   - Hide/show UI elements based on permissions
   - Example: Nếu `canViewAnalytics = false` → Ẩn Analytics tab

3. **Permissions không thay thế RLS:**
   - RLS enforce security
   - Permissions control business logic và UI
   - Cả hai phải align với nhau

---

## FRONTEND PERMISSION CHECK

### Implementation Pattern

**❌ WRONG (Hardcode):**
```typescript
// DON'T DO THIS
if (user.email === 'admin@example.com') {
  showAdminPanel();
}
```

**✅ CORRECT (Database-based):**
```typescript
// DO THIS
const { data: adminUser } = await supabase
  .from('admin_users')
  .select('permissions')
  .eq('email', user.email)
  .single();

if (adminUser?.permissions?.canManageBusinesses) {
  showBusinessManagementPanel();
}
```

### Permission Check Flow

```
1. User logs in
   └─> Frontend gets auth session
   
2. Frontend checks if user is admin
   └─> Query: admin_users table WHERE email = user.email
   
3. If admin user found:
   └─> Read permissions from admin_users.permissions (JSONB)
   
4. Frontend renders UI based on permissions
   └─> if (permissions.canManageBusinesses) → Show business panel
   └─> if (permissions.canViewAnalytics) → Show analytics tab
   
5. User actions are validated by RLS
   └─> Even if UI shows button, RLS can block action
```

---

## COMPLIANCE WITH ARCHITECTURE.MD

### ✅ No Hardcode Roles

- All role checks via database queries
- Permissions read from `admin_users.permissions`
- No `if (email === 'admin@...')` logic

### ✅ Single Source of Truth

- **Roles:** Database (`admin_users`, `businesses.owner_id`)
- **Permissions:** Database (`admin_users.permissions` JSONB)
- Frontend chỉ đọc, không suy đoán

### ✅ RLS-First Security

- RLS policies enforce security
- Permissions control UI/business logic
- Permissions không bypass RLS

### ✅ Frontend / Backend Contract

- Frontend: Pure client, đọc permissions từ DB
- Backend: RLS enforce security
- Edge Functions: Chỉ khi cần elevated privileges

---

## NOTES

- Permissions được lưu trong `admin_users.permissions` (JSONB)
- Permission presets trong `constants.ts` là default values
- Permissions có thể customize per user (override preset)
- Frontend phải re-fetch permissions khi cần (không cache lâu)
- RLS policies không check permissions (chỉ check role: admin/owner/user)
- Permissions chỉ control UI rendering và business logic validation

---

**Role & Permission Model Version:** 1.0  
**Status:** READY  
**Next:** B3 - Registration & Approval Flow (End-to-End)






