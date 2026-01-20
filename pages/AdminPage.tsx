import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { MembershipTier, Business, AdminUser, BlogPost, MembershipPackage, BusinessCategory, OrderStatus, BlogCategory, AdminPageTab } from '../types.ts';
import { useBusinessData, useBlogData, useMembershipPackageData } from '../contexts/BusinessDataContext.tsx';
import { useAdminAuth } from '../contexts/AdminContext.tsx';
import { useOrderData } from '../contexts/BusinessBlogDataContext.tsx';
import { useAdminPlatform } from '../contexts/AdminPlatformContext.tsx';
import ConfirmDialog from '../components/ConfirmDialog.tsx';

// Reusable Components
import BusinessManagementTable from '../components/BusinessManagementTable.tsx';
import EditBusinessModal from '../components/EditBusinessModal.tsx';
import UserManagementTable from '../components/UserManagementTable.tsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx';
import RegistrationRequestsTable from '../components/RegistrationRequestsTable.tsx';
import BlogManagementTable from '../components/BlogManagementTable.tsx';
import EditBlogPostModal from '../components/EditBlogPostModal.tsx';
import HomepageEditor from '../components/HomepageEditor.tsx';
import EditAdminUserModal from '../components/EditAdminUserModal.tsx';
import PackageManagementTable from '../components/PackageManagementTable.tsx';
import EditPackageModal from '../components/EditPackageModal.tsx';
import OrderManagementTable from '../components/OrderManagementTable.tsx';
import PageContentEditor from '../components/PageContentEditor.tsx';
import BusinessBulkImporter from '../components/admin/BusinessBulkImporter.tsx';
import ApiHealthTool from '../components/ApiHealthTool.tsx';
import AdminDashboardOverview from '../components/AdminDashboardOverview.tsx';
import AdminAnalyticsDashboard from '../components/AdminAnalyticsDashboard.tsx';
import AdminGlobalSearch from '../components/AdminGlobalSearch.tsx';
import AdminNotifications from '../components/AdminNotifications.tsx';
import PermissionGuard from '../components/PermissionGuard.tsx';
import AdminActivityLog from '../components/AdminActivityLog.tsx';
import AdminNotificationLog from '../components/AdminNotificationLog.tsx';
import AdminAnnouncementsManager from '../components/AdminAnnouncementsManager.tsx';
import AdminSupportTickets from '../components/AdminSupportTickets.tsx';
import ThemeEditor from '../components/ThemeEditor.tsx';
import AdminAbuseReports from '../components/AdminAbuseReports.tsx';
import SystemSettings from '../components/SystemSettings.tsx';
import AdminLandingPageModeration from '../components/AdminLandingPageModeration.tsx';

const AIBlogIdeaGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateIdeas = async () => {
    if (!topic) {
      setError('Please enter a topic.');
      return;
    }
    setLoading(true);
    setError('');
    setIdeas([]);
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate 5 engaging blog post titles about "${topic}" for a beauty directory platform in Vietnamese. The titles should be SEO-friendly and appealing to readers interested in spas, salons, and beauty tips. Format the output as a numbered list.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        setError('No response from AI. Please try again.');
        return;
      }
      const generatedIdeas = text.split('\n').filter(line => line.match(/^\d+\./)).map(line => line.replace(/^\d+\.\s*/, ''));
      setIdeas(generatedIdeas);
    } catch (e) {
      setError('Failed to generate ideas. Please check your API key and try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border mt-6">
      <h3 className="text-md font-semibold mb-3 text-neutral-dark">AI Blog Idea Generator</h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic, e.g., 'skincare'"
          className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
        />
        <button
          onClick={generateIdeas}
          disabled={loading}
          className="bg-secondary text-white px-4 py-2 rounded-md font-semibold hover:bg-opacity-80 disabled:bg-gray-400 transition-colors text-sm"
        >
          {loading ? '...' : 'Generate'}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {ideas.length > 0 && (
        <ul className="mt-4 list-disc list-inside space-y-2 text-gray-600 text-sm">
          {ideas.map((idea, index) => <li key={index}>{idea}</li>)}
        </ul>
      )}
    </div>
  );
};

const AccessDenied: React.FC<{ requiredRole: string }> = ({ requiredRole }) => (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
    <p className="text-sm text-yellow-700">Access Denied. You do not have <strong>{requiredRole}</strong> permissions to view this section.</p>
  </div>
);

type ConfirmDialogType = 
  | 'deleteCategory' 
  | 'deletePost' 
  | 'duplicateBusiness' 
  | 'rejectRequest' 
  | 'deleteUser' 
  | 'deletePackage' 
  | null;

interface ConfirmDialogData {
  id?: string | number;
  name?: string;
  requestId?: string;
  userId?: number;
  packageId?: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  type: ConfirmDialogType;
  data?: ConfirmDialogData;
}

interface BlogCategoryManagerProps {
  setConfirmDialog: (dialog: ConfirmDialogState) => void;
  onCategoryDeleted?: () => void;
}

const BlogCategoryManager: React.FC<BlogCategoryManagerProps> = ({ setConfirmDialog }) => {
  const { blogCategories, addBlogCategory, updateBlogCategory } = useBlogData();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);

  const handleAdd = async () => { await addBlogCategory(newCategoryName); setNewCategoryName(''); };
  const handleUpdate = async () => { if (editingCategory) { await updateBlogCategory(editingCategory.id, editingCategory.name); setEditingCategory(null); } };
  const handleDelete = async (id: string) => { 
    setConfirmDialog({ isOpen: true, type: 'deleteCategory', data: { id } });
  };

  return (
    <div className="mt-6">
      <h3 className="text-md font-semibold mb-3 text-neutral-dark">Manage Blog Categories</h3>
      <div className="flex gap-2 mb-4">
        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-grow w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
        <button onClick={handleAdd} className="bg-secondary text-white px-4 py-2 rounded-md font-semibold text-sm">+ Add</button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {blogCategories.map(cat => (
          <div key={cat.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            {editingCategory?.id === cat.id ? (
              <input type="text" value={editingCategory.name} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="flex-grow px-2 py-1 border border-primary rounded-md text-sm" autoFocus />
            ) : (<p className="text-sm flex-grow">{cat.name}</p>)}
            {editingCategory?.id === cat.id ? (
              <button onClick={handleUpdate} className="text-green-600 font-semibold text-sm">Save</button>
            ) : (<button onClick={() => setEditingCategory(cat)} className="text-blue-600 font-semibold text-sm">Edit</button>)}
            <button onClick={() => handleDelete(cat.id)} className="text-red-600 font-semibold text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const NEW_BUSINESS_TEMPLATE: Business = { id: 0, slug: '', name: 'New Business Name', categories: [BusinessCategory.SPA], membershipTier: MembershipTier.FREE, address: '', phone: '', email: '', imageUrl: `https://picsum.photos/seed/new-business/400/300`, city: 'TP. Hồ Chí Minh', district: '', ward: '', tags: [], rating: 0, reviewCount: 0, viewCount: 0, isActive: true, isVerified: false, joinedDate: new Date().toISOString(), description: 'Please provide a detailed description.', services: [], gallery: [], team: [], reviews: [], workingHours: { 'Thứ 2 - Thứ 6': '9:00 - 20:00' }, socials: {}, staff: [], notificationSettings: { reviewAlerts: true, bookingRequests: false, platformNews: true } };

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { businesses, loading: businessesLoading, updateBusiness, addBusiness, deleteBusiness } = useBusinessData();
  const { adminUsers, addAdminUser, updateAdminUser, deleteAdminUser, currentUser, adminLogout, loading: authLoading } = useAdminAuth();

  const { blogPosts, loading: blogLoading, addBlogPost, updateBlogPost, deleteBlogPost, deleteBlogCategory } = useBlogData();
  const { packages, addPackage, updatePackage, deletePackage } = useMembershipPackageData();
  const { orders, loading: ordersLoading, updateOrderStatus } = useOrderData();
  const { addNotification, registrationRequests, approveRegistrationRequest, rejectRegistrationRequest } = useAdminPlatform();

  const [activeTab, setActiveTab] = useState<AdminPageTab>('dashboard');
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    type: null,
    data: undefined,
  });

  const filteredBusinesses = useMemo(() => { const q = searchQuery.toLowerCase().trim(); if (!q) return businesses; return businesses.filter(b => b.name.toLowerCase().includes(q)); }, [businesses, searchQuery]);
  const filteredOrders = useMemo(() => { if (orderStatusFilter === 'all') return orders; return orders.filter(o => o.status === orderStatusFilter); }, [orders, orderStatusFilter]);

  const handleSaveBusiness = async (businessToSave: Business) => { if (businessToSave.id === 0) { const slug = businessToSave.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`; await addBusiness({ ...businessToSave, slug }); } else { await updateBusiness(businessToSave); } setEditingBusiness(null); };
  const handleSavePost = async (postToSave: BlogPost) => { 
    if (postToSave.id === 0) { 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, slug, date, viewCount, ...newPostData } = postToSave; 
      await addBlogPost(newPostData); 
    } else { 
      await updateBlogPost(postToSave); 
    } 
    setEditingPost(null); 
  };
  const handleDeletePost = async (postId: number) => { 
    setConfirmDialog({ isOpen: true, type: 'deletePost', data: { id: postId } });
  };

  const confirmDeletePost = async () => {
    if (confirmDialog.type === 'deletePost' && confirmDialog.data?.id) {
      await deleteBlogPost(confirmDialog.data.id as number);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

  // handleDeleteCategory removed - not used in current implementation

  /**
   * Confirms and executes category deletion
   * Shows success/error toast notifications
   * @returns Promise that resolves when deletion completes
   */
  const confirmDeleteCategory = async (): Promise<void> => {
    if (confirmDialog.type !== 'deleteCategory' || !confirmDialog.data?.id) {
      setConfirmDialog({ isOpen: false, type: null });
      return;
    }

    try {
      await deleteBlogCategory(confirmDialog.data.id as string);
      toast.success('Blog category deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete blog category');
    } finally {
      setConfirmDialog({ isOpen: false, type: null });
    }
  };

  const handleDuplicateBusiness = async (businessToDuplicate: Business) => {
    setConfirmDialog({ isOpen: true, type: 'duplicateBusiness', data: { name: businessToDuplicate.name } });
  };

  const confirmDuplicateBusiness = async () => {
    if (confirmDialog.type !== 'duplicateBusiness' || !confirmDialog.data?.name) {
      setConfirmDialog({ isOpen: false, type: null });
      return;
    }
    
    const businessName = confirmDialog.data.name;
    const businessToDuplicate = businesses.find(b => b.name === businessName);
    if (!businessToDuplicate) {
      setConfirmDialog({ isOpen: false, type: null });
      return;
    }

    setConfirmDialog({ isOpen: false, type: null });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, slug, name, ...rest } = businessToDuplicate;
    const newName = `${name} (Copy)`;
    const newSlug = newName.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`;
    const duplicatedBusiness: Business = {
      ...rest,
      id: 0, // Signal that this is a new business
      name: newName,
      slug: newSlug,
      joinedDate: new Date().toISOString(),
    };
    const promise = addBusiness(duplicatedBusiness);
    toast.promise(promise, {
      loading: 'Duplicating business...',
      success: `Successfully duplicated "${name}".`,
      error: 'Failed to duplicate business.',
    });
  };

  const handleApproveRequest = (requestId: string) => {
    const request = registrationRequests.find(r => r.id === requestId);
    if (!request) {
      toast.error('Registration request not found.');
      return;
    }

    const approvalPromise = approveRegistrationRequest(requestId);

    toast.promise(approvalPromise, {
      loading: `Approving ${request.businessName}...`,
      success: `Approved registration for ${request.businessName}. An invitation email has been sent.`,
      error: (err) => `Error approving registration: ${err.message}`,
    });
  };

  const handleRejectRequest = (requestId: string) => {
    const request = registrationRequests.find(r => r.id === requestId);
    if (!request) {
      toast.error('Registration request not found.');
      return;
    }
    setConfirmDialog({ isOpen: true, type: 'rejectRequest', data: { requestId } });
  };

  const confirmRejectRequest = () => {
    if (confirmDialog.type !== 'rejectRequest' || !confirmDialog.data?.requestId) {
      setConfirmDialog({ isOpen: false, type: null });
      return;
    }

    const requestId = confirmDialog.data.requestId;
    const request = registrationRequests.find(r => r.id === requestId);
    if (!request) {
      toast.error('Registration request not found.');
      setConfirmDialog({ isOpen: false, type: null });
      return;
    }

    setConfirmDialog({ isOpen: false, type: null });
    const rejectionPromise = rejectRegistrationRequest(requestId).then(() => {
      addNotification(request.email, 'Your Registration Update', `We regret to inform you that your registration for ${request.businessName} has been rejected at this time.`);
    });

    toast.promise(rejectionPromise, {
      loading: 'Rejecting request...',
      success: `Rejected registration for ${request.businessName}.`,
      error: (err) => `Error rejecting request: ${err.message}`,
    });
  };

  const handleConfirmPayment = (orderId: string) => { updateOrderStatus(orderId, OrderStatus.COMPLETED); };
  const handleRejectOrder = (orderId: string) => { updateOrderStatus(orderId, OrderStatus.REJECTED, 'Payment rejected by admin.'); };
  const handleOpenUserModal = (user: AdminUser | null) => { setEditingUser(user); setIsUserModalOpen(true); };
  const handleCloseUserModal = () => { setEditingUser(null); setIsUserModalOpen(false); };
  const handleSaveUser = (user: AdminUser) => { 
    if (user.id) { 
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...updates } = user; 
      updateAdminUser(user.id, updates); 
    } else { 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addAdminUser(user as any); 
    } 
    handleCloseUserModal(); 
  };
  const handleDeleteUser = (userId: number) => { 
    if (userId === currentUser?.id) { 
      toast.error("Cannot delete self."); 
      return; 
    } 
    setConfirmDialog({ isOpen: true, type: 'deleteUser', data: { userId } });
  };

  const confirmDeleteUser = () => {
    if (confirmDialog.type === 'deleteUser' && confirmDialog.data?.userId) {
      deleteAdminUser(confirmDialog.data.userId);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };
  const handleOpenPackageModal = (pkg: MembershipPackage | null) => { setEditingPackage(pkg); setIsPackageModalOpen(true); };
  const handleClosePackageModal = () => { setEditingPackage(null); setIsPackageModalOpen(false); };
  const handleSavePackage = async (pkg: MembershipPackage) => { if (pkg.id) { await updatePackage(pkg.id, pkg); } else { await addPackage(pkg); } handleClosePackageModal(); };
  const handleDeletePackage = async (packageId: string) => { 
    setConfirmDialog({ isOpen: true, type: 'deletePackage', data: { packageId } });
  };

  const confirmDeletePackage = async () => {
    if (confirmDialog.type === 'deletePackage' && confirmDialog.data?.packageId) {
      await deletePackage(confirmDialog.data.packageId);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };
  const handleOpenAddNewBusiness = () => { setEditingBusiness(NEW_BUSINESS_TEMPLATE); };
  const handleOpenAddNewPost = () => { setEditingPost({ id: 0, title: 'New Blog Post', slug: '', date: '', author: currentUser?.username || 'Editor', category: 'General', excerpt: '', imageUrl: `https://picsum.photos/seed/new-post-${Date.now()}/400/300`, content: '', viewCount: 0 }); };
  const handleOpenAddNewPackage = () => { handleOpenPackageModal({ id: '', tier: MembershipTier.PREMIUM, name: '', price: 0, durationMonths: 12, description: '', features: [''], permissions: { photoLimit: 10, videoLimit: 2, featuredLevel: 1, customLandingPage: true, privateBlog: false, seoSupport: false, monthlyPostLimit: 5, featuredPostLimit: 0, }, isPopular: false, isActive: true }); };


  const handleLogout = async () => {
    try {
      // Clear state first to prevent flashing
      await adminLogout();
      // Small delay to ensure state is cleared before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate even if logout fails
      navigate('/admin/login', { replace: true });
    }
  };

  // Remove auto-redirect - AdminProtectedRoute already handles this
  // This was causing redirect loops and flashing

  // Unified loading state with timeout
  const [initialLoadTimeout, setInitialLoadTimeout] = useState(false);
  
  useEffect(() => {
    // Set timeout for initial load (8 seconds)
    const timeout = setTimeout(() => {
      setInitialLoadTimeout(true);
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  // Show loading only if auth is loading AND we haven't timed out
  if (authLoading && !initialLoadTimeout) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
      </div>
    );
  }

  // If timeout occurred but still loading, show error
  if (authLoading && initialLoadTimeout) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 flex-col gap-4">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading Timeout</h2>
        <p className="text-gray-600 mb-6">The admin dashboard is taking too long to load. Please refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!currentUser) { return null; } // Will redirect via useEffect

  // Simple icons using Heroicons style paths to fix layout issues caused by empty SVGs
  const ICONS: Record<string, React.ReactNode> = {
    dashboard: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    businesses: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    registrations: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    orders: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    blog: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    packages: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    settings: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    tools: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    analytics: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    activity: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    notifications: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    announcements: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    support: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    'abuse-reports': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  };
  const NavLink = ({ tabId, label, icon, permission }: { tabId: AdminPageTab, label: string, icon: React.ReactNode, permission: boolean }) => { if (!permission) return null; return (<button onClick={() => setActiveTab(tabId)} className={`flex items-center gap-3 w-full px-3 py-3 text-left rounded-lg transition-colors ${activeTab === tabId ? 'bg-primary/90 text-white' : 'hover:bg-neutral-700 text-gray-300'}`}>{icon}<span>{label}</span></button>); };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboardOverview businesses={businesses} orders={orders} registrationRequests={registrationRequests} onNavigate={(tab) => setActiveTab(tab as AdminPageTab)} />;
      // D3.3 FIX: Use PermissionGuard instead of inline permission checks
      case 'analytics': return (
        <PermissionGuard permission="canViewAnalytics">
          <AdminAnalyticsDashboard businesses={businesses} orders={orders} registrationRequests={registrationRequests} />
        </PermissionGuard>
      );
      case 'businesses': return (
        <PermissionGuard permission="canManageBusinesses">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Business Management</h2>
              <button onClick={handleOpenAddNewBusiness} className="bg-primary text-white px-4 py-2 rounded-md text-sm">+ Add New Business</button>
            </div>
            <input type="text" placeholder="Search by name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full sm:w-1/3 px-3 py-2 border rounded-md mb-4" />
            {businessesLoading ? <p>Loading businesses...</p> : <BusinessManagementTable businesses={filteredBusinesses} onEdit={setEditingBusiness} onUpdate={updateBusiness} onDelete={deleteBusiness} onDuplicate={handleDuplicateBusiness} />}
          </div>
        </PermissionGuard>
      );
      case 'registrations': return (
        <PermissionGuard permission="canManageRegistrations">
          <RegistrationRequestsTable requests={registrationRequests} onApprove={handleApproveRequest} onReject={handleRejectRequest} />
        </PermissionGuard>
      );
      case 'orders': return (
        <PermissionGuard permission="canManageOrders">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Order Management</h2>
            <div className="flex items-center gap-4 mb-4">
              <label>Filter:</label>
              <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value as OrderStatus | 'all')} className="p-2 border rounded-md">
                <option value="all">All</option>
                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {ordersLoading ? <p>Loading orders...</p> : <OrderManagementTable orders={filteredOrders} onConfirm={handleConfirmPayment} onReject={handleRejectOrder} />}
          </div>
        </PermissionGuard>
      );
      case 'blog': return (
        <PermissionGuard permission="canManagePlatformBlog">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Blog Management</h2>
              <button onClick={handleOpenAddNewPost} className="bg-primary text-white px-4 py-2 rounded-md text-sm">+ Add New Post</button>
            </div>
            {blogLoading ? <p>Loading posts...</p> : <BlogManagementTable posts={blogPosts} onEdit={setEditingPost} onDelete={handleDeletePost} onUpdate={updateBlogPost} />}
            <AIBlogIdeaGenerator />
            <BlogCategoryManager setConfirmDialog={setConfirmDialog} />
          </div>
        </PermissionGuard>
      );
      case 'users': return (
        <PermissionGuard permission="canManageUsers">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">User Management</h2>
              <button onClick={() => handleOpenUserModal(null)} className="bg-primary text-white px-4 py-2 rounded-md text-sm">+ Add New User</button>
            </div>
            <UserManagementTable users={adminUsers} onUpdateUser={updateAdminUser} onEditUser={handleOpenUserModal} onDeleteUser={handleDeleteUser} />
          </div>
        </PermissionGuard>
      );
      case 'packages': return (
        <PermissionGuard permission="canManagePackages">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Membership Packages</h2>
              <button onClick={handleOpenAddNewPackage} className="bg-primary text-white px-4 py-2 rounded-md text-sm">+ Add New Package</button>
            </div>
            <PackageManagementTable packages={packages} onEdit={handleOpenPackageModal} onDelete={handleDeletePackage} onUpdate={updatePackage} />
          </div>
        </PermissionGuard>
      );
      case 'settings': return (
        <PermissionGuard permission="canManageSystemSettings">
          <SystemSettings />
        </PermissionGuard>
      );
      case 'tools': return currentUser.permissions.canUseAdminTools ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Bulk Import Businesses</h2>
            <BusinessBulkImporter />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Health Check</h2>
            <ApiHealthTool />
          </div>
        </div>
      ) : <AccessDenied requiredRole="Use Admin Tools" />;
      case 'content': return currentUser.permissions.canManageSiteContent ? <div className="bg-white p-6 rounded-lg shadow"><h2 className="text-xl font-semibold mb-4">Page Content Management</h2><PageContentEditor /></div> : <AccessDenied requiredRole="Manage Site Content" />;
      case 'homepage': return currentUser.permissions.canManageSiteContent ? <HomepageEditor /> : <AccessDenied requiredRole="Manage Site Content" />;
      case 'theme': return currentUser.permissions.canManageSystemSettings ? <ThemeEditor /> : <AccessDenied requiredRole="Manage System Settings" />;
      case 'activity': return currentUser.permissions.canViewActivityLog ? <AdminActivityLog /> : <AccessDenied requiredRole="View Activity Log" />;
      case 'notifications': return currentUser.permissions.canViewEmailLog ? <AdminNotificationLog /> : <AccessDenied requiredRole="View Email Log" />;
      case 'announcements': return currentUser.permissions.canManageAnnouncements ? <AdminAnnouncementsManager /> : <AccessDenied requiredRole="Manage Announcements" />;
      case 'support': return currentUser.permissions.canManageSupportTickets ? <AdminSupportTickets /> : <AccessDenied requiredRole="Manage Support Tickets" />;
      case 'abuse-reports': return currentUser.permissions.canManageUsers ? <AdminAbuseReports /> : <AccessDenied requiredRole="Manage Users" />;
      case 'landing-page-moderation': return currentUser.permissions.canManageBusinesses ? <AdminLandingPageModeration /> : <AccessDenied requiredRole="Manage Businesses" />;
      default: return <p>Select a section.</p>;
    }
  };

  const pageTitle = activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ');

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {editingBusiness && <EditBusinessModal business={editingBusiness} onClose={() => setEditingBusiness(null)} onSave={handleSaveBusiness} />}
      {editingPost && <EditBlogPostModal post={editingPost} onClose={() => setEditingPost(null)} onSave={handleSavePost} />}
      {isUserModalOpen && <EditAdminUserModal isOpen={isUserModalOpen} onClose={handleCloseUserModal} onSave={handleSaveUser} userToEdit={editingUser} />}
      {isPackageModalOpen && <EditPackageModal isOpen={isPackageModalOpen} onClose={handleClosePackageModal} onSave={handleSavePackage} packageToEdit={editingPackage} />}
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />

      <aside className="w-64 bg-neutral-dark text-white flex-col p-4 space-y-1 fixed h-full overflow-y-auto">
        <div className="text-2xl font-bold font-serif text-primary mb-6 px-3 pt-2">BeautyDir Admin</div>
        <nav>
          <NavLink tabId="dashboard" label="Dashboard" icon={ICONS.dashboard} permission={true} />
          <NavLink tabId="analytics" label="Analytics" icon={ICONS.analytics} permission={currentUser.permissions.canViewAnalytics} />
          <hr className="border-neutral-700 my-2" />
          <p className="px-3 text-xs uppercase text-gray-400 font-semibold tracking-wider mt-4 mb-1">Management</p>
          <NavLink tabId="businesses" label="Businesses" icon={ICONS.businesses} permission={currentUser.permissions.canManageBusinesses} />
          <NavLink tabId="registrations" label="Registrations" icon={ICONS.registrations} permission={currentUser.permissions.canManageRegistrations} />
          <NavLink tabId="orders" label="Orders" icon={ICONS.orders} permission={currentUser.permissions.canManageOrders} />
          <NavLink tabId="blog" label="Platform Blog" icon={ICONS.blog} permission={currentUser.permissions.canManagePlatformBlog} />
          <NavLink tabId="users" label="Users" icon={ICONS.users} permission={currentUser.permissions.canManageUsers} />
          <NavLink tabId="packages" label="Packages" icon={ICONS.packages} permission={currentUser.permissions.canManagePackages} />
          <hr className="border-neutral-700 my-2" />
          <p className="px-3 text-xs uppercase text-gray-400 font-semibold tracking-wider mt-4 mb-1">Communication</p>
          <NavLink tabId="announcements" label="Announcements" icon={ICONS.announcements} permission={currentUser.permissions.canManageAnnouncements} />
          <NavLink tabId="support" label="Support Tickets" icon={ICONS.support} permission={currentUser.permissions.canManageSupportTickets} />
          <NavLink tabId="abuse-reports" label="Abuse Reports" icon={ICONS['abuse-reports']} permission={currentUser.permissions.canManageUsers} />
          <hr className="border-neutral-700 my-2" />
          <p className="px-3 text-xs uppercase text-gray-400 font-semibold tracking-wider mt-4 mb-1">Site Content</p>
          <NavLink tabId="homepage" label="Homepage Editor" icon={ICONS.settings} permission={currentUser.permissions.canManageSiteContent} />
          <NavLink tabId="content" label="Page Editor" icon={ICONS.settings} permission={currentUser.permissions.canManageSiteContent} />
          <NavLink tabId="theme" label="Theme & Branding" icon={ICONS.settings} permission={currentUser.permissions.canManageSystemSettings} />
          <hr className="border-neutral-700 my-2" />
          <p className="px-3 text-xs uppercase text-gray-400 font-semibold tracking-wider mt-4 mb-1">System</p>
          <NavLink tabId="settings" label="System Settings" icon={ICONS.settings} permission={currentUser.permissions.canManageSystemSettings} />
          <NavLink tabId="tools" label="Admin Tools" icon={ICONS.tools} permission={currentUser.permissions.canUseAdminTools} />
          <NavLink tabId="activity" label="Activity Log" icon={ICONS.activity} permission={currentUser.permissions.canViewActivityLog} />
          <NavLink tabId="notifications" label="Email Log" icon={ICONS.notifications} permission={currentUser.permissions.canViewEmailLog} />
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold font-serif text-neutral-dark capitalize">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            <AdminGlobalSearch businesses={businesses} orders={orders} adminUsers={adminUsers} onNavigate={(tab) => setActiveTab(tab as AdminPageTab)} />
            <AdminNotifications orders={orders} registrationRequests={registrationRequests} onNavigate={(tab) => setActiveTab(tab as AdminPageTab)} />
            <div className="bg-white p-2 rounded-lg shadow flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-right">Logged in: <strong className="text-primary">{currentUser.username}</strong></p>
                <p className="text-xs text-gray-500 text-right">{currentUser.role}</p>
              </div>
              <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-red-500 hover:text-white rounded-md transition-colors">
                Logout
              </button>
            </div>
          </div>
        </header>
        {renderContent()}
      </main>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteCategory'}
        title="Delete Blog Category"
        message="Are you sure? This will not delete posts in this category."
        confirmText="Delete"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deletePost'}
        title="Delete Blog Post"
        message="Are you sure you want to delete this post?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeletePost}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'duplicateBusiness'}
        title="Duplicate Business"
        message={confirmDialog.data?.name ? `Are you sure you want to duplicate "${confirmDialog.data.name}"?` : ''}
        confirmText="Duplicate"
        cancelText="Cancel"
        variant="info"
        onConfirm={confirmDuplicateBusiness}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'rejectRequest'}
        title="Reject Registration Request"
        message="Are you sure you want to reject this request?"
        confirmText="Reject"
        cancelText="Cancel"
        variant="warning"
        onConfirm={confirmRejectRequest}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deleteUser'}
        title="Delete Admin User"
        message="Are you sure you want to delete this admin user?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen && confirmDialog.type === 'deletePackage'}
        title="Delete Package"
        message="Are you sure you want to delete this package?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeletePackage}
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
    </div>
  );
};

export default AdminPage;