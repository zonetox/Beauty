# REFACTORING EXAMPLES - Using New Shared Utilities

**Date:** 2025-01-18  
**Purpose:** Examples of how to refactor existing code to use new shared utilities

---

## 1. REFACTOR CRUD OPERATIONS

### Example: ServicesManager.tsx

**Before:**
```typescript
const handleSaveService = async (serviceToSave: Service) => {
  if (!currentBusiness) return;

  try {
    if (serviceToSave.business_id) {
      await updateService(serviceToSave);
    } else {
      await addService({ ...serviceToSave, business_id: currentBusiness.id });
    }
    setIsModalOpen(false);
  } catch (error) {
    // Error already handled in context with toast
    // Don't close modal on error
  }
};

const confirmDeleteService = async () => {
  if (!confirmDelete.serviceId) return;
  
  try {
    await deleteService(confirmDelete.serviceId);
    // Success toast is handled in context
  } catch (error) {
    // Error already handled in context with toast
  } finally {
    setConfirmDelete({ isOpen: false, serviceId: null });
  }
};
```

**After (Using crudUtils):**
```typescript
import { createRecord, updateRecord, deleteRecord } from '@/lib/crudUtils';
import { supabase } from '@/lib/supabaseClient';

const handleSaveService = async (serviceToSave: Service): Promise<void> => {
  if (!currentBusiness) return;

  const serviceData = {
    ...serviceToSave,
    business_id: currentBusiness.id,
  };

  if (serviceToSave.id) {
    await updateRecord<Service>({
      tableName: 'services',
      supabase,
      id: serviceToSave.id,
      data: serviceData,
      successMessage: 'Service updated successfully',
      onSuccess: () => setIsModalOpen(false),
      onError: () => {
        // Modal stays open on error
      },
    });
  } else {
    await createRecord<Service>({
      tableName: 'services',
      supabase,
      data: serviceData as Omit<Service, 'id'>,
      successMessage: 'Service created successfully',
      onSuccess: () => setIsModalOpen(false),
      onError: () => {
        // Modal stays open on error
      },
    });
  }
};

const confirmDeleteService = async (): Promise<void> => {
  if (!confirmDelete.serviceId) return;
  
  await deleteRecord({
    tableName: 'services',
    supabase,
    id: confirmDelete.serviceId,
    successMessage: 'Service deleted successfully',
    onSuccess: () => {
      setConfirmDelete({ isOpen: false, serviceId: null });
    },
    onError: () => {
      // Error toast already shown by deleteRecord
    },
  });
};
```

**Benefits:**
- ✅ Consistent error handling
- ✅ Automatic toast notifications
- ✅ Type-safe operations
- ✅ Less boilerplate code

---

## 2. REFACTOR FORM VALIDATION

### Example: BlogManager.tsx

**Before:**
```typescript
const validateForm = (post: Partial<BusinessBlogPost>): boolean => {
  const errors: Record<string, string> = {};
  
  if (!post.title || post.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  
  if (post.title && post.title.length > 200) {
    errors.title = 'Title must be less than 200 characters';
  }
  
  if (!post.excerpt || post.excerpt.trim().length === 0) {
    errors.excerpt = 'Excerpt is required';
  }
  
  if (post.excerpt && post.excerpt.length > 500) {
    errors.excerpt = 'Excerpt must be less than 500 characters';
  }
  
  setErrors(errors);
  return Object.keys(errors).length === 0;
};
```

**After (Using validation.ts):**
```typescript
import { validators, validateObject } from '@/lib/validation';
import { VALIDATION } from '@/constants';

const validateForm = (post: Partial<BusinessBlogPost>): boolean => {
  const result = validateObject(post, {
    title: [
      validators.required,
      validators.title, // Pre-configured: required + maxLength(200)
    ],
    excerpt: [
      validators.required,
      validators.excerpt, // Pre-configured: required + maxLength(500)
    ],
    content: [
      validators.required,
    ],
  });
  
  setErrors(result.errors);
  return result.isValid;
};
```

**Benefits:**
- ✅ Reusable validators
- ✅ Consistent validation logic
- ✅ Less code duplication
- ✅ Easy to add new validators

---

## 3. REFACTOR ERROR HANDLING

### Example: Any async operation

**Before:**
```typescript
try {
  const result = await someAsyncOperation();
  // Handle success
} catch (error: any) {
  console.error('Error:', error);
  toast.error(error.message || 'An error occurred');
}
```

**After (Using errorHandler.ts):**
```typescript
import { withErrorHandling, getUserFriendlyMessage } from '@/lib/errorHandler';
import toast from 'react-hot-toast';

const result = await withErrorHandling(
  async () => await someAsyncOperation(),
  {
    retries: 2,
    retryDelay: 1000,
    onError: (error) => {
      toast.error(getUserFriendlyMessage(error));
    },
  }
);

if (result) {
  // Handle success
}
```

**Benefits:**
- ✅ Automatic retry logic
- ✅ User-friendly error messages
- ✅ Consistent error handling
- ✅ Type-safe error handling

---

## 4. REFACTOR CONFIRM DIALOGS

### Example: ServicesManager.tsx

**Before:**
```typescript
const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, serviceId: null });

// In JSX:
{confirmDelete.isOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg">
      <h3>Delete Service</h3>
      <p>Are you sure you want to delete this service?</p>
      <button onClick={confirmDeleteService}>Delete</button>
      <button onClick={() => setConfirmDelete({ isOpen: false, serviceId: null })}>Cancel</button>
    </div>
  </div>
)}
```

**After (Using ConfirmDialog component):**
```typescript
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, serviceId: null });

// In JSX:
<ConfirmDialog
  isOpen={confirmDelete.isOpen}
  title="Delete Service"
  message="Are you sure you want to delete this service? This action cannot be undone."
  variant="danger"
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={confirmDeleteService}
  onCancel={() => setConfirmDelete({ isOpen: false, serviceId: null })}
  isLoading={isDeleting}
/>
```

**Benefits:**
- ✅ Consistent UI
- ✅ Less code duplication
- ✅ Built-in loading states
- ✅ Type-safe props

---

## 5. REFACTOR CONSTANTS

### Example: Any component

**Before:**
```typescript
const timeout = 10000;
const cacheKey = 'blog_posts';
toast.success('Saved successfully');
if (value.length < 8) {
  errors.password = 'Password must be at least 8 characters';
}
```

**After (Using constants):**
```typescript
import { API_TIMEOUTS, CACHE_KEYS, TOAST_MESSAGES, VALIDATION } from '@/constants';

const timeout = API_TIMEOUTS.BLOG;
const cacheKey = CACHE_KEYS.BLOG_POSTS;
toast.success(TOAST_MESSAGES.SUCCESS.SAVED);
if (value.length < VALIDATION.MIN_PASSWORD_LENGTH) {
  errors.password = `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`;
}
```

**Benefits:**
- ✅ No magic strings/numbers
- ✅ Centralized configuration
- ✅ Easy to update
- ✅ Type-safe constants

---

## 6. COMPLETE REFACTORING EXAMPLE

### ServicesManager.tsx - Full Refactoring

**Before:**
```typescript
const ServicesManager: React.FC = () => {
  const { currentBusiness, services, addService, updateService, deleteService } = useBusinessData();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, serviceId: null });

  const handleSaveService = async (serviceToSave: Service) => {
    if (!currentBusiness) return;
    try {
      if (serviceToSave.business_id) {
        await updateService(serviceToSave);
      } else {
        await addService({ ...serviceToSave, business_id: currentBusiness.id });
      }
      setIsModalOpen(false);
    } catch (error) {
      // Error handled in context
    }
  };

  const confirmDeleteService = async () => {
    if (!confirmDelete.serviceId) return;
    try {
      await deleteService(confirmDelete.serviceId);
    } catch (error) {
      // Error handled in context
    } finally {
      setConfirmDelete({ isOpen: false, serviceId: null });
    }
  };

  // ... rest of component
};
```

**After:**
```typescript
import { createRecord, updateRecord, deleteRecord } from '@/lib/crudUtils';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { TOAST_MESSAGES } from '@/constants';
import { supabase } from '@/lib/supabaseClient';

const ServicesManager: React.FC = () => {
  const { currentBusiness, services, refetchAllPublicData } = useBusinessData();
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, serviceId: null });
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Saves a service (create or update)
   * @param serviceToSave - Service data to save
   */
  const handleSaveService = async (serviceToSave: Service): Promise<void> => {
    if (!currentBusiness) return;

    const serviceData = {
      ...serviceToSave,
      business_id: currentBusiness.id,
    };

    if (serviceToSave.id) {
      await updateRecord<Service>({
        tableName: 'services',
        supabase,
        id: serviceToSave.id,
        data: serviceData,
        successMessage: TOAST_MESSAGES.SUCCESS.UPDATED,
        onSuccess: async () => {
          setIsModalOpen(false);
          await refetchAllPublicData();
        },
      });
    } else {
      await createRecord<Service>({
        tableName: 'services',
        supabase,
        data: serviceData as Omit<Service, 'id'>,
        successMessage: TOAST_MESSAGES.SUCCESS.CREATED,
        onSuccess: async () => {
          setIsModalOpen(false);
          await refetchAllPublicData();
        },
      });
    }
  };

  /**
   * Confirms and executes service deletion
   */
  const confirmDeleteService = async (): Promise<void> => {
    if (!confirmDelete.serviceId) return;
    
    setIsDeleting(true);
    const success = await deleteRecord({
      tableName: 'services',
      supabase,
      id: confirmDelete.serviceId,
      successMessage: TOAST_MESSAGES.SUCCESS.DELETED,
      onSuccess: async () => {
        setConfirmDelete({ isOpen: false, serviceId: null });
        await refetchAllPublicData();
      },
    });
    
    setIsDeleting(false);
    if (!success) {
      // Error already shown by deleteRecord
      setConfirmDelete({ isOpen: false, serviceId: null });
    }
  };

  return (
    <div>
      {/* ... service list */}
      
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        variant="danger"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteService}
        onCancel={() => setConfirmDelete({ isOpen: false, serviceId: null })}
        isLoading={isDeleting}
      />
    </div>
  );
};
```

**Benefits:**
- ✅ Less code (~30% reduction)
- ✅ Consistent error handling
- ✅ Type-safe operations
- ✅ Reusable components
- ✅ Better maintainability

---

## 📋 MIGRATION CHECKLIST

When refactoring a component:

- [ ] Replace CRUD operations with `crudUtils`
- [ ] Replace form validation with `validation.ts`
- [ ] Replace error handling with `errorHandler.ts`
- [ ] Replace confirm dialogs with `ConfirmDialog` component
- [ ] Replace magic strings/numbers with constants
- [ ] Add return types to all functions
- [ ] Add JSDoc comments to public functions
- [ ] Test the refactored component

---

## 🎯 PRIORITY ORDER

1. **High Impact:**
   - ServicesManager
   - DealsManager
   - MediaManager
   - TeamManager

2. **Medium Impact:**
   - BlogManager
   - AdminPage components
   - Form components

3. **Low Impact:**
   - Utility components
   - Display components

---

**Start with one component, test thoroughly, then apply pattern to others!**
