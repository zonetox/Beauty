# Foreign Key Relations

**Last Updated:** 2025-01-12  
**Source:** Supabase Database (read via MCP)  
**Note:** This document lists ONLY foreign key constraints that actually exist in the database. No assumed relations.

---

## Tables WITH Foreign Keys

### `appointments`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `appointments_business_id_fkey` |
| `service_id` | `services.id` | `appointments_service_id_fkey` |

---

### `blog_comments`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `post_id` | `blog_posts.id` | `blog_comments_post_id_fkey` |

---

### `business_blog_posts`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `business_blog_posts_business_id_fkey` |

---

### `businesses`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `owner_id` | `auth.users.id` | `businesses_owner_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `deals`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `deals_business_id_fkey` |

---

### `media_items`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `media_items_business_id_fkey` |

---

### `notifications`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `auth.users.id` | `notifications_user_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `orders`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `orders_business_id_fkey` |

---

### `profiles`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `id` | `auth.users.id` | `profiles_id_fkey` |
| `business_id` | `businesses.id` | `profiles_business_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `reviews`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `auth.users.id` | `reviews_user_id_fkey` |
| `business_id` | `businesses.id` | `reviews_business_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `services`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `services_business_id_fkey` |

---

### `support_tickets`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `support_tickets_business_id_fkey` |

---

### `team_members`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `team_members_business_id_fkey` |

---

### `business_staff`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `business_staff_business_id_fkey` |
| `user_id` | `auth.users.id` | `business_staff_user_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `abuse_reports`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `review_id` | `reviews.id` | `abuse_reports_review_id_fkey` |
| `reporter_id` | `auth.users.id` | `abuse_reports_reporter_id_fkey` |
| `reviewed_by` | `auth.users.id` | `abuse_reports_reviewed_by_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `page_views`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `user_id` | `auth.users.id` | `page_views_user_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

### `conversions`

| Column | References | Constraint Name |
|--------|------------|-----------------|
| `business_id` | `businesses.id` | `conversions_business_id_fkey` |
| `user_id` | `auth.users.id` | `conversions_user_id_fkey` |

**Note:** `auth.users` is in the `auth` schema, not `public` schema.

---

## Tables WITH NO Foreign Keys

The following tables have NO foreign key constraints:

- `admin_activity_logs` - No foreign keys
- `admin_users` - No foreign keys
- `announcements` - No foreign keys
- `app_settings` - No foreign keys
- `blog_categories` - No foreign keys
- `blog_posts` - No foreign keys (except reverse: `blog_comments.post_id` references it)
- `email_notifications_log` - No foreign keys
- `membership_packages` - No foreign keys
- `page_content` - No foreign keys
- `registration_requests` - No foreign keys

---

## Notes

- Foreign keys to `auth.users` are documented but `auth.users` is not in the `public` schema
- All foreign keys listed here are verified to exist in the database
- If a table is not listed here, it has NO foreign key constraints
- No assumed or inferred relations are documented - only actual FK constraints

---

**END OF RELATIONS DOCUMENTATION**
