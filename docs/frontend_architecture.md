# Frontend Architecture - 1Beauty.asia

**Version:** 1.0  
**Date:** 2025-01-05  
**Status:** READY

---

## OVERVIEW

Tài liệu này định nghĩa kiến trúc frontend của ứng dụng 1Beauty.asia. Frontend tuân thủ nghiêm ngặt các nguyên tắc trong `ARCHITECTURE.md`: không hardcode roles/permissions, không bypass RLS, và luôn đọc data từ database (Single Source of Truth).

**Nguyên tắc:**
- ✅ Frontend là client thuần (không có server-side logic)
- ✅ Không hardcode roles/permissions
- ✅ Không cache permissions nguy hiểm
- ✅ Data access pattern rõ ràng (client Supabase vs Edge Functions)
- ✅ Error handling và guards đầy đủ

---

## C1.1 - FRONTEND STRUCTURE

### Current Folder Structure

```
Beauty-main/
├── pages/                    # Page components (route-level)
│   ├── HomePage.tsx
│   ├── DirectoryPage.tsx
│   ├── AdminPage.tsx
│   ├── UserBusinessDashboardPage.tsx
│   └── ...
├── components/               # Reusable UI components
│   ├── admin/               # Admin-specific components
│   ├── business-landing/    # Business landing page components
│   ├── page-renderer/       # Page content renderers
│   ├── ProtectedRoute.tsx   # Auth guard component
│   ├── AdminProtectedRoute.tsx  # Admin guard component
│   └── ...
├── contexts/                 # React Context providers (state management)
│   ├── UserSessionContext.tsx      # User auth & profile
│   ├── AdminContext.tsx            # Admin auth & permissions
│   ├── BusinessDataContext.tsx     # Public business data
│   ├── AdminPlatformContext.tsx    # Admin platform data
│   └── ... (25+ contexts)
├── lib/                     # Utility libraries
│   ├── supabaseClient.ts    # Supabase client initialization
│   ├── utils.ts             # Helper functions
│   ├── image.ts             # Image utilities
│   └── storage.ts           # Storage utilities
├── types.ts                 # TypeScript type definitions
├── constants.ts             # Application constants
├── App.tsx                  # Main app component (routes, providers)
└── index.tsx                # Entry point
```

### Structure Analysis

#### ✅ Strengths

1. **Clear Separation:**
   - `pages/` - Route-level components
   - `components/` - Reusable UI components
   - `contexts/` - State management
   - `lib/` - Utilities

2. **Feature-Based Organization:**
   - `components/admin/` - Admin features
   - `components/business-landing/` - Business landing page
   - `components/page-renderer/` - Page content renderers

3. **Type Safety:**
   - `types.ts` - Centralized type definitions
   - TypeScript throughout

#### ⚠️ Issues Found

1. **Context Proliferation:**
   - **25+ contexts** - Too many contexts can cause performance issues
   - Some contexts may overlap in responsibility
   - Recommendation: Consolidate related contexts

2. **Business Logic in Components:**
   - Some components contain business logic (data fetching, state management)
   - Recommendation: Move business logic to contexts or custom hooks

3. **Mixed Concerns:**
   - Some components mix UI rendering with data fetching
   - Recommendation: Separate presentation from data fetching

### Recommended Folder Structure

```
Beauty-main/
├── pages/                    # Page components (route-level)
│   └── [page-name].tsx
├── components/               # Reusable UI components
│   ├── ui/                  # Basic UI components (buttons, inputs, etc.)
│   ├── features/            # Feature-specific components
│   │   ├── admin/           # Admin features
│   │   ├── business/        # Business features
│   │   └── public/         # Public features
│   └── guards/              # Route guards
│       ├── ProtectedRoute.tsx
│       └── AdminProtectedRoute.tsx
├── contexts/                 # React Context providers
│   ├── auth/                # Authentication contexts
│   │   ├── UserSessionContext.tsx
│   │   └── AdminContext.tsx
│   ├── data/                # Data contexts
│   │   ├── BusinessDataContext.tsx
│   │   └── AdminPlatformContext.tsx
│   └── ui/                  # UI contexts
│       └── ThemeContext.tsx
├── hooks/                    # Custom React hooks (NEW)
│   ├── useAuth.ts           # Auth hooks
│   ├── usePermissions.ts   # Permission hooks
│   └── useBusiness.ts      # Business data hooks
├── lib/                     # Utility libraries
│   ├── supabaseClient.ts
│   ├── utils.ts
│   └── ...
├── types.ts                 # TypeScript type definitions
├── constants.ts             # Application constants
└── App.tsx                  # Main app component
```

### Separation of Concerns

#### ✅ Current Implementation

**Pages (Route-Level):**
- Handle routing
- Compose components
- Minimal business logic

**Components:**
- Presentational components (UI rendering)
- Some components fetch data directly (should be moved to contexts/hooks)

**Contexts:**
- State management
- Data fetching
- Business logic

#### ⚠️ Recommendations

1. **Extract Custom Hooks:**
   ```typescript
   // hooks/usePermissions.ts
   export const usePermissions = () => {
     const { currentUser } = useAdminAuth();
     const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
     
     useEffect(() => {
       if (currentUser) {
         setPermissions(currentUser.permissions);
       }
     }, [currentUser]);
     
     return permissions;
   };
   ```

2. **Move Business Logic to Hooks:**
   - Data fetching logic → Custom hooks
   - Permission checks → Custom hooks
   - Business rules → Custom hooks

3. **Keep Components Pure:**
   - Components should only render UI
   - Data fetching via hooks/contexts
   - Business logic via hooks/contexts

---

## C1.2 - AUTH & PERMISSION CONSUMPTION

### Current Implementation

#### User Authentication

**Context:** `UserSessionContext.tsx`

**Flow:**
```typescript
1. User logs in
   └─> supabase.auth.signInWithPassword({ email, password })
   
2. Auth state change detected
   └─> onAuthStateChange listener
   
3. Fetch profile from database
   └─> supabase.from('profiles').select('*').eq('id', user.id)
   
4. Profile stored in context state
   └─> setProfile(profile)
```

**Role Resolution:**
```typescript
// UserSessionContext.tsx
// Role is determined by:
// 1. Has auth.uid()? → Authenticated
// 2. Profile exists? → User
// 3. Profile.businessId exists? → Business Owner (potential)
// 4. Check businesses.owner_id = auth.uid()? → Business Owner (confirmed)
```

**✅ Compliant:**
- No hardcode roles
- Role determined from database
- Profile fetched from `profiles` table

---

#### Admin Authentication

**Context:** `AdminContext.tsx`

**Flow:**
```typescript
1. Admin logs in
   └─> supabase.auth.signInWithPassword({ email, password })
   
2. Fetch admin_users from database
   └─> supabase.from('admin_users').select('*')
   
3. Match admin user by email
   └─> allAdmins.find(au => au.email === user.email)
   
4. Check is_locked
   └─> if (!adminProfile.isLocked) → Set currentUser
   
5. Permissions stored in context
   └─> currentUser.permissions (from admin_users.permissions JSONB)
```

**Permission Access:**
```typescript
// AdminContext.tsx
const { currentUser } = useAdminAuth();
const permissions = currentUser?.permissions;

// Check permission
if (permissions?.canManageBusinesses) {
  // Show business management UI
}
```

**✅ Compliant:**
- No hardcode permissions
- Permissions read from `admin_users.permissions` JSONB
- Permissions stored in context (not cached dangerously)

**⚠️ Issue:**
- Permissions are stored in context state (in-memory)
- If permissions change in database, context needs refresh
- **Recommendation:** Re-fetch permissions on auth state change

---

### Permission Check Patterns

#### ✅ CORRECT Pattern (Current Implementation)

**Pattern 1: Context-Based Permission Check**
```typescript
// components/AdminPage.tsx
const { currentUser } = useAdminAuth();

if (currentUser?.permissions?.canManageBusinesses) {
  return <BusinessManagementPanel />;
}
```

**Pattern 2: Direct Database Query (When Context Not Available)**
```typescript
// In a component without AdminContext
const checkPermission = async (email: string, permission: keyof AdminPermissions) => {
  const { data } = await supabase
    .from('admin_users')
    .select('permissions')
    .eq('email', email)
    .single();
  
  return data?.permissions?.[permission] ?? false;
};
```

**Pattern 3: Permission Guard Component**
```typescript
// components/PermissionGuard.tsx (RECOMMENDED - Not yet implemented)
interface PermissionGuardProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { currentUser } = useAdminAuth();
  
  if (!currentUser?.permissions?.[permission]) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Usage:
<PermissionGuard permission="canManageBusinesses">
  <BusinessManagementPanel />
</PermissionGuard>
```

#### ❌ WRONG Patterns (Avoid)

**Pattern 1: Hardcode Role Check**
```typescript
// DON'T DO THIS
if (user.email === 'admin@example.com') {
  showAdminPanel();
}
```

**Pattern 2: Hardcode Permission Check**
```typescript
// DON'T DO THIS
if (user.id === '123') {
  showBusinessPanel();
}
```

**Pattern 3: Cache Permissions in localStorage**
```typescript
// DON'T DO THIS
const cachedPermissions = localStorage.getItem('permissions');
if (cachedPermissions?.canManageBusinesses) {
  showPanel();
}
// Issue: Permissions can change in database, cache becomes stale
```

---

### Permission Caching Strategy

#### Current Implementation

**Context State (In-Memory):**
- Permissions stored in `AdminContext` state
- Updated on auth state change
- **Lifetime:** Session duration

**✅ Safe:**
- Not persisted to localStorage
- Refreshed on auth state change
- No stale cache risk

**⚠️ Improvement Needed:**
- Re-fetch permissions when admin user is updated
- Add permission refresh mechanism

#### Recommended Caching Strategy

**1. Context State (Current - Keep):**
```typescript
// AdminContext.tsx
const [currentUser, setCurrentUser] = useState<AuthenticatedAdmin | null>(null);
// permissions = currentUser.permissions (from database)
```

**2. Re-fetch on Update:**
```typescript
// When admin user is updated, refresh permissions
const updateAdminUser = async (userId: number, updates: Partial<AdminUser>) => {
  // ... update logic ...
  
  // Refresh current user if it's the updated user
  if (currentUser?.id === userId) {
    await fetchAdminUsers(); // Re-fetch all admins
    // Context will update currentUser automatically
  }
};
```

**3. No localStorage Caching:**
- ❌ Don't cache permissions in localStorage
- ❌ Don't cache roles in localStorage
- ✅ Always read from database when needed

---

## C1.3 - DATA ACCESS PATTERN

### Data Access Methods

#### 1. Supabase Client (Direct Database Access)

**When to Use:**
- ✅ Read public data (no authentication required)
- ✅ Read/Write user's own data (RLS enforced)
- ✅ Read/Write business owner's own data (RLS enforced)
- ✅ Admin read/write (RLS enforced)

**Example:**
```typescript
// Read public businesses
const { data: businesses } = await supabase
  .from('businesses')
  .select('*')
  .eq('is_active', true);

// Read user's own profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', currentUser.id)
  .single();

// Update business (business owner only, RLS enforced)
const { error } = await supabase
  .from('businesses')
  .update({ name: newName })
  .eq('id', businessId);
```

**RLS Enforcement:**
- RLS policies enforce security at database level
- Frontend cannot bypass RLS
- If RLS blocks, Supabase returns error

---

#### 2. Edge Functions (Elevated Privileges)

**When to Use:**
- ✅ Operations requiring elevated privileges (service role)
- ✅ Business registration approval (create business + user)
- ✅ Admin user creation (create auth user + admin_users row)
- ✅ Email sending (external API)

**Example:**
```typescript
// Approve business registration
const { data, error } = await supabase.functions.invoke('approve-registration', {
  body: { requestId: registrationRequest.id }
});

// Create admin user
const { error } = await supabase.functions.invoke('create-admin-user', {
  body: {
    email: 'admin@example.com',
    password: 'password',
    username: 'admin',
    role: 'Admin',
    permissions: PERMISSION_PRESETS[AdminUserRole.ADMIN]
  }
});

// Send email
const { error } = await supabase.functions.invoke('send-templated-email', {
  body: {
    to: 'user@example.com',
    templateName: 'invite',
    templateData: { name: 'User', action_url: '...' }
  }
});
```

**Edge Functions Used:**
1. `approve-registration` - Business registration approval
2. `create-admin-user` - Admin user creation
3. `send-templated-email` - Email sending
4. `send-email` - Generic email sending (legacy?)

**Compliance:**
- ✅ Edge Functions only used when elevated privileges needed
- ✅ No lạm dụng service role
- ✅ All operations documented

---

#### 3. Public Data (No Authentication)

**When to Use:**
- ✅ Read active businesses (public listing)
- ✅ Read published blog posts
- ✅ Read announcements
- ✅ Read app settings (public config)
- ✅ Read page content (public pages)

**Example:**
```typescript
// Public data - no auth required
const { data: businesses } = await supabase
  .from('businesses')
  .select('*')
  .eq('is_active', true);

const { data: blogPosts } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('status', 'Published');
```

**RLS Policies:**
- Public read policies allow anonymous access
- Example: `businesses_select_public_active_or_owner_or_admin`
- Anonymous users can read active businesses

---

### Data Access Decision Tree

```
Need to perform operation?
│
├─> Is authentication required?
│   │
│   ├─> NO → Use Supabase Client (public data)
│   │   └─> RLS: Public read policies
│   │
│   └─> YES → Is it user's own data?
│       │
│       ├─> YES → Use Supabase Client
│       │   └─> RLS: Own data policies (profiles_select_own_or_admin)
│       │
│       └─> NO → Is it business owner's own data?
│           │
│           ├─> YES → Use Supabase Client
│           │   └─> RLS: Owner policies (businesses_update_owner_or_admin)
│           │
│           └─> NO → Is it admin operation?
│               │
│               ├─> YES → Is elevated privilege needed?
│               │   │
│               │   ├─> YES → Use Edge Function
│               │   │   └─> Service role (bypasses RLS)
│               │   │
│               │   └─> NO → Use Supabase Client
│               │       └─> RLS: Admin policies (businesses_update_admin)
│               │
│               └─> NO → ❌ Operation not allowed
│                   └─> RLS will block
```

---

### Current Implementation Analysis

#### ✅ Correct Usage

**Public Data:**
```typescript
// BusinessDataContext.tsx
const { data: businesses } = await supabase
  .from('businesses')
  .select('*')
  .eq('is_active', true);
```

**User's Own Data:**
```typescript
// UserSessionContext.tsx
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();
```

**Edge Functions:**
```typescript
// AdminPlatformContext.tsx
const { data, error } = await supabase.functions.invoke('approve-registration', {
  body: { requestId }
});
```

#### ⚠️ Issues Found

**1. Mixed Data Fetching:**
- Some components fetch data directly
- Some contexts fetch data
- **Recommendation:** Centralize data fetching in contexts/hooks

**2. No Error Handling Pattern:**
- Inconsistent error handling
- **Recommendation:** Standardize error handling

**3. No Loading State Pattern:**
- Inconsistent loading states
- **Recommendation:** Standardize loading states

---

## C1.4 - ERROR HANDLING & GUARD

### Route Guards

#### 1. ProtectedRoute (User Authentication Guard)

**Location:** `components/ProtectedRoute.tsx`

**Implementation:**
```typescript
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useUserSession();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**Usage:**
```typescript
// App.tsx
<Route path="account" element={
  <ProtectedRoute>
    <AccountPageRouter />
  </ProtectedRoute>
} />
```

**✅ Compliant:**
- Checks authentication via context
- Redirects to login if not authenticated
- Preserves intended destination

**⚠️ Improvements Needed:**
- Better loading state UI
- Error state handling
- Permission-based routing (future)

---

#### 2. AdminProtectedRoute (Admin Authentication Guard)

**Location:** `components/AdminProtectedRoute.tsx`

**Implementation:**
```typescript
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return <div>Checking admin authentication...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

**Usage:**
```typescript
// App.tsx
<Route path="/admin" element={
  <AdminProtectedRoute>
    <AdminPage />
  </AdminProtectedRoute>
} />
```

**✅ Compliant:**
- Checks admin authentication via context
- Redirects to admin login if not authenticated
- Preserves intended destination

**⚠️ Improvements Needed:**
- Better loading state UI
- Permission-based routing (check `canAccessAdminPanel` permission)
- Role-based routing (admin vs moderator vs editor)

---

### Permission Guards (Not Yet Implemented)

#### Recommended: PermissionGuard Component

**Implementation:**
```typescript
// components/PermissionGuard.tsx (RECOMMENDED)
interface PermissionGuardProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { currentUser } = useAdminAuth();
  
  if (!currentUser?.permissions?.[permission]) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Usage:
<PermissionGuard 
  permission="canManageBusinesses"
  fallback={<div>You don't have permission to access this.</div>}
>
  <BusinessManagementPanel />
</PermissionGuard>
```

**Benefits:**
- Reusable permission checks
- Consistent UI for forbidden access
- Type-safe permission names

---

### Error Handling Patterns

#### Current Implementation

**1. Try-Catch in Contexts:**
```typescript
// AdminContext.tsx
try {
  const { data, error } = await supabase.from('admin_users').select('*');
  if (error) {
    console.error('Error:', error);
    toast.error('Failed to fetch admin users');
  }
} catch (err) {
  console.error('Unexpected error:', err);
  toast.error('An unexpected error occurred');
}
```

**2. Error Handling in Components:**
```typescript
// Some components handle errors inline
const handleSubmit = async () => {
  try {
    await submitData();
  } catch (error) {
    toast.error(error.message);
  }
};
```

**3. Error Boundaries (Not Yet Implemented):**
- ❌ No React Error Boundaries
- **Recommendation:** Add Error Boundary component

---

#### Recommended Error Handling Pattern

**1. Standardized Error Handling Hook:**
```typescript
// hooks/useErrorHandler.ts (RECOMMENDED)
export const useErrorHandler = () => {
  const handleError = (error: any, context?: string) => {
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly error message
    toast.error(error.message || 'An error occurred');
    
    // Log to error tracking service (future)
    // logErrorToService(error, context);
  };
  
  return { handleError };
};

// Usage:
const { handleError } = useErrorHandler();

try {
  await submitData();
} catch (error) {
  handleError(error, 'submitData');
}
```

**2. Error Boundary Component:**
```typescript
// components/ErrorBoundary.tsx (RECOMMENDED)
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage in App.tsx:
<ErrorBoundary>
  <Routes>
    {/* ... */}
  </Routes>
</ErrorBoundary>
```

**3. API Error Handling:**
```typescript
// lib/apiErrorHandler.ts (RECOMMENDED)
export const handleSupabaseError = (error: any, context?: string) => {
  if (error.code === 'PGRST116') {
    // Not found
    return { message: 'Resource not found', type: 'not_found' };
  }
  
  if (error.code === '23505') {
    // Unique constraint violation
    return { message: 'This record already exists', type: 'duplicate' };
  }
  
  if (error.code === '42501') {
    // Insufficient privilege (RLS blocked)
    return { message: 'You do not have permission to perform this action', type: 'forbidden' };
  }
  
  return { message: error.message || 'An error occurred', type: 'unknown' };
};
```

---

### Loading States

#### Current Implementation

**1. Context Loading States:**
```typescript
// UserSessionContext.tsx
const [loading, setLoading] = useState(true);

// AdminContext.tsx
const [loading, setLoading] = useState(true);
```

**2. Component Loading States:**
```typescript
// Some components have loading states
if (loading) {
  return <div>Loading...</div>;
}
```

**3. Suspense for Lazy Loading:**
```typescript
// App.tsx
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    {/* ... */}
  </Routes>
</Suspense>
```

#### ⚠️ Issues Found

**1. Inconsistent Loading UI:**
- Some use `<div>Loading...</div>`
- Some use `<LoadingSpinner />`
- **Recommendation:** Standardize loading component

**2. No Skeleton Loaders:**
- Tables load with blank screen
- **Recommendation:** Add skeleton loaders

**3. No Loading State Management:**
- Each component manages its own loading state
- **Recommendation:** Centralize loading state management

---

#### Recommended Loading State Pattern

**1. Standardized Loading Component:**
```typescript
// components/LoadingSpinner.tsx
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-lg font-semibold">{message}</p>
    </div>
  </div>
);
```

**2. Skeleton Loaders:**
```typescript
// components/SkeletonLoader.tsx
export const TableSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    {/* ... */}
  </div>
);
```

**3. Loading State Hook:**
```typescript
// hooks/useLoading.ts (RECOMMENDED)
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);
  
  const withLoading = async <T,>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, setLoading, withLoading };
};

// Usage:
const { loading, withLoading } = useLoading();

const handleSubmit = async () => {
  await withLoading(async () => {
    await submitData();
  });
};
```

---

### Empty States

#### Current Implementation

**Some components handle empty states:**
```typescript
// Example from some components
if (businesses.length === 0) {
  return <div>No businesses found</div>;
}
```

#### ⚠️ Issues Found

**1. Inconsistent Empty State UI:**
- Some components show "No data"
- Some show nothing
- **Recommendation:** Standardize empty state component

**2. No Empty State for Different Scenarios:**
- No data vs. error vs. loading
- **Recommendation:** Create empty state variants

---

#### Recommended Empty State Pattern

**1. Standardized Empty State Component:**
```typescript
// components/EmptyState.tsx (RECOMMENDED)
interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  message, 
  icon, 
  action 
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 mb-4">{message}</p>
    {action && <div>{action}</div>}
  </div>
);

// Usage:
if (businesses.length === 0) {
  return (
    <EmptyState
      title="No businesses found"
      message="There are no businesses available at the moment."
      action={<button>Add Business</button>}
    />
  );
}
```

---

### Forbidden States

#### Current Implementation

**Permission checks in components:**
```typescript
// Some components check permissions inline
if (!currentUser?.permissions?.canManageBusinesses) {
  return <div>You don't have permission</div>;
}
```

#### ⚠️ Issues Found

**1. Inconsistent Forbidden UI:**
- Some show error message
- Some show nothing
- **Recommendation:** Standardize forbidden state component

---

#### Recommended Forbidden State Pattern

**1. Standardized Forbidden Component:**
```typescript
// components/ForbiddenState.tsx (RECOMMENDED)
export const ForbiddenState: React.FC<{ message?: string }> = ({ 
  message = "You don't have permission to access this resource." 
}) => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="text-6xl mb-4">🔒</div>
    <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
    <p className="text-gray-500">{message}</p>
  </div>
);

// Usage with PermissionGuard:
<PermissionGuard 
  permission="canManageBusinesses"
  fallback={<ForbiddenState message="You need permission to manage businesses." />}
>
  <BusinessManagementPanel />
</PermissionGuard>
```

---

## COMPLIANCE WITH ARCHITECTURE.MD

### ✅ No Hardcode Roles/Permissions

**Current Implementation:**
- ✅ Roles determined from database queries
- ✅ Permissions read from `admin_users.permissions` JSONB
- ✅ No hardcode role checks in components

**Compliance:** ✅ **COMPLIANT**

---

### ✅ Single Source of Truth

**Current Implementation:**
- ✅ Authentication: `auth.users` (Supabase Auth)
- ✅ Roles: `admin_users` table, `businesses.owner_id`
- ✅ Permissions: `admin_users.permissions` JSONB
- ✅ Profile: `profiles` table

**Compliance:** ✅ **COMPLIANT**

---

### ✅ RLS-First Security

**Current Implementation:**
- ✅ Frontend uses Supabase client (RLS enforced)
- ✅ Edge Functions only for elevated privileges
- ✅ No bypass RLS attempts

**Compliance:** ✅ **COMPLIANT**

---

### ✅ Frontend as Pure Client

**Current Implementation:**
- ✅ No server-side logic
- ✅ All data from Supabase
- ✅ Business logic in contexts/hooks

**Compliance:** ✅ **COMPLIANT**

---

## RECOMMENDATIONS

### Immediate Improvements

1. **Add PermissionGuard Component:**
   - Reusable permission checks
   - Consistent forbidden UI

2. **Add ErrorBoundary:**
   - Catch React errors
   - Better error recovery

3. **Standardize Loading States:**
   - Consistent loading UI
   - Skeleton loaders

4. **Standardize Empty/Forbidden States:**
   - Consistent empty state UI
   - Consistent forbidden state UI

### Future Improvements

1. **Consolidate Contexts:**
   - Reduce context proliferation
   - Merge related contexts

2. **Extract Custom Hooks:**
   - Move business logic to hooks
   - Reusable data fetching hooks

3. **Add Error Tracking:**
   - Log errors to service
   - Monitor error rates

4. **Add Performance Monitoring:**
   - Track component render times
   - Optimize slow components

---

## NOTES

- Frontend architecture complies with `ARCHITECTURE.md` principles
- No hardcode roles/permissions found
- Data access patterns are correct (client Supabase vs Edge Functions)
- Error handling and guards are present but can be improved
- Loading/empty/forbidden states need standardization

---

**Frontend Architecture Version:** 1.0  
**Status:** READY  
**Next:** C2 - Public Site (User-Facing)






