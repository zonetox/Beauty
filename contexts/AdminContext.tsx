

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminUser, AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply, TicketStatus, AppSettings, LayoutItem, RegistrationRequest, AdminPermissions, AdminUserRole } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { DEFAULT_PAGE_CONTENT } from './PageContentContext.tsx';
import { snakeToCamel } from '../lib/utils.ts';

// --- Hardcoded fallback users for Developer Quick Login ---
const DEV_ADMIN_USERS: AdminUser[] = [
    {
        id: 1,
        username: 'superadmin',
        email: 'admin@beautydir.com',
        role: AdminUserRole.ADMIN,
        permissions: {
            canManageUsers: true, canManageOrders: true, canViewEmailLog: true, canUseAdminTools: true, canViewAnalytics: true, canManagePackages: true,
            canViewActivityLog: true, canManageBusinesses: true, canManageSiteContent: true, canManagePlatformBlog: true, canManageAnnouncements: true,
            canManageRegistrations: true, canManageSupportTickets: true, canManageSystemSettings: true
        },
        isLocked: false,
    },
    {
        id: 2,
        username: 'moderator_01',
        email: 'mod@beautydir.com',
        role: AdminUserRole.MODERATOR,
        permissions: {
            canManageUsers: false, canManageOrders: true, canViewEmailLog: false, canUseAdminTools: false, canViewAnalytics: false, canManagePackages: false,
            canViewActivityLog: true, canManageBusinesses: true, canManageSiteContent: false, canManagePlatformBlog: true, canManageAnnouncements: false,
            canManageRegistrations: true, canManageSupportTickets: true, canManageSystemSettings: false
        },
        isLocked: false,
    },
    {
        id: 3,
        username: 'editor_anna',
        email: 'editor@beautydir.com',
        role: AdminUserRole.EDITOR,
        permissions: {
            canManageUsers: false, canManageOrders: false, canViewEmailLog: false, canUseAdminTools: false, canViewAnalytics: false, canManagePackages: false,
            canViewActivityLog: false, canManageBusinesses: false, canManageSiteContent: true, canManagePlatformBlog: true, canManageAnnouncements: false,
            canManageRegistrations: false, canManageSupportTickets: false, canManageSystemSettings: false
        },
        isLocked: false,
    }
];


// --- TYPE DEFINITIONS ---
export interface AuthenticatedAdmin extends AdminUser { authUser: User; }
type PageName = 'about' | 'contact';
interface PageData { layout: LayoutItem[]; visibility: { [key: string]: boolean }; }

interface AdminContextType {
    // Auth
    currentUser: AuthenticatedAdmin | null; // Changed from currentAdminUser
    loading: boolean; // Changed from authLoading
    adminUsers: AdminUser[];
    adminLogin: (email: string, pass: string) => Promise<any>;
    adminLogout: () => Promise<any>;
    loginAs: (userId: number) => boolean;
    addAdminUser: (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'isLocked'>) => Promise<void>;
    updateAdminUser: (userId: number, updates: Partial<AdminUser>) => Promise<void>;
    deleteAdminUser: (userId: number) => Promise<void>;
    // Logs
    logs: AdminLogEntry[];
    logAdminAction: (adminUsername: string, action: string, details: string) => void;
    clearLogs: () => void;
    // Notifications
    notifications: Notification[];
    addNotification: (recipientEmail: string, subject: string, body: string) => void;
    markNotificationAsRead: (notificationId: string) => void;
    // Announcements
    announcements: Announcement[];
    addAnnouncement: (title: string, content: string, type: 'info' | 'warning' | 'success') => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    getUnreadAnnouncements: (businessId: number) => Announcement[];
    markAnnouncementAsRead: (businessId: number, announcementId: string) => void;
    // Support Tickets
    tickets: SupportTicket[];
    getTicketsForBusiness: (businessId: number) => SupportTicket[];
    addTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastReplyAt' | 'status' | 'replies'>) => Promise<void>;
    addReply: (ticketId: string, replyData: Omit<TicketReply, 'id' | 'createdAt'>) => Promise<void>;
    updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
    // Registration Requests
    registrationRequests: RegistrationRequest[];
    approveRegistrationRequest: (requestId: string) => Promise<any>;
    rejectRegistrationRequest: (requestId: string) => Promise<void>;
    // Settings
    settings: AppSettings | null;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
    // Page Content
    getPageContent: (page: PageName) => PageData | undefined;
    updatePageContent: (page: PageName, newContent: PageData) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ANNOUNCEMENT_READ_KEY = 'read_announcements_by_business';
const DEV_LOGIN_KEY = 'dev_login_user_id';

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- AUTH STATES ---
    const [currentUser, setCurrentUser] = useState<AuthenticatedAdmin | null>(null);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);

    // --- PLATFORM STATES ---
    const [logs, setLogs] = useState<AdminLogEntry[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [pageContent, setPageContent] = useState<{ [key in PageName]?: PageData }>({});

    // --- AUTH LOGIC ---
    const fetchAdminUsers = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setAdminUsers(DEV_ADMIN_USERS);
            return DEV_ADMIN_USERS;
        }
        const { data, error } = await supabase.from('admin_users').select('*').order('id');
        if (error || !data || data.length === 0) {
            console.warn("Could not fetch admin users from DB or table is empty. Falling back to dev users.", error?.message);
            const fallback = DEV_ADMIN_USERS;
            setAdminUsers(fallback);
            return fallback;
        } else {
            const mappedData = snakeToCamel(data);
            setAdminUsers(mappedData);
            return mappedData;
        }
    }, []);

    useEffect(() => {
        const handleAuthChange = async (allAdmins: AdminUser[], user: User | null) => {
            const devLoginId = localStorage.getItem(DEV_LOGIN_KEY);

            // Priority 1: Check for active developer login
            if (devLoginId) {
                const devUser = allAdmins.find(u => u.id === parseInt(devLoginId, 10));
                if (devUser) {
                    const fakeAuthUser: User = { id: `dev-${devUser.id}`, email: devUser.email, app_metadata: {}, user_metadata: { username: devUser.username }, aud: 'authenticated', created_at: new Date().toISOString() };
                    setCurrentUser({ ...devUser, authUser: fakeAuthUser });
                    setLoading(false);
                    return;
                } else {
                    localStorage.removeItem(DEV_LOGIN_KEY);
                }
            }

            // Priority 2: Check for a real Supabase session
            if (user) {
                const adminProfile = allAdmins.find(au => au.email === user.email);
                if (adminProfile && !adminProfile.isLocked) {
                    setCurrentUser({ ...adminProfile, authUser: user });
                } else {
                    setCurrentUser(null);
                    if (isSupabaseConfigured) await supabase.auth.signOut();
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        };

        const initialize = async () => {
            try {
                const allAdmins = await fetchAdminUsers();
                if (isSupabaseConfigured) {
                    const { data: { session } } = await supabase.auth.getSession();
                    await handleAuthChange(allAdmins, session?.user ?? null);
                } else {
                    await handleAuthChange(allAdmins, null);
                }
            } catch (err) {
                console.error("Critical error during Admin initialization:", err);
                setLoading(false);
            }
        };

        initialize();

        if (isSupabaseConfigured) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                setLoading(true);
                try {
                    // Re-fetch users to get latest permissions/lock status
                    const allAdmins = await fetchAdminUsers();
                    await handleAuthChange(allAdmins, session?.user ?? null);
                } catch (err) {
                    console.error("Auth change error in AdminContext:", err);
                } finally {
                    setLoading(false);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [fetchAdminUsers]); // Removed adminUsers from dependencies to break loop


    const adminLogin = async (email: string, pass: string) => {
        if (!isSupabaseConfigured) throw new Error("Preview Mode: Real login is disabled.");
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    };

    const adminLogout = async () => {
        localStorage.removeItem(DEV_LOGIN_KEY);
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
        setCurrentUser(null); // Manually clear state for instant UI update
    };

    const loginAs = (userId: number): boolean => {
        const userToLogin = adminUsers.find(u => u.id === userId);
        if (userToLogin) {
            const fakeAuthUser: User = { id: `dev-${userId}`, email: userToLogin.email, app_metadata: {}, user_metadata: { username: userToLogin.username }, aud: 'authenticated', created_at: new Date().toISOString() };
            setCurrentUser({ ...userToLogin, authUser: fakeAuthUser });
            localStorage.setItem(DEV_LOGIN_KEY, String(userId));
            return true;
        }
        return false;
    };

    const addAdminUser = async (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'isLocked'>) => {
        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Cannot add a real admin user.");
            return;
        }
        const { error } = await supabase.functions.invoke('create-admin-user', {
            body: newUser
        });
        if (error) {
            throw new Error(`Failed to create admin user: ${error.message}`);
        }
        // Re-fetch all users to get the new one.
        await fetchAdminUsers();
    };
    const updateAdminUser = async (userId: number, updates: Partial<AdminUser>) => { /* ... implementation unchanged ... */ };
    const deleteAdminUser = async (userId: number) => { /* ... implementation unchanged ... */ };

    // --- PLATFORM LOGIC ---
    const fetchAllAdminData = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setAnnouncements([]); setTickets([]); setRegistrationRequests([]); setSettings(null); setPageContent({});
            return;
        }
        /* ... rest of implementation unchanged ... */
    }, []);
    useEffect(() => {
        fetchAllAdminData();
        if (isSupabaseConfigured) {
            const channel = supabase.channel('public:registration_requests')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_requests' }, () => fetchAllAdminData())
                .subscribe();
            return () => { supabase.removeChannel(channel); }
        }
    }, [fetchAllAdminData]);

    useEffect(() => { /* Log loading */ }, []);
    const logAdminAction = (adminUsername: string, action: string, details: string) => { /* ... */ };
    const clearLogs = () => { /* ... */ };
    const addNotification = async (recipientEmail: string, subject: string, body: string) => {
        if (!isSupabaseConfigured) { toast.success(`(Preview) Email simulated to: ${recipientEmail}\nSubject: ${subject}`); return; }
        const { error } = await supabase.functions.invoke('send-email', { body: { to: recipientEmail, subject, html: body.replace(/\n/g, '<br>') } });
        if (error) console.error('Error sending email:', error.message);
        const newNotification: Notification = { id: crypto.randomUUID(), recipientEmail, subject, body, sentAt: new Date().toISOString(), read: false };
        setNotifications(prev => {
            const updated = [newNotification, ...prev];
            localStorage.setItem('app_notifications', JSON.stringify(updated));
            return updated;
        });
    };
    const markNotificationAsRead = (notificationId: string) => { /* ... */ };
    const addAnnouncement = async (title: string, content: string, type: any) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add announcement."); return; } /* ... */ };
    const deleteAnnouncement = async (id: string) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot delete announcement."); return; } /* ... */ };
    const getUnreadAnnouncements = (businessId: number) => { /* ... */ return []; };
    const markAnnouncementAsRead = (businessId: number, announcementId: string) => { /* ... */ };
    const getTicketsForBusiness = (businessId: number) => tickets.filter(t => t.businessId === businessId);
    const addTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastReplyAt' | 'status' | 'replies'>) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add ticket."); return; } /* ... */ };
    const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'createdAt'>) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot add reply."); return; } /* ... */ };
    const updateTicketStatus = async (ticketId: string, status: TicketStatus) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update status."); return; } /* ... */ };
    const approveRegistrationRequest = async (requestId: string) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot approve request."); return; } /* ... */ };
    const rejectRegistrationRequest = async (requestId: string) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot reject request."); return; } /* ... */ };
    const updateSettings = async (newSettings: AppSettings) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update settings."); return; } /* ... */ };
    const getPageContent = (page: PageName) => pageContent[page];
    const updatePageContent = async (page: PageName, newContent: PageData) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot update page content."); return; } /* ... */ };

    const value = {
        currentUser, loading, adminUsers, adminLogin, adminLogout, loginAs, addAdminUser, updateAdminUser, deleteAdminUser,
        logs, logAdminAction, clearLogs,
        notifications, addNotification, markNotificationAsRead,
        announcements, addAnnouncement, deleteAnnouncement, getUnreadAnnouncements, markAnnouncementAsRead,
        tickets, getTicketsForBusiness, addTicket, addReply, updateTicketStatus,
        registrationRequests, approveRegistrationRequest, rejectRegistrationRequest,
        settings, updateSettings,
        getPageContent, updatePageContent
    };

    return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

// --- CUSTOM HOOKS ---
export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within an AdminProvider');
    return context;
};

export const useAdminAuth = () => {
    const { currentUser, loading, adminUsers, adminLogin, adminLogout, loginAs, addAdminUser, updateAdminUser, deleteAdminUser } = useAdmin();
    return { currentUser, loading, adminUsers, adminLogin, adminLogout, loginAs, addAdminUser, updateAdminUser, deleteAdminUser };
};
export const useAdminPlatform = () => {
    const { logs, logAdminAction, clearLogs, notifications, addNotification, markNotificationAsRead, announcements, addAnnouncement, deleteAnnouncement, getUnreadAnnouncements, markAnnouncementAsRead, tickets, getTicketsForBusiness, addTicket, addReply, updateTicketStatus, registrationRequests, approveRegistrationRequest, rejectRegistrationRequest } = useAdmin();
    return { logs, logAdminAction, clearLogs, notifications, addNotification, markNotificationAsRead, announcements, addAnnouncement, deleteAnnouncement, getUnreadAnnouncements, markAnnouncementAsRead, tickets, getTicketsForBusiness, addTicket, addReply, updateTicketStatus, registrationRequests, approveRegistrationRequest, rejectRegistrationRequest };
};
export const useSettings = () => {
    const { settings, updateSettings } = useAdmin();
    return { settings, updateSettings };
};
export const usePageContent = () => {
    const { getPageContent, updatePageContent } = useAdmin();
    return { getPageContent, updatePageContent };
};