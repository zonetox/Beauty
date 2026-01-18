# 1Beauty.asia - AI Coding Agent Instructions

**Version:** 1.0  
**Last Updated:** 2025-01-17  
**Status:** Active

---

## 🏗️ ARCHITECTURE FOUNDATIONS

### Backend = Supabase Only
This is a **pure frontend application**. Supabase is the ONLY backend:
- **Database:** PostgreSQL with Row-Level Security (RLS)
- **Authentication:** Supabase Auth (email/password)
- **Storage:** Supabase Storage for media files
- **Edge Functions:** Deno functions for elevated-privilege operations (email sending, admin creation)

**Critical:** No custom backend server, no ORM beyond Supabase, no direct database connections from frontend.

### Data Security: RLS-First
- **All table access is enforced via RLS policies** at database level
- **Never bypass RLS** using service role keys on the frontend
- Frontend uses anonymous keys; Edge Functions use service role keys only
- Every user action must pass RLS checks before data is returned

### Single Source of Truth
- **Roles/Permissions:** Stored in `admin_users.permissions` (JSONB); never hardcoded in frontend logic
- **User Identity:** Managed by Supabase Auth (`auth.users` table)
- **Business Data:** Lives in `businesses`, `services`, `deals`, etc. tables
- Frontend fetches and renders data from DB; it doesn't infer or assume permissions

---

## 📁 PROJECT STRUCTURE

```
Beauty-main/
├── pages/              # Top-level route pages (React Router v7)
├── components/         # UI & feature components organized by domain
│   ├── admin/         # Admin dashboard components
│   ├── business-landing/  # Business landing page builder
│   └── page-renderer/ # Dynamic page content rendering
├── contexts/          # React Context providers for state management
├── hooks/             # Custom React hooks
├── lib/               # Utility functions & constants
├── database/          # Schema & migrations (PostgreSQL)
│   ├── schema_v1.0_FINAL.sql  # LOCKED - source of truth
│   └── migrations/    # Migration scripts
├── tests/             # Jest unit & integration tests
├── specs/             # Playwright E2E test specs
└── supabase/          # Supabase config & Edge Functions
```

**Key Pattern:** Context API manages state; contexts fetch from Supabase and expose hooks (e.g., `useAdminAuth()`, `useBusinessData()`).

---

## 🔐 CRITICAL SECURITY RULES

### Rule 1: No Hardcoded Roles
❌ **FORBIDDEN:**
```typescript
// WRONG: Hardcoding admin checks
if (user.email === 'admin@example.com') { showAdminPanel(); }
if (user.id === 'specific-uuid') { grantPermission(); }
```

✅ **CORRECT:**
```typescript
// Fetch roles from database
const adminUsers = await supabase.from('admin_users')
  .select('id, email, role, permissions')
  .eq('id', user.id);
if (adminUsers.data?.[0]?.permissions?.canApproveRegistration) { ... }
```

### Rule 2: RLS Policies Enforce Access
- RLS policies are the security boundary, not frontend logic
- If a user shouldn't see data, RLS blocks it before it reaches the client
- Frontend guards (`ProtectedRoute`, `AdminProtectedRoute`, `PermissionGuard`) are UI conveniences, not security

### Rule 3: Use Supabase Client Correctly
```typescript
// Always import from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, anonKey); // Anonymous key for frontend

// Fetch data with proper error handling
const { data, error } = await supabase
  .from('table_name')
  .select('column1, column2')
  .eq('condition', value);
```

---

## 🧩 COMPONENT PATTERNS

### Context Setup Pattern
Each domain (Admin, Business, Blog, etc.) has a Context provider:
```typescript
// contexts/AdminContext.tsx
export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState(...);
  
  const fetchData = async () => {
    const { data, error } = await supabase.from('admin_users')...;
    setState(data);
  };
  
  useEffect(() => { fetchData(); }, []);
  
  return <AdminContext.Provider value={{ state, fetchData }}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => useContext(AdminContext) || throwError();
```

### Protected Route Pattern
```typescript
// components/ProtectedRoute.tsx - Checks user authentication
// components/AdminProtectedRoute.tsx - Checks admin role + permissions
// components/PermissionGuard.tsx - Checks specific permissions

export const PermissionGuard: React.FC<{ permission: string; children: ReactNode }> = 
  ({ permission, children }) => {
    const { permissions } = useAdminAuth();
    return permissions[permission] ? children : <ForbiddenState />;
  };
```

### Component Organization
- **Large features** → Folder with index.tsx (e.g., `admin/`, `business-landing/`, `page-renderer/`)
- **Utility components** → Standalone .tsx files
- **Tests** → Colocated in `__tests__/` folder in same directory

---

## 🔄 DEVELOPMENT WORKFLOW

### Local Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start Vite dev server (localhost:3000)
npm run env:sync              # Sync environment variables from Vercel
```

### Testing
```bash
npm run test                   # Jest unit tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
npm run test:e2e              # Playwright E2E tests
npm run test:e2e:ui           # E2E tests with UI
npm test:all                  # Type check + lint + jest
```

### Building & Deployment
```bash
npm run type-check            # Verify TypeScript
npm run lint                  # ESLint check
npm run lint:fix              # Auto-fix lint issues
npm run build                 # Production build (Vite)
npm run preview               # Preview production build
```

**Deployment:** Vercel (connected to GitHub). Commits to main trigger automated builds.

---

## 📊 DATA FLOW EXAMPLE

### Fetching Businesses (Common Pattern)
```
1. Page mounts (e.g., HomePage)
2. useBusinessData() hook called
3. Hook triggers useEffect with Supabase query
4. Query: supabase.from('businesses').select('*')
   → RLS policy checks: user has permission?
   → If yes: returns visible businesses
   → If no: returns empty or filtered results
5. Data stored in BusinessContext state
6. Component reads from context & renders
```

### Admin Action (Elevated Privilege)
```
1. Admin clicks "Approve Registration"
2. Frontend calls Edge Function: /supabase/functions/approve-registration/
3. Edge Function uses SERVICE_ROLE_KEY (elevated privileges)
4. Creates user in auth.users + business record
5. RLS ensures user can only see their own business
6. Frontend re-fetches data to reflect change
```

---

## 🗄️ DATABASE ESSENTIALS

### 17 Core Tables
**Business Domain:**
- `businesses` - Core business profile
- `services`, `deals` - Offerings
- `media_items`, `reviews` - Content
- `team_members` - Staff

**User Domain:**
- `profiles` - User profile (extends auth.users)
- `admin_users` - Admin with role + permissions JSONB
- `registration_requests` - Business signup queue

**Operations:**
- `orders`, `appointments`, `support_tickets` - Transactions
- `blog_posts`, `business_blog_posts` - Content
- `announcements`, `app_settings`, `page_content` - Configuration

**Key:** All tables have RLS enabled. Check `database/schema_v1.0_FINAL.sql` for policies.

### Common Queries Pattern
```typescript
// Fetch with RLS (frontend - anonymous key)
const { data: business } = await supabase
  .from('businesses')
  .select('*, services(*), media_items(*)')
  .eq('id', businessId)
  .single();

// Elevated operation (Edge Function - service role key)
await supabase.from('admin_users').update({ permissions: {...} }).eq('id', adminId);
```

---

## ⚙️ CONFIGURATION & ENVIRONMENT

### TypeScript Path Alias
```typescript
// tsconfig.json: "@/*" → "." (workspace root)
import { AuthContext } from '@/contexts/AuthContext.tsx';  // Resolves from root
```

### Environment Variables
Load from `.env.local` (git-ignored):
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
VITE_SENTRY_DSN=...
```

Sync with Vercel: `npm run env:sync`

### Build & Code Splitting
- **Vite** for build (fast, ESM)
- **Rollup** for code splitting (separate chunks for react, @supabase, others)
- **Sentry** for error tracking (production only)
- **ESLint + TypeScript** for code quality

---

## 🚀 FEATURE IMPLEMENTATION CHECKLIST

When building a new feature:

- [ ] **Database First:** Add table/columns to schema if needed
- [ ] **RLS Policies:** Define who can read/write in `schema.sql`
- [ ] **Type Safety:** Add TypeScript types in `types.ts`
- [ ] **Context/Hook:** Create context provider if new domain; add hook for consumption
- [ ] **Components:** Build UI consuming the hook
- [ ] **Error Handling:** Catch Supabase errors; show user feedback
- [ ] **Tests:** Unit tests for hooks/logic; E2E for user flows
- [ ] **Lint & Type Check:** `npm run lint && npm run type-check`
- [ ] **No Hardcoded Roles:** All permissions fetched from DB

---

## 🐛 DEBUGGING TIPS

### Supabase Queries Not Returning Data?
1. Check RLS policies: `supabase → Databases → SQL Editor → Inspect policies`
2. Verify user authentication: `useAdminAuth().user` should exist
3. Check query syntax: Use Supabase Studio to test queries directly

### Type Errors?
- Run `npm run type-check` for full report
- Check `types.ts` for missing or incorrect type definitions
- Verify context return types match consumer expectations

### Tests Failing?
- Jest for unit tests (components, hooks)
- Playwright for E2E (user interactions, workflows)
- Mock Supabase in unit tests; use test database for E2E

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| [../ARCHITECTURE.md](../ARCHITECTURE.md) | Immutable architecture philosophy |
| [../database/schema_v1.0_FINAL.sql](../database/schema_v1.0_FINAL.sql) | Database source of truth |
| [../types.ts](../types.ts) | Global TypeScript types & enums |
| [../contexts/](../contexts/) | State management providers |
| [../components/ProtectedRoute.tsx](../components/ProtectedRoute.tsx) | Auth guard example |
| [../jest.config.cjs](../jest.config.cjs) | Jest configuration |
| [../playwright.config.ts](../playwright.config.ts) | E2E test setup |

---

## ❓ WHEN IN DOUBT

1. **Architecture question?** → Read [../ARCHITECTURE.md](../ARCHITECTURE.md)
2. **Database question?** → Check [../database/schema_v1.0_FINAL.sql](../database/schema_v1.0_FINAL.sql)
3. **Type question?** → Look at [../types.ts](../types.ts)
4. **Component pattern?** → Find similar component in `components/` or `pages/`
5. **RLS issue?** → Inspect policies in Supabase Studio; verify auth context

---

**Remember:** Supabase enforces security, not frontend code. Trust RLS; don't hardcode permissions.
