# Database Schema - Complete Table List

**Project:** fdklazlcbxaiapsnnbqq (supabase-BEAUTY)  
**Generated:** 2025-01-18  
**Source:** schema_v1.0_FINAL.sql + migrations

---

## 📊 COMPLETE TABLE LIST (25 Tables Found)

### BUSINESS TABLES (6 tables)
1. **businesses** - Core business information
2. **services** - Business services/offerings
3. **deals** - Promotional deals/offers
4. **team_members** - Business team members
5. **media_items** - Business gallery/media
6. **reviews** - Customer reviews

### BLOG TABLES (4 tables)
7. **blog_posts** - Platform blog posts
8. **business_blog_posts** - Business blog posts
9. **blog_comments** - Comments on blog posts
10. **blog_categories** - Blog post categories (created via migration)

### USER & AUTH TABLES (3 tables)
10. **profiles** - User profiles (extends auth.users)
11. **admin_users** - Admin user accounts
12. **business_staff** - Staff members assigned to businesses

### BUSINESS OPERATIONS TABLES (4 tables)
13. **registration_requests** - Business registration requests
14. **orders** - Business package orders
15. **appointments** - Customer appointments/bookings
16. **support_tickets** - Support ticket system

### ANALYTICS & TRACKING TABLES (2 tables)
17. **page_views** - Page view tracking
18. **conversions** - Conversion event tracking

### SYSTEM TABLES (6 tables)
19. **announcements** - System announcements
20. **app_settings** - Application settings
21. **page_content** - Page content management
22. **admin_activity_logs** - Admin activity logging
23. **email_notifications_log** - Email notification logs
24. **abuse_reports** - Abuse reports for reviews

---

## 📋 SCHEMA DETAILS

### Enums Defined:
- `membership_tier`: VIP, Premium, Free
- `business_category`: Spa & Massage, Hair Salon, Nail Salon, Beauty Clinic, Dental Clinic
- `admin_user_role`: Admin, Moderator, Editor
- `order_status`: Pending, Awaiting Confirmation, Completed, Rejected
- `media_type`: IMAGE, VIDEO
- `media_category`: Uncategorized, Interior, Exterior, Staff, Products
- `business_blog_post_status`: Draft, Published
- `review_status`: Visible, Hidden
- `staff_member_role`: Admin, Editor
- `appointment_status`: Pending, Confirmed, Cancelled, Completed
- `deal_status`: Active, Expired, Scheduled
- `ticket_status`: Open, In Progress, Closed

### Key Relationships:
- `businesses.owner_id` → `auth.users(id)`
- `profiles.business_id` → `businesses(id)`
- `business_staff.business_id` → `businesses(id)`
- `business_staff.user_id` → `auth.users(id)`
- `reviews.user_id` → `auth.users(id)`
- `reviews.business_id` → `businesses(id)`
- `services.business_id` → `businesses(id)`
- `deals.business_id` → `businesses(id)`
- `appointments.business_id` → `businesses(id)`
- `conversions.business_id` → `businesses(id)`

### RLS Status:
All tables have Row Level Security (RLS) enabled.

---

## 📈 PERFORMANCE INDEXES

### Critical Indexes for Timeout Prevention (Added: 2025-01-18)

**page_content table:**
- `idx_page_content_page_name` - For homepage content queries

**blog_categories table:**
- `idx_blog_categories_name` - For category ordering queries

**membership_packages table:**
- `idx_membership_packages_active_price` - For active packages with price ordering
- `idx_membership_packages_is_active` - For active package filtering

**businesses table:**
- `idx_businesses_location_coords` - For map markers queries (is_active + latitude/longitude)
- `idx_businesses_active_featured_id` - For homepage featured businesses
- `idx_businesses_active_city_district` - For location-based filtering

**blog_posts table:**
- `idx_blog_posts_date_desc` - For date-ordered blog listings

**blog_comments table:**
- `idx_blog_comments_post_id_date` - For post comments with date ordering
- `idx_blog_comments_date` - For general date ordering

See migration: `database/migrations/20250118000001_fix_timeout_queries_indexes.sql`

---

## ⚠️ NOTE

**Expected:** 27 tables  
**Found:** 25 tables  
**Difference:** 2 tables missing

Possible reasons:
- Additional tables in `auth` schema (not in public schema)
- Tables created manually in Supabase dashboard
- Tables from other migrations not yet reviewed
- System tables (e.g., `_prisma_migrations`, `supabase_migrations`)

To verify complete list, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 🔍 VERIFICATION QUERY

To get exact table count from database:
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```
