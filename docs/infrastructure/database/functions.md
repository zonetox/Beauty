# Database Functions

**Last Updated:** 2025-01-11  
**Source:** Supabase Database (read via MCP `information_schema.routines`)  
**Total Functions:** 15  
**Note:** This document lists ALL functions that exist in the public schema. Functions are categorized by type.

---

## Function Categories

- **RPC Functions:** Can be called from client using `supabase.rpc()`
- **Helper Functions:** Internal utility functions (used by RLS policies or other functions)
- **Trigger Functions:** Functions that return `trigger` type (automatically executed)

---

## RPC Functions (Callable from Client)

### `get_business_count`

**Return Type:** `integer`

**Parameters:** (implied from function definition)
- `p_category` (business_category, nullable)
- `p_city` (text, nullable)
- `p_district` (text, nullable)

**Description:** Returns count of active businesses matching filters.

**Function Definition:**
```sql
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.businesses
    WHERE is_active = TRUE
      AND (p_category IS NULL OR p_category = ANY(categories))
      AND (p_city IS NULL OR city = p_city)
      AND (p_district IS NULL OR district = p_district);
    
    RETURN v_count;
END;
```

---

### `increment_blog_view_count`

**Return Type:** `void`

**Parameters:**
- `p_post_id` (bigint)

**Description:** Increments view_count for a blog post.

**Function Definition:**
```sql
BEGIN
    UPDATE public.blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_post_id;
END;
```

---

### `increment_business_blog_view_count`

**Return Type:** `void`

**Parameters:**
- `p_post_id` (uuid)

**Description:** Increments view_count for a business blog post.

**Function Definition:**
```sql
BEGIN
    UPDATE public.business_blog_posts
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_post_id;
END;
```

---

### `increment_business_view_count`

**Return Type:** `void`

**Parameters:**
- `p_business_id` (bigint)

**Description:** Increments view_count for a business.

**Function Definition:**
```sql
BEGIN
    UPDATE public.businesses
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = p_business_id;
END;
```

---

### `search_businesses`

**Return Type:** `record`

**Parameters:** (implied from function definition)
- `search_query` (text)
- Other parameters may exist (function returns query with multiple columns)

**Description:** Full-text search for businesses. Returns query result with columns: id, name, slug, rating, review_count, city, district, categories, rank.

**Function Definition:** (abbreviated - full definition contains SELECT query with ts_rank)

---

### `search_blog_posts`

**Return Type:** `record`

**Parameters:** (implied from function definition)
- `search_query` (text)

**Description:** Full-text search for blog posts. Returns query result with columns: id, slug, title, excerpt, category, date, rank.

**Function Definition:** (abbreviated - full definition contains SELECT query with ts_rank)

---

## Helper Functions (Internal Use)

### `extract_business_id_from_path`

**Return Type:** `bigint`

**Parameters:**
- `path` (text, implied)

**Description:** Extracts business ID from URL path using regex.

**Function Definition:**
```sql
BEGIN
    RETURN (
        SELECT (regexp_match(path, '^/business/(\d+)/'))[1]::BIGINT
    );
END;
```

---

### `extract_user_id_from_path`

**Return Type:** `uuid`

**Parameters:**
- `path` (text, implied)

**Description:** Extracts user ID from URL path using regex.

**Function Definition:**
```sql
BEGIN
    RETURN (
        SELECT (regexp_match(path, '^/user/([a-f0-9-]{36})/'))[1]::UUID
    );
END;
```

---

### `get_my_business_id`

**Return Type:** `bigint`

**Parameters:** None (uses `auth.uid()`)

**Description:** Returns business_id for current authenticated user's profile.

**Function Definition:**
```sql
SELECT business_id FROM public.profiles WHERE id = auth.uid();
```

---

### `get_user_email`

**Return Type:** `text`

**Parameters:** None (uses `auth.uid()`)

**Description:** Returns email for current authenticated user.

**Function Definition:**
```sql
DECLARE
    v_email TEXT;
BEGIN
    SELECT email INTO v_email
    FROM auth.users
    WHERE id = auth.uid();
    RETURN v_email;
END;
```

---

### `is_admin`

**Return Type:** `boolean`

**Parameters:** None (uses `auth.uid()` and `auth.users.email`)

**Description:** Checks if current user is an admin (email exists in admin_users table with is_locked = false).

**Function Definition:**
```sql
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND is_locked = FALSE
    ) INTO v_is_admin;
    RETURN COALESCE(v_is_admin, FALSE);
END;
```

**Used in:** RLS policies

---

### `is_business_owner`

**Return Type:** `boolean`

**Parameters:**
- `p_business_id` (bigint)

**Description:** Checks if current user is owner of a specific business.

**Function Definition:**
```sql
DECLARE
    v_is_owner BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE id = p_business_id
        AND owner_id = auth.uid()
    ) INTO v_is_owner;
    RETURN COALESCE(v_is_owner, FALSE);
END;
```

---

### `increment_view_count`

**Return Type:** `void`

**Parameters:**
- `p_business_id` (bigint)

**Description:** Increments view_count for a business (duplicate of `increment_business_view_count`).

**Function Definition:**
```sql
BEGIN
  UPDATE public.businesses
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_business_id;
END;
```

**Note:** This function appears to be a duplicate of `increment_business_view_count`.

---

## Trigger Functions (Automatically Executed)

### `handle_new_user`

**Return Type:** `trigger`

**Description:** Automatically creates a profile when a new user is created in auth.users.

**Function Definition:**
```sql
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
```

**Trigger:** Used by trigger on `auth.users` table (not in public schema)

---

### `update_business_ratings`

**Return Type:** `trigger`

**Description:** Automatically updates business rating and review_count when a review is inserted/updated.

**Function Definition:**
```sql
BEGIN
UPDATE public.businesses
SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE business_id = NEW.business_id
            AND status = 'Visible'
    ),
    review_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE business_id = NEW.business_id
            AND status = 'Visible'
    )
WHERE id = NEW.business_id;
RETURN NEW;
END;
```

**Trigger:** Should be attached to `reviews` table (not verified in pg_trigger query)

---

## Triggers

**Note:** Triggers are NOT present in the `public` schema according to `pg_trigger` query. The following triggers exist in other schemas:

- `on_auth_user_created` on `auth.users` → calls `handle_new_user`
- Other triggers exist in `storage` schema (not documented here)

**Triggers in public schema:** NOT PRESENT (no triggers found in public schema tables)

---

## Summary

**Total Functions:** 15

**By Type:**
- RPC Functions (callable from client): 6
  - `get_business_count`
  - `increment_blog_view_count`
  - `increment_business_blog_view_count`
  - `increment_business_view_count`
  - `search_businesses`
  - `search_blog_posts`
- Helper Functions (internal): 7
  - `extract_business_id_from_path`
  - `extract_user_id_from_path`
  - `get_my_business_id`
  - `get_user_email`
  - `is_admin`
  - `is_business_owner`
  - `increment_view_count`
- Trigger Functions: 2
  - `handle_new_user`
  - `update_business_ratings`

**Triggers in public schema:** NOT PRESENT (no triggers found on public schema tables)

---

**END OF FUNCTIONS DOCUMENTATION**
