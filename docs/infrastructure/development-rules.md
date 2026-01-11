# Development Rules (BẮT BUỘC)

**Last Updated:** 2025-01-11  
**Version:** 1.0  
**Status:** MANDATORY - Must be followed for all development work

---

## 🚨 CRITICAL RULES - READ BEFORE CODING

> **⚠️ QUAN TRỌNG:** Xem chi tiết quy trình trong `DATABASE_DEVELOPMENT_WORKFLOW.md`

### ❗ Rule 0: MANDATORY - Đọc Database Docs TRƯỚC KHI Code

**BẮT BUỘC:** Khi phát triển tính năng mới cần database:

1. **Đọc Database Docs TRƯỚC:**
   - ✅ `/docs/infrastructure/database/schema.md`
   - ✅ `/docs/infrastructure/database/relations.md`
   - ✅ `/docs/infrastructure/database/rls.md`
   - ✅ `/docs/infrastructure/database/functions.md`
   - ✅ `/docs/infrastructure/database/limitations.md`

2. **Nếu cần thêm database:**
   - ✅ Tạo migration SQL
   - ✅ Apply migration trong Supabase
   - ✅ **CẬP NHẬT DATABASE DOCS NGAY LẬP TỨC** (BẮT BUỘC)
   - ✅ Verify docs khớp với database thực tế
   - ✅ Sau đó mới viết code

3. **Khi viết code:**
   - ✅ Sử dụng đúng tên columns từ `schema.md`
   - ✅ Tuân thủ RLS policies từ `rls.md`
   - ✅ Không có placeholder code
   - ✅ Code hoàn thiện, không có TODO/FIXME

**Xem chi tiết:** `/docs/infrastructure/DATABASE_DEVELOPMENT_WORKFLOW.md`

---

### ❗ Rule 1: NEVER Write Frontend Without Reading Schema

**MANDATORY:** Before writing ANY frontend code that interacts with the database:

1. **READ `database/schema.md` FIRST** - Understand all tables and columns
2. **VERIFY columns exist** - Check actual database schema, don't assume
3. **CHECK data types** - Ensure frontend types match database types
4. **REVIEW `database/relations.md`** - Only use relations that actually exist

**❌ DO NOT:**
- Assume tables or columns exist
- Guess column names or types
- Use relations that aren't documented in `relations.md`
- Write code based on old docs or naming conventions

**✅ DO:**
- Read schema documentation first
- Verify against actual database (Supabase Dashboard)
- Use only documented tables, columns, and relations
- Update docs if you find discrepancies (database is source of truth)

---

### ❗ Rule 2: Never Assume Tables / Columns Exist

**MANDATORY:** Database schema is the SINGLE SOURCE OF TRUTH.

**❌ DO NOT:**
- Assume a table exists based on frontend code
- Assume a column exists based on TypeScript interfaces
- Assume a relation exists based on naming conventions
- Use columns not listed in `schema.md`

**✅ DO:**
- Verify table exists in `schema.md` or Supabase Dashboard
- Verify column exists in `schema.md` or Supabase Dashboard
- Verify relation exists in `relations.md` or via foreign keys
- If it's not documented, it DOES NOT exist (until verified)

**Example:**
- ❌ **WRONG:** Assume `orders.total_amount` exists because TypeScript has it
- ✅ **RIGHT:** Check `schema.md` → See `orders.amount` exists (not `total_amount`)

---

### ❗ Rule 3: Feature Workflow (STRICT ORDER)

**MANDATORY:** For ANY new feature or database change:

#### Step 1: Database Design FIRST
1. Design database schema changes
2. Plan new tables, columns, relations
3. Design RLS policies if needed
4. Design RPC functions if needed

#### Step 2: Migration
1. Create migration SQL file
2. Test migration on development database
3. Verify schema changes in Supabase Dashboard

#### Step 3: Update Documentation
1. Update `database/schema.md` - Add new tables/columns
2. Update `database/relations.md` - Add new foreign keys
3. Update `database/enums.md` - Add new enum types if any
4. Update `database/rls.md` - Add new RLS policies
5. Update `database/functions.md` - Add new RPC functions
6. Update `contracts/` - Update data access contracts

#### Step 4: Code Frontend
1. Align TypeScript interfaces with new schema
2. Update queries to use new columns/tables
3. Test against actual database
4. Verify RLS policies work correctly

**❌ DO NOT:**
- Code frontend before database design
- Skip documentation updates
- Assume migration will work without testing
- Code frontend before migration is complete

---

### ❗ Rule 4: Database Changes MUST Update Docs First

**MANDATORY:** All database changes (migrations, schema updates) MUST update documentation BEFORE frontend code.

**Workflow:**
1. ✅ Run migration / make database change
2. ✅ Verify change in Supabase Dashboard
3. ✅ **Update relevant doc files** (`schema.md`, `relations.md`, etc.)
4. ✅ Verify docs match database (database is source of truth)
5. ✅ Then update frontend code

**❌ DO NOT:**
- Update frontend code before docs
- Leave docs outdated after migration
- Skip documentation updates
- Assume docs will be updated later

---

## 📋 DEVELOPMENT WORKFLOW

### Adding a New Feature

```
1. Design Database Schema
   ↓
2. Create Migration
   ↓
3. Run Migration on Dev DB
   ↓
4. Update Documentation (schema.md, relations.md, etc.)
   ↓
5. Code Frontend (aligned with new schema)
   ↓
6. Test Frontend (against actual database)
   ↓
7. Verify RLS Policies
   ↓
8. Deploy
```

### Fixing Frontend Code

```
1. Read schema.md (understand current schema)
   ↓
2. Identify mismatch (frontend vs database)
   ↓
3. Fix frontend code (align with database)
   ↓
4. Test fix (against actual database)
   ↓
5. Update audit reports if needed
```

### Updating Database Schema

```
1. Design changes
   ↓
2. Create migration
   ↓
3. Test migration (dev database)
   ↓
4. Run migration (production - if approved)
   ↓
5. Update ALL relevant docs (schema.md, relations.md, rls.md, etc.)
   ↓
6. Update frontend code (align with new schema)
   ↓
7. Test everything
```

---

## 🔍 VERIFICATION CHECKLIST

Before writing frontend code that uses a database table:

- [ ] Read `database/schema.md` - Table exists and is documented?
- [ ] Check columns needed - All columns exist in schema.md?
- [ ] Verify data types - Frontend types match database types?
- [ ] Check `database/relations.md` - Relations actually exist?
- [ ] Review `database/rls.md` - Understand access control?
- [ ] Check `contracts/frontend-db-contract.md` - Can frontend access this data?
- [ ] Review `audits/frontend-db-mismatch.md` - Known issues to avoid?

---

## ⚠️ COMMON MISTAKES TO AVOID

### ❌ Mistake 1: Assuming Columns Exist

**Example:**
```typescript
// ❌ WRONG: Assuming total_amount exists
.select('id, total_amount, status')

// ✅ RIGHT: Check schema.md → Use amount
.select('id, amount, status')
```

### ❌ Mistake 2: Assuming Relations Exist

**Example:**
```typescript
// ❌ WRONG: Assuming blog_tags table exists
.from('blog_posts')
.select('*, blog_tags(*)')

// ✅ RIGHT: Use blog_posts.category (text column)
.from('blog_posts')
.select('id, title, category')
```

### ❌ Mistake 3: Using Non-Existent Columns

**Example:**
```typescript
// ❌ WRONG: Using customer_name in orders table
.select('id, customer_name, customer_email')

// ✅ RIGHT: customer_name doesn't exist in orders
// Use appointments table if customer data needed
.select('id, business_id, amount')
```

### ❌ Mistake 4: Coding Before Database Design

**Example:**
```typescript
// ❌ WRONG: Code frontend first, then realize schema doesn't match
const newFeature = { new_field: value }; // Assumes new_field exists

// ✅ RIGHT: Design database first, update docs, then code
// After migration and docs update:
const newFeature = { new_field: value }; // Now verified in schema.md
```

---

## 📚 DOCUMENTATION REQUIREMENTS

### When Adding New Tables

1. Update `database/schema.md` - Document all columns
2. Update `database/relations.md` - Document foreign keys
3. Update `database/rls.md` - Document RLS policies
4. Update `contracts/` - Update data access contracts

### When Adding New Columns

1. Update `database/schema.md` - Add column documentation
2. Update `database/rls.md` - If RLS policies affected
3. Update `contracts/` - If access patterns change

### When Adding New Enums

1. Update `database/enums.md` - Document enum values
2. Update `database/schema.md` - Update column types if needed

### When Adding New RPC Functions

1. Update `database/functions.md` - Document function signature
2. Update `contracts/frontend-db-contract.md` - Document usage

---

## 🎯 SUCCESS CRITERIA

Code is considered correct when:

- ✅ All table references exist in `schema.md`
- ✅ All column references exist in `schema.md`
- ✅ All relations are documented in `relations.md`
- ✅ All RLS policies are understood (from `rls.md`)
- ✅ Frontend code matches database schema
- ✅ No runtime SQL errors
- ✅ RLS policies allow access (no blocked queries)

---

## 🚫 HARD CONSTRAINTS

### ❌ NEVER Do These:

- ❌ Change database without migration
- ❌ Update frontend without updating docs first
- ❌ Assume tables/columns/relations exist
- ❌ Skip documentation updates
- ❌ Code frontend before database design
- ❌ Use undocumented tables/columns/relations
- ❌ Ignore RLS policies
- ❌ Skip verification against actual database

---

## 📝 NOTES

- **Database schema is AUTHORITATIVE** - Always verify against Supabase Dashboard
- **Documentation must reflect reality** - If docs differ from database, database is correct
- **When in doubt, verify** - Check Supabase Dashboard, don't guess
- **Update docs with every change** - Don't leave documentation outdated
- **Follow the workflow** - Database → Docs → Frontend (in that order)

---

**END OF DEVELOPMENT RULES**

**Remember: Database schema is the SINGLE SOURCE OF TRUTH. When in doubt, verify against actual database, not assumptions or old code.**
