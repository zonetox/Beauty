

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminUser, AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply, TicketStatus, AppSettings, LayoutItem, RegistrationRequest, AdminPermissions, AdminUserRole } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { Session, User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { DEFAULT_PAGE_CONTENT } from './PageContentContext.tsx';
import { snakeToCamel } from '../lib/utils.ts';
import { useErrorHandler } from '../lib/useErrorHandler.ts';

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
type PageName = 'about' | 'contact' | 'homepage';
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

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ANNOUNCEMENT_READ_KEY = 'read_announcements_by_business';
const DEV_LOGIN_KEY = 'dev_login_user_id';

// Check if running in development mode (production-safe)
const isDevelopmentMode = (): boolean => {
    // Check Vite environment variable first
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env.MODE === 'development' || import.meta.env.DEV === true;
    }
    // Fallback to Node.js environment variable
    if (typeof process !== 'undefined' && process.env) {
        return process.env.NODE_ENV === 'development';
    }
    // Default to false (production-safe)
    return false;
};

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- AUTH STATES ---
    const [currentUser, setCurrentUser] = useState<AuthenticatedAdmin | null>(null);
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const { handleEdgeFunctionError } = useErrorHandler();

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
        // PHASE 3: Optimize query - select only needed columns
        const { data, error } = await supabase.from('admin_users')
          .select('id, username, email, role, permissions, is_locked, last_login')
          .order('id');
        if (error || !data || data.length === 0) {
            // Only log warning if there's an actual error (not just empty table)
            if (error) {
                console.warn("Could not fetch admin users from DB:", error.message);
            } else if (data && data.length === 0) {
                // Empty table is expected in new installations - use info level instead of warn
                console.info("Admin users table is empty. Using fallback dev users for development.");
            } else {
                console.warn("Could not fetch admin users from DB. Falling back to dev users.");
            }
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
        let mounted = true;
        let hasAttemptedAuth = false;

        // Safety timeout: logic must resolve within 15 seconds or we force loading=false
        // Only log warning if we've attempted auth check but it's taking too long
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading && hasAttemptedAuth) {
                // Only warn if Supabase is configured AND we've attempted auth check
                // Only show warning in development mode to avoid Error Logger noise
                if (isSupabaseConfigured && import.meta.env.MODE === 'development') {
                    console.warn('AdminContext: Auth check timed out after 15s. This may indicate a connection issue.');
                }
                setLoading(false);
            } else if (mounted && loading && !hasAttemptedAuth) {
                // If we haven't even attempted auth check yet, just set loading to false silently
                setLoading(false);
            }
        }, 15000);

        const handleAuthChange = async (allAdmins: AdminUser[], user: User | null) => {
            if (!mounted) return;
            
            // D1.1 FIX: Only allow dev quick login in development mode (production-safe)
            const isDev = isDevelopmentMode();
            const devLoginId = isDev ? localStorage.getItem(DEV_LOGIN_KEY) : null;

            // Priority 1: Check for active developer login (ONLY in development mode)
            if (devLoginId && isDev) {
                const devUser = allAdmins.find(u => u.id === parseInt(devLoginId, 10));
                if (devUser) {
                    const fakeAuthUser: User = { id: `dev-${devUser.id}`, email: devUser.email, app_metadata: {}, user_metadata: { username: devUser.username }, aud: 'authenticated', created_at: new Date().toISOString() };
                    if (mounted) {
                        setCurrentUser({ ...devUser, authUser: fakeAuthUser });
                        setLoading(false);
                    }
                    return;
                } else {
                    localStorage.removeItem(DEV_LOGIN_KEY);
                }
            } else if (devLoginId && !isDev) {
                // Production mode: Remove dev login key if it exists
                localStorage.removeItem(DEV_LOGIN_KEY);
            }

            // Priority 2: Check for a real Supabase session
            if (user) {
                const adminProfile = allAdmins.find(au => au.email === user.email);
                if (adminProfile && !adminProfile.isLocked) {
                    if (mounted) setCurrentUser({ ...adminProfile, authUser: user });
                } else {
                    if (mounted) setCurrentUser(null);
                    // Do NOT sign out automatically here as it might disrupt the user session context
                    // if (isSupabaseConfigured) await supabase.auth.signOut();
                }
            } else {
                if (mounted) setCurrentUser(null);
            }
            if (mounted) setLoading(false);
        };

        const initialize = async () => {
            try {
                hasAttemptedAuth = true;
                const allAdmins = await fetchAdminUsers();
                if (isSupabaseConfigured) {
                    const { data: { session }, error } = await supabase.auth.getSession();
                    if (error) console.error("Error getting admin session:", error);
                    await handleAuthChange(allAdmins, session?.user ?? null);
                } else {
                    await handleAuthChange(allAdmins, null);
                }
            } catch (err) {
                console.error("Critical error during Admin initialization:", err);
                if (mounted) setLoading(false);
            }
        };

        initialize();

        let authListener: { subscription: { unsubscribe: () => void } } | null = null;
        if (isSupabaseConfigured) {
            const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
                if (!mounted) return;
                setLoading(true);
                try {
                    // Re-fetch users to get latest permissions/lock status
                    const allAdmins = await fetchAdminUsers();
                    await handleAuthChange(allAdmins, session?.user ?? null);
                } catch (err) {
                    console.error("Auth change error in AdminContext:", err);
                    if (mounted) setLoading(false);
                }
            });
            authListener = data;
        }

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            authListener?.subscription.unsubscribe();
        };
    }, [fetchAdminUsers]); // Removed adminUsers from dependencies to break loop


    const adminLogin = async (email: string, pass: string) => {
        if (!isSupabaseConfigured) throw new Error("Preview Mode: Real login is disabled.");
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    };

    const adminLogout = async () => {
        // D1.1 FIX: Only remove dev login key in development mode
        if (isDevelopmentMode()) {
            localStorage.removeItem(DEV_LOGIN_KEY);
        }
        if (isSupabaseConfigured) {
            await supabase.auth.signOut();
        }
        setCurrentUser(null); // Manually clear state for instant UI update
    };

    const loginAs = (userId: number): boolean => {
        // D1.1 FIX: Only allow dev quick login in development mode (production-safe)
        if (!isDevelopmentMode()) {
            console.warn('Dev quick login is disabled in production mode.');
            return false;
        }
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
            // FINAL PHASE FIX: Use standardized error handling
            handleEdgeFunctionError(error, 'addAdminUser');
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
        try {
            // F2.1: Optimize queries - select only needed columns
            const [
                announcementsRes,
                ticketsRes,
                requestsRes,
                settingsRes,
                pageContentRes
            ] = await Promise.all([
                supabase.from('announcements')
                    .select('id, title, content, type, created_at')
                    .order('created_at', { ascending: false }),
                supabase.from('support_tickets')
                    .select('id, business_id, subject, message, status, created_at, last_reply_at, replies')
                    .order('last_reply_at', { ascending: false, nullsFirst: false })
                    .order('created_at', { ascending: false }),
                supabase.from('registration_requests')
                    .select('id, business_name, email, phone, address, category, tier, submitted_at, status')
                    .order('submitted_at', { ascending: false }),
                supabase.from('app_settings').select('settings_data').eq('id', 1).maybeSingle(),
                supabase.from('page_content')
                    .select('page_name, content_data')
            ]);

            if (announcementsRes.data) {
                setAnnouncements(snakeToCamel(announcementsRes.data) as Announcement[]);
            }
            if (announcementsRes.error) {
                console.error("Error fetching announcements:", announcementsRes.error.message);
            }

            if (ticketsRes.data) {
                setTickets(snakeToCamel(ticketsRes.data) as SupportTicket[]);
            }
            if (ticketsRes.error) {
                console.error("Error fetching tickets:", ticketsRes.error.message);
            }

            if (requestsRes.data) {
                setRegistrationRequests(snakeToCamel(requestsRes.data) as RegistrationRequest[]);
            }
            if (requestsRes.error) {
                console.error("Error fetching registration requests:", requestsRes.error.message);
            }

            if (settingsRes.data) {
                setSettings(settingsRes.data.settings_data as AppSettings);
            }
            if (settingsRes.error) {
                console.error("Error fetching settings:", settingsRes.error.message);
            }

            if (pageContentRes.data) {
                const dbContent = pageContentRes.data.reduce((acc: any, page: any) => {
                    acc[page.page_name as PageName] = page.content_data;
                    return acc;
                }, {} as { [key in PageName]?: PageData });
                setPageContent(dbContent);
            }
            if (pageContentRes.error) {
                console.error("Error fetching page content:", pageContentRes.error.message);
            }
        } catch (error) {
            console.error("Error in fetchAllAdminData:", error);
        }
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
    const addTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastReplyAt' | 'status' | 'replies'>) => {
        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Cannot add ticket.");
            return;
        }
        try {
            const ticketToInsert = {
                business_id: ticketData.businessId,
                business_name: ticketData.businessName,
                subject: ticketData.subject,
                message: ticketData.message,
                status: TicketStatus.OPEN,
                replies: [],
            };
            const { data, error } = await supabase
                .from('support_tickets')
                .insert(ticketToInsert)
                .select()
                .single();
            if (error) {
                console.error("Error adding ticket:", error);
                toast.error(`Failed to create ticket: ${error.message}`);
                throw error;
            }
            if (data) {
                const camelData = snakeToCamel(data) as SupportTicket;
                setTickets(prev => [camelData, ...prev]);
                toast.success("Support ticket created successfully!");
            }
        } catch (error) {
            console.error("Error in addTicket:", error);
            throw error;
        }
    };
    const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'createdAt'>) => {
        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Cannot add reply.");
            return;
        }
        try {
            const ticket = tickets.find(t => t.id === ticketId);
            if (!ticket) {
                toast.error("Ticket not found");
                return;
            }
            const newReply: TicketReply = {
                ...replyData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            const updatedReplies = [...(ticket.replies || []), newReply];
            const { data, error } = await supabase
                .from('support_tickets')
                .update({
                    replies: updatedReplies,
                    last_reply_at: new Date().toISOString(),
                })
                .eq('id', ticketId)
                .select()
                .single();
            if (error) {
                console.error("Error adding reply:", error);
                toast.error(`Failed to send reply: ${error.message}`);
                throw error;
            }
            if (data) {
                const camelData = snakeToCamel(data) as SupportTicket;
                setTickets(prev => prev.map(t => t.id === ticketId ? camelData : t));
                toast.success("Reply sent successfully!");
            }
        } catch (error) {
            console.error("Error in addReply:", error);
            throw error;
        }
    };
    const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Cannot update status.");
            return;
        }
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .update({ status })
                .eq('id', ticketId)
                .select()
                .single();
            if (error) {
                console.error("Error updating ticket status:", error);
                toast.error(`Failed to update status: ${error.message}`);
                throw error;
            }
            if (data) {
                const camelData = snakeToCamel(data) as SupportTicket;
                setTickets(prev => prev.map(t => t.id === ticketId ? camelData : t));
                toast.success("Ticket status updated successfully!");
            }
        } catch (error) {
            console.error("Error in updateTicketStatus:", error);
            throw error;
        }
    };
    const approveRegistrationRequest = async (requestId: string) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot approve request."); return; } /* ... */ };
    const rejectRegistrationRequest = async (requestId: string) => { if (!isSupabaseConfigured) { toast.error("Preview Mode: Cannot reject request."); return; } /* ... */ };
    const updateSettings = async (newSettings: AppSettings) => {
        if (!isSupabaseConfigured) {
            toast.error("Preview Mode: Cannot update settings.");
            return;
        }
        try {
            // Upsert settings (id = 1 is the single settings record)
            const { data, error } = await supabase
                .from('app_settings')
                .upsert({ id: 1, settings_data: newSettings }, { onConflict: 'id' })
                .select()
                .single();
            if (error) {
                console.error("Error updating settings:", error);
                toast.error(`Failed to update settings: ${error.message}`);
                throw error;
            }
            if (data) {
                setSettings(data.settings_data as AppSettings);
                toast.success("Settings updated successfully!");
            }
        } catch (error) {
            console.error("Error in updateSettings:", error);
            throw error;
        }
    };
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