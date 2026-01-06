# Database Schema Documentation

**Version:** 1.0  
**Last Updated:** 2025-01-05  
**Status:** LOCKED

---

## OVERVIEW

This directory contains the consolidated database schema for 1Beauty.asia platform.

### Schema Files

- **`schema_v1.0_FINAL.sql`** - **LOCKED** - Single source of truth schema
  - Complete database structure (17 tables, 12 enums, 17 indexes)
  - For fresh installs on new databases
  - DO NOT MODIFY - This schema is frozen

- **`migrations/20250105000000_align_to_schema_v1.0.sql`** - Migration script
  - Aligns existing database to schema_v1.0
  - Safe for existing databases (uses IF NOT EXISTS patterns)
  - Run once only

### Archive

- **`archive/`** - Contains all legacy SQL files (24 files)
  - Root-level SQL files (supabase_new_schema.sql, supabase_schema.sql)
  - Fix/Optimize/Seed/Setup SQL files
  - Legacy migrations (moved from supabase/migrations/)
  - **Note:** These files are archived for reference only. Do not use them directly.

---

## SCHEMA STRUCTURE

### Tables (17)

**Business Tables:**
- businesses (core table)
- services
- deals
- team_members
- media_items
- reviews

**Blog Tables:**
- blog_posts (platform blog)
- business_blog_posts (business blog)

**User & Auth Tables:**
- profiles (extends auth.users)
- admin_users

**Business Operations Tables:**
- registration_requests
- orders
- appointments
- support_tickets

**System Tables:**
- announcements
- app_settings
- page_content

### Enums (12)

- membership_tier
- business_category
- admin_user_role
- order_status
- media_type
- media_category
- business_blog_post_status
- review_status
- staff_member_role
- appointment_status
- deal_status
- ticket_status

### Indexes (17)

- Foreign key indexes (11)
- Commonly queried column indexes (6)

---

## NAMING CONVENTIONS (From A2.3 Review)

### Accepted Deviations

The schema follows most naming conventions but has some intentional deviations:

**Tables:** ✅ All snake_case, plural

**Columns:** 
- ✅ Foreign keys: `<table>_id` pattern
- ✅ Boolean: `is_` prefix
- ⚠️ Timestamp naming: Mixed patterns (created_at, joined_date, submitted_date, created_date, date)
  - **Design Decision:** Maintained for backward compatibility with existing codebase
  - Can be standardized in future migrations if needed

**Enums:**
- ✅ Names: snake_case
- ⚠️ Values: Mixed case (VIP, Premium, Admin, Pending, IMAGE, etc.)
  - **Design Decision:** Match TypeScript types.ts enum values for frontend consistency
  - Changing would require frontend code updates

**Indexes:** ✅ Format: `idx_<table>_<column>`

**Functions/Triggers:** ✅ Compliant naming

---

## ENUM DESIGN DECISION

Enum values use mixed case (VIP, Premium, Admin, etc.) instead of lowercase_snake_case to match TypeScript definitions in `types.ts`. This ensures consistency between database and frontend code.

**Examples:**
- `membership_tier`: 'VIP', 'Premium', 'Free'
- `admin_user_role`: 'Admin', 'Moderator', 'Editor'
- `order_status`: 'Pending', 'Awaiting Confirmation', 'Completed', 'Rejected'

---

## MIGRATION STRATEGY

### Fresh Install

Use `schema_v1.0_FINAL.sql`:
```sql
-- Run on new/empty database
\i database/schema_v1.0_FINAL.sql
```

### Existing Database

Use migration script:
```sql
-- Run on existing database (align structure)
\i database/migrations/20250105000000_align_to_schema_v1.0.sql
```

**Important:**
- Migration script uses `IF NOT EXISTS` patterns
- Safe to run on existing databases
- Run once only
- Does not drop existing data

### Future Migrations

All schema changes after v1.0 must:
- Create new migration files in `migrations/` directory
- Follow timestamp naming: `YYYYMMDDHHMMSS_description.sql`
- Document changes in migration file
- Update this README if schema structure changes

---

## FOREIGN KEYS & CASCADE RULES (From A2.4 Review)

### Cascade Rules Summary

**ON DELETE CASCADE:**
- services.business_id → businesses.id
- deals.business_id → businesses.id
- team_members.business_id → businesses.id
- media_items.business_id → businesses.id
- reviews.business_id → businesses.id
- business_blog_posts.business_id → businesses.id
- appointments.business_id → businesses.id
- support_tickets.business_id → businesses.id

**ON DELETE NO ACTION (default):**
- profiles.business_id → businesses.id (keeps profile if business deleted)
- orders.business_id → businesses.id (keeps order history)
- businesses.owner_id → auth.users.id
- reviews.user_id → auth.users.id
- profiles.id → auth.users.id
- appointments.service_id → services.id

**ON UPDATE:** All FKs use default (NO ACTION)

### Rationale

- Business-dependent data (services, deals, etc.) cascade delete when business is deleted
- Historical data (orders, profiles) are preserved for audit/analytics
- Auth references (auth.users) use NO ACTION to prevent accidental user deletion issues

---

## ROW LEVEL SECURITY (RLS)

RLS is **ENABLED** on all tables but **POLICIES ARE NOT DEFINED** in schema v1.0.

**RLS policies will be created in A3 - RLS & Security Audit.**

This separation ensures:
- Schema structure is locked first (A2)
- Security policies are defined separately (A3)
- Clear separation of concerns

---

## ARCHITECTURE COMPLIANCE

This schema complies with `ARCHITECTURE.md` principles:

- ✅ Supabase as single backend
- ✅ RLS-first security (enabled, policies in A3)
- ✅ Roles/permissions in database (admin_users table)
- ✅ Single source of truth (schema_v1.0_FINAL.sql)
- ✅ No hardcoded logic in schema

---

## NOTES

- Schema v1.0 is **LOCKED** - Do not modify without Project Owner approval
- All legacy SQL files are archived in `archive/` directory
- Migration script is deployment-supporting only (not for schema evolution)
- Future schema changes require new migrations
- RLS policies will be documented separately after A3 completion

---

**Schema Version:** 1.0  
**Locked Date:** 2025-01-05  
**Next Review:** After Phase A completion (A3 - RLS & Security)





