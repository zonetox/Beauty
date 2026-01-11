# Infrastructure Documentation

**Last Updated:** 2025-01-11  
**Version:** 1.0  
**Purpose:** Single source of truth for database schema, contracts, and development rules

---

## 📁 DOCUMENTATION STRUCTURE

This directory contains authoritative documentation about the database infrastructure, contracts, and development rules.

### `/database/` - Database Schema Documentation

- **`schema.md`** - All tables and columns (human-readable format)
- **`relations.md`** - ONLY real foreign keys (no assumed relations)
- **`enums.md`** - All enum types actually used in the database
- **`rls.md`** - RLS (Row Level Security) matrix per table
- **`functions.md`** - RPC functions & Edge DB logic
- **`limitations.md`** - What the database explicitly does NOT support

### `/contracts/` - Data Access Contracts

- **`frontend-db-contract.md`** - What frontend is allowed to read/write
- **`public-data.md`** - Publicly accessible data (no auth required)
- **`protected-data.md`** - Auth / owner / admin-only data

### `/audits/` - Audit Reports

- **`frontend-db-mismatch.md`** - Frontend code vs database schema mismatches
- **`rls-risk-report.md`** - Frontend features blocked by RLS policies

### `/` - Root Level

- **`development-rules.md`** - **REQUIRED READING** - Rules for adding new features
- **`DATABASE_DEVELOPMENT_WORKFLOW.md`** - **MANDATORY** - Quy trình phát triển database (bắt buộc tuân thủ)

---

## 🚨 CRITICAL RULES

### ❗ Before Writing Frontend Code

1. **READ `schema.md` FIRST** - Understand the database structure
2. **CHECK `relations.md`** - Verify which relations actually exist
3. **REVIEW `rls.md`** - Understand access control policies
4. **CONSULT `contracts/`** - Know what data you can access

### ❗ Before Adding New Features

1. **READ `DATABASE_DEVELOPMENT_WORKFLOW.md`** - **MANDATORY** - Quy trình bắt buộc
2. **READ `development-rules.md`** - Understand the workflow
3. **Design database changes FIRST** - Don't code frontend without DB design
4. **Create migration** - Update database schema
5. **Update docs IMMEDIATELY** - **BẮT BUỘC** - Document all schema changes ngay lập tức
6. **Verify docs match database** - Đảm bảo docs chính xác 100%
7. **Then code frontend** - Align with new schema
8. **No placeholders** - Code hoàn thiện, không có TODO/FIXME

### ❗ Database Schema is AUTHORITATIVE

- **Supabase database schema is the SINGLE SOURCE OF TRUTH**
- These docs reflect the ACTUAL database state
- If docs differ from database → database is correct, update docs
- Never assume tables, columns, or relations exist
- Always verify against actual database

---

## 📖 HOW TO USE THIS DOCUMENTATION

### For Frontend Developers

1. Start with `development-rules.md` - Learn the workflow
2. Read `schema.md` - Understand tables and columns
3. Check `contracts/frontend-db-contract.md` - Know access patterns
4. Review `rls.md` - Understand security policies
5. Check `audits/` - See known issues and fixes

### For Backend/Database Developers

1. Read `development-rules.md` - Understand change workflow
2. Update `schema.md` when schema changes
3. Update `relations.md` when FKs change
4. Update `rls.md` when policies change
5. Update `functions.md` when RPC functions change

### For Audits

1. Check `audits/frontend-db-mismatch.md` - Current mismatches
2. Review `audits/rls-risk-report.md` - RLS blocking issues
3. Use `schema.md` as reference for verification

---

## 🔄 DOCUMENTATION MAINTENANCE

### When to Update Docs

- ✅ Database schema changes (migrations)
- ✅ New tables or columns added
- ✅ Foreign keys added/removed
- ✅ RLS policies changed
- ✅ RPC functions added/removed
- ✅ Enum types added/changed

### Update Process (MANDATORY)

1. Run migration/change database
2. Verify change in Supabase Dashboard
3. **Update relevant doc file(s) IMMEDIATELY** - **BẮT BUỘC**
   - `schema.md` - Tables/columns
   - `relations.md` - Foreign keys
   - `enums.md` - Enum types
   - `rls.md` - RLS policies
   - `functions.md` - Functions/triggers
   - `limitations.md` - Limitations
4. **Verify docs match database** - 100% accuracy required
5. Update `README.md` if structure changes
6. Notify team if contract changes

**⚠️ LƯU Ý:** Không được viết code trước khi update docs. Docs phải được update ngay sau migration.

---

## 📝 DOCUMENTATION PRINCIPLES

1. **Facts Only** - Document what EXISTS, not what should exist
2. **No Assumptions** - Only document verified database state
3. **Single Source of Truth** - Database schema is authoritative
4. **Complete** - Document all tables, columns, relations, policies
5. **Clear** - Human-readable format, organized by table/feature

---

**END OF README**
