# Database Schema

**Last Updated:** 2025-01-11  
**Source:** Supabase Database (read via MCP)  
**Total Tables:** 23  
**Note:** This document reflects EXACTLY what exists in the database. No assumptions made.

---

## Table: `admin_activity_logs`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `admin_username` | text | NOT NULL | - | - |
| `action` | text | NOT NULL | - | - |
| `details` | text | NULL | - | - |
| `timestamp` | timestamp with time zone | NULL | `now()` | - |
| `created_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `admin_users`

**Primary Key:** `id` (bigint)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | bigint | NOT NULL | Identity (BY DEFAULT) | Primary key |
| `username` | text | NOT NULL | - | Unique |
| `email` | text | NOT NULL | - | Unique |
| `password` | text | NULL | - | - |
| `role` | admin_user_role | NULL | `'Editor'::admin_user_role` | Enum type |
| `permissions` | jsonb | NULL | - | - |
| `last_login` | timestamp with time zone | NULL | - | - |
| `is_locked` | boolean | NULL | `false` | - |

---

## Table: `announcements`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `title` | text | NOT NULL | - | - |
| `content` | text | NOT NULL | - | - |
| `type` | text | NOT NULL | - | - |
| `created_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `app_settings`

**Primary Key:** `id` (integer)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | integer | NOT NULL | - | Primary key |
| `settings_data` | jsonb | NULL | - | - |

---

## Table: `appointments`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `service_id` | uuid | NULL | - | Foreign key to `services.id` |
| `service_name` | text | NULL | - | - |
| `staff_member_id` | text | NULL | - | - |
| `customer_name` | text | NOT NULL | - | - |
| `customer_email` | text | NULL | - | - |
| `customer_phone` | text | NOT NULL | - | - |
| `date` | date | NOT NULL | - | - |
| `time_slot` | time without time zone | NOT NULL | - | - |
| `status` | appointment_status | NULL | `'Pending'::appointment_status` | Enum type |
| `notes` | text | NULL | - | - |
| `created_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `blog_categories`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `name` | text | NOT NULL | - | Unique |
| `created_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `blog_comments`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `post_id` | bigint | NOT NULL | - | Foreign key to `blog_posts.id` |
| `author_name` | text | NOT NULL | - | - |
| `content` | text | NOT NULL | - | - |
| `date` | timestamp with time zone | NULL | `now()` | - |
| `created_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `blog_posts`

**Primary Key:** `id` (bigint)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | bigint | NOT NULL | Identity (BY DEFAULT) | Primary key |
| `slug` | text | NOT NULL | - | Unique |
| `title` | text | NOT NULL | - | - |
| `image_url` | text | NOT NULL | - | - |
| `excerpt` | text | NULL | - | - |
| `author` | text | NULL | - | - |
| `date` | timestamp with time zone | NULL | `now()` | - |
| `category` | text | NULL | - | - |
| `content` | text | NULL | - | - |
| `view_count` | integer | NULL | `0` | - |

---

## Table: `business_blog_posts`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `slug` | text | NOT NULL | - | - |
| `title` | text | NOT NULL | - | - |
| `excerpt` | text | NULL | - | - |
| `image_url` | text | NULL | - | - |
| `content` | text | NULL | - | - |
| `author` | text | NULL | - | - |
| `created_date` | timestamp with time zone | NULL | `now()` | - |
| `published_date` | timestamp with time zone | NULL | - | - |
| `status` | business_blog_post_status | NULL | `'Draft'::business_blog_post_status` | Enum type |
| `view_count` | integer | NULL | `0` | - |
| `is_featured` | boolean | NULL | `false` | - |
| `seo` | jsonb | NULL | - | - |

---

## Table: `businesses`

**Primary Key:** `id` (bigint)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | bigint | NOT NULL | Identity (BY DEFAULT) | Primary key |
| `slug` | text | NOT NULL | - | Unique |
| `name` | text | NOT NULL | - | - |
| `logo_url` | text | NULL | - | - |
| `image_url` | text | NOT NULL | - | - |
| `slogan` | text | NULL | - | - |
| `categories` | ARRAY (business_category) | NOT NULL | - | Array of enum values |
| `address` | text | NOT NULL | - | - |
| `city` | text | NOT NULL | - | - |
| `district` | text | NOT NULL | - | - |
| `ward` | text | NOT NULL | - | - |
| `latitude` | double precision | NULL | - | - |
| `longitude` | double precision | NULL | - | - |
| `tags` | ARRAY (text) | NULL | - | - |
| `phone` | text | NOT NULL | - | - |
| `email` | text | NULL | - | - |
| `website` | text | NULL | - | - |
| `youtube_url` | text | NULL | - | - |
| `rating` | double precision | NULL | `0` | - |
| `review_count` | integer | NULL | `0` | - |
| `view_count` | integer | NULL | `0` | - |
| `membership_tier` | membership_tier | NULL | `'Free'::membership_tier` | Enum type |
| `membership_expiry_date` | timestamp with time zone | NULL | - | - |
| `is_verified` | boolean | NULL | `false` | - |
| `is_active` | boolean | NULL | `true` | - |
| `is_featured` | boolean | NULL | `false` | - |
| `joined_date` | timestamp with time zone | NULL | `now()` | - |
| `description` | text | NOT NULL | - | - |
| `working_hours` | jsonb | NOT NULL | - | - |
| `socials` | jsonb | NULL | - | - |
| `seo` | jsonb | NULL | - | - |
| `notification_settings` | jsonb | NULL | - | - |
| `hero_slides` | jsonb | NULL | - | - |
| `hero_image_url` | text | NULL | - | - |
| `owner_id` | uuid | NULL | - | Foreign key to `auth.users.id` |
| `staff` | jsonb | NULL | `'[]'::jsonb` | - |

---

## Table: `deals`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `title` | text | NOT NULL | - | - |
| `description` | text | NOT NULL | - | - |
| `image_url` | text | NULL | - | - |
| `start_date` | timestamp with time zone | NULL | - | - |
| `end_date` | timestamp with time zone | NULL | - | - |
| `discount_percentage` | double precision | NULL | - | - |
| `original_price` | double precision | NULL | - | - |
| `deal_price` | double precision | NULL | - | - |
| `status` | deal_status | NULL | `'Active'::deal_status` | Enum type |

---

## Table: `email_notifications_log`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `recipient_email` | text | NOT NULL | - | - |
| `subject` | text | NOT NULL | - | - |
| `body` | text | NOT NULL | - | - |
| `sent_at` | timestamp with time zone | NULL | `now()` | - |
| `read` | boolean | NULL | `false` | - |
| `read_at` | timestamp with time zone | NULL | - | - |
| `created_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `media_items`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `url` | text | NOT NULL | - | - |
| `type` | media_type | NULL | `'IMAGE'::media_type` | Enum type |
| `category` | media_category | NULL | `'Uncategorized'::media_category` | Enum type |
| `title` | text | NULL | - | - |
| `description` | text | NULL | - | - |
| `position` | integer | NULL | `0` | - |

---

## Table: `membership_packages`

**Primary Key:** `id` (text)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | text | NOT NULL | - | Primary key |
| `name` | text | NOT NULL | - | - |
| `price` | numeric | NOT NULL | - | - |
| `duration_months` | integer | NOT NULL | - | - |
| `description` | text | NULL | - | - |
| `features` | ARRAY (text) | NULL | - | - |
| `permissions` | jsonb | NULL | - | - |
| `is_popular` | boolean | NULL | `false` | - |
| `is_active` | boolean | NULL | `true` | - |

---

## Table: `notifications`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NOT NULL | - | Foreign key to `auth.users.id` |
| `type` | notification_type | NOT NULL | - | Enum type |
| `title` | text | NOT NULL | - | - |
| `message` | text | NOT NULL | - | - |
| `link` | text | NULL | - | - |
| `is_read` | boolean | NOT NULL | `false` | - |
| `created_at` | timestamp with time zone | NOT NULL | `now()` | - |

---

## Table: `orders`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `business_name` | text | NULL | - | - |
| `package_id` | text | NULL | - | - |
| `package_name` | text | NULL | - | - |
| `amount` | double precision | NULL | - | - |
| `status` | order_status | NULL | - | Enum type |
| `payment_method` | text | NULL | - | - |
| `submitted_at` | timestamp with time zone | NULL | `now()` | - |
| `confirmed_at` | timestamp with time zone | NULL | - | - |
| `notes` | text | NULL | - | - |

---

## Table: `page_content`

**Primary Key:** `page_name` (text)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `page_name` | text | NOT NULL | - | Primary key |
| `content_data` | jsonb | NULL | - | - |

---

## Table: `profiles`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | - | Primary key, Foreign key to `auth.users.id` |
| `updated_at` | timestamp with time zone | NULL | - | - |
| `full_name` | text | NULL | - | - |
| `avatar_url` | text | NULL | - | - |
| `email` | text | NULL | - | - |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `favorites` | ARRAY (bigint) | NULL | - | - |

---

## Table: `registration_requests`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_name` | text | NOT NULL | - | - |
| `email` | text | NOT NULL | - | - |
| `phone` | text | NOT NULL | - | - |
| `category` | business_category | NULL | - | Enum type |
| `address` | text | NULL | - | - |
| `tier` | membership_tier | NULL | - | Enum type |
| `status` | text | NULL | - | CHECK constraint: 'Pending', 'Approved', 'Rejected' |
| `submitted_at` | timestamp with time zone | NULL | `now()` | - |

---

## Table: `reviews`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `user_id` | uuid | NULL | - | Foreign key to `auth.users.id` |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `user_name` | text | NOT NULL | - | - |
| `user_avatar_url` | text | NULL | - | - |
| `rating` | integer | NULL | - | CHECK constraint: rating >= 1 AND rating <= 5 |
| `comment` | text | NULL | - | - |
| `submitted_date` | timestamp with time zone | NULL | `now()` | - |
| `status` | review_status | NULL | `'Visible'::review_status` | Enum type |
| `reply` | jsonb | NULL | - | - |

---

## Table: `services`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `name` | text | NOT NULL | - | - |
| `price` | text | NOT NULL | - | - |
| `description` | text | NULL | - | - |
| `image_url` | text | NULL | - | - |
| `duration_minutes` | integer | NULL | - | - |
| `position` | integer | NULL | `0` | - |

---

## Table: `support_tickets`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `business_name` | text | NULL | - | - |
| `subject` | text | NOT NULL | - | - |
| `message` | text | NOT NULL | - | - |
| `status` | ticket_status | NULL | `'Open'::ticket_status` | Enum type |
| `created_at` | timestamp with time zone | NULL | `now()` | - |
| `last_reply_at` | timestamp with time zone | NULL | - | - |
| `replies` | jsonb | NULL | - | - |

---

## Table: `team_members`

**Primary Key:** `id` (uuid)

| Column | Data Type | Nullable | Default | Notes |
|--------|-----------|----------|---------|-------|
| `id` | uuid | NOT NULL | `uuid_generate_v4()` | Primary key |
| `business_id` | bigint | NULL | - | Foreign key to `businesses.id` |
| `name` | text | NOT NULL | - | - |
| `role` | text | NOT NULL | - | - |
| `image_url` | text | NULL | - | - |

---

## Notes

- All tables have RLS (Row Level Security) enabled
- Array types are denoted as `ARRAY (element_type)`
- Enum types are referenced by their type name (see `enums.md` for values)
- Foreign keys to `auth.users` table (Supabase Auth) are noted but `auth.users` is not part of the public schema
- Primary keys are explicitly listed for each table
- Default values are shown as they exist in the database
- NULL constraints are explicitly noted

---

**END OF SCHEMA DOCUMENTATION**
