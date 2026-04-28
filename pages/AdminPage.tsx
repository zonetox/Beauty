import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MembershipTier, Business, AdminUser, BlogPost, MembershipPackage, BusinessCategory, OrderStatus, ConfirmDialogState, AdminPageTab } from '../types.ts';
import { useBusinessData, useBlogData, useMembershipPackageData } from '../contexts/BusinessDataContext.tsx';
import { useAdminAuth, useAdminPlatform } from '../contexts/AdminContext.tsx';
import { useOrderData } from '../contexts/BusinessBlogDataContext.tsx';
import ConfirmDialog from '../components/ConfirmDialog.tsx';

// Reusable Components
import EditBusinessModal from '../components/EditBusinessModal.tsx';
import ForgotPasswordModal from '../components/ForgotPasswordModal.tsx';
import EditBlogPostModal from '../components/EditBlogPostModal.tsx';
import HomepageEditor from '../components/HomepageEditor.tsx';
import EditAdminUserModal from '../components/EditAdminUserModal.tsx';
import EditPackageModal from '../components/EditPackageModal.tsx';
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

// Modular Tabs
import AdminBlogTab from '../components/admin/AdminBlogTab.tsx';
import AdminBusinessesTab from '../components/admin/AdminBusinessesTab.tsx';
import AdminUserManagementTab from '../components/admin/AdminUserManagementTab.tsx';
import AdminPackagesTab from '../components/admin/AdminPackagesTab.tsx';
import AdminOrdersTab from '../components/admin/AdminOrdersTab.tsx';
import AdminRegistrationsTab from '../components/admin/AdminRegistrationsTab.tsx';

const NEW_BUSINESS_TEMPLATE: Business = { id: 0, slug: '', name: 'New Business Name', categories: [BusinessCategory.SPA], membership_tier: MembershipTier.FREE, address: '', phone: '', email: '', image_url: `https://picsum.photos/seed/new-business/400/300`, city: 'TP. Hồ Chí Minh', district: '', ward: '', tags: [], rating: 0, review_count: 0, view_count: 0, is_active: true, is_verified: false, joined_date: new Date().toISOString(), description: 'Please provide a detailed description.', services: [], gallery: [], team: [], reviews: [], working_hours: { 'Thứ 2 - Thứ 6': '9:00 - 20:00' }, socials: {}, notification_settings: { review_alerts: true, booking_requests: false, platform_news: true } };

const AccessDenied: React.FC<{ requiredRole: string }> = ({ requiredRole }) => (
  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
    <p className="text-sm text-yellow-700">Access Denied. You do not have <strong>{requiredRole}</strong> permissions to view this section.</p>
  </div>
);

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { businesses, updateBusiness, addBusiness, deleteBusiness } = useBusinessData();
  const { adminUsers, addAdminUser, updateAdminUser, deleteAdminUser, currentUser, adminLogout, loading: authLoading } = useAdminAuth();

  const { addBlogPost, updateBlogPost, deleteBlogPost, deleteCategory: deleteBlogCategory } = useBlogData();
  const { addPackage, updatePackage, deletePackage } = useMembershipPackageData();
  const { orders, updateOrderStatus } = useOrderData();
  const { addNotification, registrationRequests, approveRegistrationRequest, rejectRegistrationRequest } = useAdminPlatform();

  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminPageTab>((searchParams.get('tab') as AdminPageTab) || 'dashboard');

  React.useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<MembershipPackage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    type: null,
    data: undefined,
  });

  const handleSaveBusiness = async (businessToSave: Business) => {
    if (businessToSave.id === 0) {
      const slug = businessToSave.name.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`;
      await addBusiness({ ...businessToSave, slug });
    } else {
      await updateBusiness(businessToSave);
    }
    setEditingBusiness(null);
  };

  const handleSavePost = async (postToSave: BlogPost) => {
    if (postToSave.id === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, slug, date, view_count, ...newPostData } = postToSave;
      await addBlogPost(newPostData);
    } else {
      await updateBlogPost(postToSave);
    }
    setEditingPost(null);
  };

  const handleDeletePost = async (post_id: number) => {
    setConfirmDialog({ isOpen: true, type: 'deletePost', data: { id: post_id } });
  };

  const confirmDeletePost = async () => {
    if (confirmDialog.type === 'deletePost' && confirmDialog.data?.id) {
      await deleteBlogPost(confirmDialog.data.id as number);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

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
    const business_name = confirmDialog.data.name;
    const businessToDuplicate = businesses.find((b: Business) => b.name === business_name);
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
      id: 0,
      name: newName,
      slug: newSlug,
      joined_date: new Date().toISOString(),
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
      loading: `Approving ${request.business_name}...`,
      success: `Approved registration for ${request.business_name}. An invitation email has been sent.`,
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
      addNotification(request.email, 'Your Registration Update', `We regret to inform you that your registration for ${request.business_name} has been rejected at this time.`);
    });
    toast.promise(rejectionPromise, {
      loading: 'Rejecting request...',
      success: `Rejected registration for ${request.business_name}.`,
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

  const handleDeleteUser = (user_id: number) => {
    if (user_id === currentUser?.id) {
      toast.error("Cannot delete self.");
      return;
    }
    setConfirmDialog({ isOpen: true, type: 'deleteUser', data: { user_id } });
  };

  const confirmDeleteUser = () => {
    if (confirmDialog.type === 'deleteUser' && confirmDialog.data?.user_id) {
      deleteAdminUser(confirmDialog.data.user_id);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

  const handleOpenPackageModal = (pkg: MembershipPackage | null) => { setEditingPackage(pkg); setIsPackageModalOpen(true); };
  const handleClosePackageModal = () => { setEditingPackage(null); setIsPackageModalOpen(false); };
  const handleSavePackage = async (pkg: MembershipPackage) => { if (pkg.id) { await updatePackage(pkg.id, pkg); } else { await addPackage(pkg); } handleClosePackageModal(); };
  const handleDeletePackage = async (package_id: string) => {
    setConfirmDialog({ isOpen: true, type: 'deletePackage', data: { package_id } });
  };

  const confirmDeletePackage = async () => {
    if (confirmDialog.type === 'deletePackage' && confirmDialog.data?.package_id) {
      await deletePackage(confirmDialog.data.package_id);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

  const handleOpenAddNewBusiness = () => { setEditingBusiness(NEW_BUSINESS_TEMPLATE); };
  const handleOpenAddNewPost = () => { setEditingPost({ id: 0, title: 'New Blog Post', slug: '', date: '', author: currentUser?.admin_username || 'Editor', category: 'General', excerpt: '', image_url: `https://picsum.photos/seed/new-post-${Date.now()}/400/300`, content: '', view_count: 0, status: 'Published' }); };

  const handleLogout = async () => {
    try {
      await adminLogout();
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/admin/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/admin/login', { replace: true });
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium">Đang tải admin dashboard...</p>
      </div>
    );
  }

  if (!currentUser) { return null; }

  const ICONS: Record<string, React.ReactNode> = {
    dashboard: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
    businesses: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>),
    registrations: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>),
    orders: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>),
    blog: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>),
    users: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
    packages: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>),
    settings: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
    tools: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>),
    analytics: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>),
    activity: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    notifications: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>),
    announcements: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>),
    support: (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>),
    'abuse-reports': (<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>)
  };

  const NavLink = ({ tabId, label, icon, permission }: { tabId: AdminPageTab, label: string, icon: React.ReactNode, permission: boolean }) => {
    if (!permission) return null;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center gap-4 w-full px-4 py-4 text-left rounded-xl transition-all duration-500 text-[10px] uppercase font-bold tracking-[0.2em] ${activeTab === tabId ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'hover:bg-white/5 text-neutral-400 hover:text-primary hover:translate-x-2'}`}
      >
        {icon}<span>{label}</span>
      </button>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboardOverview businesses={businesses} orders={orders} registrationRequests={registrationRequests} onNavigate={(tab) => setActiveTab(tab as AdminPageTab)} />;
      case 'analytics': return (
        <PermissionGuard permission="can_view_analytics">
          <AdminAnalyticsDashboard businesses={businesses} orders={orders} registrationRequests={registrationRequests} />
        </PermissionGuard>
      );
      case 'businesses': return (
        <PermissionGuard permission="can_manage_businesses">
          <AdminBusinessesTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onEdit={setEditingBusiness}
            onDelete={deleteBusiness}
            onDuplicate={handleDuplicateBusiness}
            onAddNew={handleOpenAddNewBusiness}
          />
        </PermissionGuard>
      );
      case 'registrations': return (
        <PermissionGuard permission="can_manage_registrations">
          <AdminRegistrationsTab onApprove={handleApproveRequest} onReject={handleRejectRequest} />
        </PermissionGuard>
      );
      case 'orders': return (
        <PermissionGuard permission="can_manage_orders">
          <AdminOrdersTab onConfirm={handleConfirmPayment} onReject={handleRejectOrder} />
        </PermissionGuard>
      );
      case 'blog': return (
        <PermissionGuard permission="can_manage_platform_blog">
          <AdminBlogTab
            onAddNew={handleOpenAddNewPost}
            onEdit={setEditingPost}
            onDelete={handleDeletePost}
            setConfirmDialog={setConfirmDialog}
          />
        </PermissionGuard>
      );
      case 'users': return (
        <PermissionGuard permission="can_manage_users">
          <AdminUserManagementTab
            currentUser={currentUser!}
            onEdit={handleOpenUserModal}
            onDelete={handleDeleteUser}
          />
        </PermissionGuard>
      );
      case 'packages': return (
        <PermissionGuard permission="can_manage_packages">
          <AdminPackagesTab onEdit={handleOpenPackageModal} onDelete={handleDeletePackage} />
        </PermissionGuard>
      );
      case 'settings': return (
        <PermissionGuard permission="can_manage_system_settings">
          <SystemSettings />
        </PermissionGuard>
      );
      case 'tools': return currentUser.permissions?.can_use_admin_tools ? (
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
      case 'content': return currentUser.permissions?.can_manage_site_content ? <div className="bg-white p-6 rounded-lg shadow"><h2 className="text-xl font-semibold mb-4">Page Content Management</h2><PageContentEditor /></div> : <AccessDenied requiredRole="Manage Site Content" />;
      case 'homepage': return currentUser.permissions?.can_manage_site_content ? <HomepageEditor /> : <AccessDenied requiredRole="Manage Site Content" />;
      case 'theme': return currentUser.permissions?.can_manage_system_settings ? <ThemeEditor /> : <AccessDenied requiredRole="Manage System Settings" />;
      case 'activity': return currentUser.permissions?.can_view_activity_log ? <AdminActivityLog /> : <AccessDenied requiredRole="View Activity Log" />;
      case 'notifications': return currentUser.permissions?.can_view_email_log ? <AdminNotificationLog /> : <AccessDenied requiredRole="View Email Log" />;
      case 'announcements': return currentUser.permissions?.can_manage_announcements ? <AdminAnnouncementsManager /> : <AccessDenied requiredRole="Manage Announcements" />;
      case 'support': return currentUser.permissions?.can_manage_support_tickets ? <AdminSupportTickets /> : <AccessDenied requiredRole="Manage Support Tickets" />;
      case 'abuse-reports': return currentUser.permissions?.can_manage_users ? <AdminAbuseReports /> : <AccessDenied requiredRole="Manage Users" />;
      case 'landing-page-moderation': return currentUser.permissions?.can_manage_businesses ? <AdminLandingPageModeration /> : <AccessDenied requiredRole="Manage Businesses" />;
      default: return <p>Select a section.</p>;
    }
  };

  const pageTitle = activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="w-72 bg-[#1A1A1A] text-white flex flex-col fixed h-full overflow-y-auto z-30 border-r border-white/5 shadow-2xl">
        <div className="p-10">
          <h1 className="text-3xl font-serif text-gold tracking-widest uppercase">Admin</h1>
          <p className="text-[10px] text-white/30 mt-2 font-bold uppercase tracking-[0.3em]">Hệ thống quản trị 1Beauty</p>
        </div>

        <nav className="flex-grow px-6 space-y-2 pb-10">
          <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 px-4">Tổng quan hệ thống</div>
          <NavLink tabId="dashboard" label="Bảng điều khiển" icon={ICONS.dashboard} permission={true} />
          <NavLink tabId="analytics" label="Phân tích dữ liệu" icon={ICONS.analytics} permission={currentUser.permissions?.can_view_analytics ?? false} />

          <div className="mt-12 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 px-4">Quản lý đối tác</div>
          <NavLink tabId="businesses" label="Doanh nghiệp" icon={ICONS.businesses} permission={currentUser.permissions?.can_manage_businesses ?? false} />
          <NavLink tabId="orders" label="Giao dịch gói (SePay)" icon={ICONS.orders} permission={currentUser.permissions?.can_manage_orders ?? false} />
          <NavLink tabId="packages" label="Cấu hình gói hội viên" icon={ICONS.packages} permission={currentUser.permissions?.can_manage_packages ?? false} />
          <NavLink tabId="blog" label="Tạp chí Beauty" icon={ICONS.blog} permission={currentUser.permissions?.can_manage_platform_blog ?? false} />
          <NavLink tabId="users" label="Quản trị viên" icon={ICONS.users} permission={currentUser.permissions?.can_manage_users ?? false} />

          <div className="mt-12 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 px-4">Hệ thống & Cài đặt</div>
          <NavLink tabId="tools" label="Công cụ Admin" icon={ICONS.tools} permission={currentUser.permissions?.can_use_admin_tools ?? false} />
          <NavLink tabId="content" label="Nội dung trang" icon={ICONS.settings} permission={currentUser.permissions?.can_manage_site_content ?? false} />
          <NavLink tabId="homepage" label="Biên tập Home" icon={ICONS.settings} permission={true} />
          <NavLink tabId="theme" label="Giao diện (Theme)" icon={ICONS.settings} permission={true} />
          <NavLink tabId="settings" label="Cài đặt hệ thống" icon={ICONS.settings} permission={currentUser.permissions?.can_manage_system_settings ?? false} />

          <div className="mt-12 text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4 px-4">Nhật ký & Giám sát</div>
          <NavLink tabId="activity" label="Nhật ký hoạt động" icon={ICONS.activity} permission={currentUser.permissions?.can_view_activity_log ?? false} />
          <NavLink tabId="notifications" label="Lịch sự thông báo" icon={ICONS.notifications} permission={currentUser.permissions?.can_view_email_log ?? false} />
          <NavLink tabId="announcements" label="Thông báo hệ thống" icon={ICONS.announcements} permission={currentUser.permissions?.can_manage_announcements ?? false} />
          <NavLink tabId="support" label="Hỗ trợ & Ticket" icon={ICONS.support} permission={currentUser.permissions?.can_manage_support_tickets ?? false} />
          <NavLink tabId="abuse-reports" label="Báo cáo vi phạm" icon={ICONS.support} permission={currentUser.permissions?.can_manage_users ?? false} />
          <NavLink tabId="landing-page-moderation" label="Kiểm duyệt LP" icon={ICONS.businesses} permission={currentUser.permissions?.can_manage_businesses ?? false} />
        </nav>

        <div className="p-8 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-4 mb-8 px-2">
            <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-serif text-xl shadow-inner">
              {currentUser.admin_username.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-serif text-white tracking-wide truncate">{currentUser.admin_username}</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{currentUser.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-accent/70 hover:text-accent bg-accent/5 hover:bg-accent/10 border border-accent/10 rounded-full transition-all duration-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow ml-72 min-h-screen">
        {/* Header */}
        <header className="bg-background/80 backdrop-blur-xl border-b border-primary/5 sticky top-0 z-20 flex items-center justify-between px-10 py-6">
          <div className="flex items-center gap-8">
            <h2 className="text-3xl font-serif text-primary tracking-tight">{pageTitle}</h2>
            <AdminGlobalSearch
              businesses={businesses}
              orders={orders}
              adminUsers={adminUsers}
              onNavigate={(tab) => setActiveTab(tab as AdminPageTab)}
            />
          </div>
          <div className="flex items-center gap-6">
            <AdminNotifications
              orders={orders}
              registrationRequests={registrationRequests}
              onNavigate={(tab) => setActiveTab(tab as AdminPageTab)}
            />
            <button className="bg-gold/5 text-gold p-3 rounded-full border border-gold/10 hover:bg-gold/10 transition-all shadow-inner">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      {editingBusiness && (
        <EditBusinessModal
          business={editingBusiness}
          onClose={() => setEditingBusiness(null)}
          onSave={handleSaveBusiness}
        />
      )}
      {editingPost && (
        <EditBlogPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSave={handleSavePost}
        />
      )}
      {isUserModalOpen && (
        <EditAdminUserModal
          isOpen={isUserModalOpen}
          userToEdit={editingUser}
          onClose={handleCloseUserModal}
          onSave={handleSaveUser}
        />
      )}
      {isPackageModalOpen && (
        <EditPackageModal
          isOpen={isPackageModalOpen}
          packageToEdit={editingPackage}
          onClose={handleClosePackageModal}
          onSave={handleSavePackage}
        />
      )}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === 'deleteCategory' ? 'Delete Category?' :
            confirmDialog.type === 'deletePost' ? 'Delete Post?' :
              confirmDialog.type === 'duplicateBusiness' ? 'Duplicate Business?' :
                confirmDialog.type === 'rejectRequest' ? 'Reject Registration?' :
                  confirmDialog.type === 'deleteUser' ? 'Delete User?' :
                    confirmDialog.type === 'deletePackage' ? 'Delete Package?' :
                      'Are you sure?'
        }
        message={
          confirmDialog.type === 'deleteCategory' ? 'This will remove the category. Posts in this category will move to "General".' :
            confirmDialog.type === 'deletePost' ? 'This action cannot be undone.' :
              confirmDialog.type === 'duplicateBusiness' ? `Are you sure you want to duplicate "${confirmDialog.data?.name}"?` :
                confirmDialog.type === 'rejectRequest' ? 'Are you sure you want to reject this registration request?' :
                  confirmDialog.type === 'deleteUser' ? 'This will permanently remove the admin user access.' :
                    confirmDialog.type === 'deletePackage' ? 'This will remove the membership package for new subscribers.' :
                      'This action cannot be undone.'
        }
        onConfirm={
          confirmDialog.type === 'deleteCategory' ? confirmDeleteCategory :
            confirmDialog.type === 'deletePost' ? confirmDeletePost :
              confirmDialog.type === 'duplicateBusiness' ? confirmDuplicateBusiness :
                confirmDialog.type === 'rejectRequest' ? confirmRejectRequest :
                  confirmDialog.type === 'deleteUser' ? confirmDeleteUser :
                    confirmDialog.type === 'deletePackage' ? confirmDeletePackage :
                      () => { }
        }
        onCancel={() => setConfirmDialog({ isOpen: false, type: null })}
      />
    </div>
  );
};

export default AdminPage;
