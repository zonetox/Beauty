import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminUser, AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply, TicketStatus, AppSettings, RegistrationRequest, PageData, PageName } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
// snakeToCamel removed for True Sync
import { useErrorHandler } from '../lib/useErrorHandler.ts';

// Admin access is determined ONLY by querying the admin_users table
// No fallback or dev users - if admin_users query fails or returns empty, treat user as non-admin
// --- TYPE DEFINITIONS ---
export interface AuthenticatedAdmin extends AdminUser { authUser: User; }

interface AdminContextType {
    // Auth
    currentUser: AuthenticatedAdmin | null;
    loading: boolean;
    adminUsers: AdminUser[];
    adminLogin: (email: string, pass: string) => Promise<void>;
    adminLogout: () => Promise<void>;
    addAdminUser: (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'is_locked'>) => Promise<void>;
    updateAdminUser: (user_id: number, updates: Partial<AdminUser>) => Promise<void>;
    deleteAdminUser: (user_id: number) => Promise<void>;
    // Logs
    logs: AdminLogEntry[];
    logAdminAction: (admin_username: string, action: string, details: string) => void;
    clearLogs: () => void;
    // Notifications
    notifications: Notification[];
    addNotification: (recipient_email: string, subject: string, body: string) => void;
    markNotificationAsRead: (notificationId: string) => void;
    // Announcements
    announcements: Announcement[];
    addAnnouncement: (title: string, content: string, type: string) => Promise<void>;
    deleteAnnouncement: (id: string) => Promise<void>;
    getUnreadAnnouncements: (business_id: number) => Announcement[];
    markAnnouncementAsRead: (business_id: number, announcementId: string) => void;
    // Support Tickets
    tickets: SupportTicket[];
    getTicketsForBusiness: (business_id: number) => SupportTicket[];
    addTicket: (ticketData: Omit<SupportTicket, 'id' | 'created_at' | 'last_reply_at' | 'status' | 'replies'>) => Promise<void>;
    addReply: (ticketId: string, replyData: Omit<TicketReply, 'id' | 'created_at'>) => Promise<void>;
    updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
    // Registration Requests
    registrationRequests: RegistrationRequest[];
    approveRegistrationRequest: (requestId: string) => Promise<void>;
    rejectRegistrationRequest: (requestId: string) => Promise<void>;
    // Settings
    settings: AppSettings | null;
    updateSettings: (newSettings: AppSettings) => Promise<void>;
    // Page Content
    getPageContent: (page: PageName) => PageData | undefined;
    updatePageContent: (page: PageName, newContent: PageData) => Promise<void>;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);

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
    const [pageContent, setPageContent] = useState<Record<PageName, PageData>>({} as Record<PageName, PageData>);

    // --- AUTH LOGIC ---
    const fetchAdminUsers = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setAdminUsers([]);
            return [];
        }
        const { data, error } = await supabase.from('admin_users')
            .select('id, username, email, role, permissions, is_locked, last_login')
            .order('id');

        if (error) {
            console.warn("Could not fetch admin users from DB:", error.message);
            setAdminUsers([]);
            return [];
        }

        const results = (data || []) as unknown as AdminUser[];
        setAdminUsers(results);
        return results;
    }, []);

    useEffect(() => {
        let mounted = true;
        let hasAttemptedAuth = false;

        const safetyTimeout = setTimeout(() => {
            if (mounted && loading && hasAttemptedAuth) {
                setLoading(false);
            }
        }, 15000);

        const handleAuthChange = async (allAdmins: AdminUser[], user: User | null) => {
            if (!mounted) return;
            if (user) {
                const adminProfile = allAdmins.find(au => au.email === user.email);
                if (adminProfile && !adminProfile.is_locked) {
                    setCurrentUser({ ...adminProfile, authUser: user });
                } else {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        };

        const initialize = async () => {
            try {
                hasAttemptedAuth = true;
                const allAdmins = await fetchAdminUsers();
                if (isSupabaseConfigured) {
                    const { data: { session } } = await supabase.auth.getSession();
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
                if (_event !== 'SIGNED_OUT') setLoading(true);
                const allAdmins = await fetchAdminUsers();
                await handleAuthChange(allAdmins, session?.user ?? null);
            });
            authListener = data;
        }

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            authListener?.subscription.unsubscribe();
        };
    }, [fetchAdminUsers]);

    const adminLogin = async (email: string, pass: string) => {
        if (!isSupabaseConfigured) throw new Error("Preview Mode: Real login is disabled.");
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
    };

    const adminLogout = async () => {
        setCurrentUser(null);
        setLoading(false);
        if (isSupabaseConfigured) {
            supabase.auth.signOut().catch((error) => console.warn('SignOut error (ignored):', error));
        }
    };

    const addAdminUser = async (newUser: Omit<AdminUser, 'id' | 'lastLogin' | 'is_locked'>) => {
        if (!isSupabaseConfigured) {
            toast.error("Cannot add admin user: Supabase is not configured.");
            return;
        }
        const { error } = await supabase.functions.invoke('create-admin-user', { body: newUser });
        if (error) {
            handleEdgeFunctionError(error, 'addAdminUser');
            throw new Error(`Failed to create admin user: ${error.message}`);
        }
        await fetchAdminUsers();
    };

    const updateAdminUser = async (_user_id: number, _updates: Partial<AdminUser>) => {
        toast.error("Update admin user not implemented in this context.");
    };

    const deleteAdminUser = async (_user_id: number) => {
        toast.error("Delete admin user not implemented in this context.");
    };

    // --- PLATFORM LOGIC ---
    const fetchAllAdminData = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setAnnouncements([]); setTickets([]); setRegistrationRequests([]); setSettings(null); setPageContent({} as Record<PageName, PageData>);
            return;
        }
        try {
            const [announcementsRes, ticketsRes, requestsRes, settingsRes, pageContentRes] = await Promise.all([
                supabase.from('announcements').select('id, title, content, type, created_at').order('created_at', { ascending: false }),
                supabase.from('support_tickets').select('id, business_id, subject, message, status, created_at, last_reply_at, replies').order('last_reply_at', { ascending: false, nullsFirst: false }),
                supabase.from('registration_requests').select('id, business_name, email, phone, address, category, tier, submitted_at, status').order('submitted_at', { ascending: false }),
                supabase.from('app_settings').select('settings_data').eq('id', 1).maybeSingle(),
                supabase.from('page_content').select('page_name, content_data')
            ]);

            if (announcementsRes.data) setAnnouncements(announcementsRes.data as unknown as Announcement[]);
            if (ticketsRes.data) {
                const mappedTickets = (ticketsRes.data as unknown as (SupportTicket & { businesses?: { name: string } })[]).map(t => ({
                    ...(t as unknown as SupportTicket),
                    business_name: t.businesses?.name || (t as any).business_name || 'Unknown Business'
                }));
                setTickets(mappedTickets as SupportTicket[]);
            }
            if (requestsRes.data) setRegistrationRequests(requestsRes.data as unknown as RegistrationRequest[]);
            if (settingsRes.data) setSettings(settingsRes.data.settings_data as unknown as AppSettings);
            if (pageContentRes.data) {
                const dbContent = (pageContentRes.data as { page_name: string; content_data: unknown }[]).reduce((acc, page) => {
                    acc[page.page_name as PageName] = page.content_data as PageData;
                    return acc;
                }, {} as Record<PageName, PageData>);
                setPageContent(dbContent);
            }
        } catch (error) {
            console.error("Error in fetchAllAdminData:", error);
        }
    }, []);

    useEffect(() => {
        // Initial data load
        fetchAllAdminData();

        // TEMPORARY FIX: Realtime subscription disabled to prevent infinite re-fetch loop
        // TODO: Re-enable with proper debouncing after performance optimization
        /*
        if (isSupabaseConfigured) {
            const channel = supabase.channel('public:registration_requests')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_requests' }, () => fetchAllAdminData())
                .subscribe();
            return () => { supabase.removeChannel(channel); }
        }
        */

        return () => { }; // Explicit destructor
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const logAdminAction = (_admin_username: string, _action: string, _details: string) => {
        // Placeholder for logging
    };

    const clearLogs = () => setLogs([]);

    const addNotification = async (recipient_email: string, subject: string, body: string) => {
        if (!isSupabaseConfigured) {
            toast.success(`(Preview) Email to: ${recipient_email} `);
            return;
        }
        const { error } = await supabase.functions.invoke('send-email', { body: { to: recipient_email, subject, html: body } });
        if (error) console.error('Error sending email:', error.message);
        setNotifications(prev => [{ id: crypto.randomUUID(), recipient_email, subject, body, sent_at: new Date().toISOString(), read: false }, ...prev]);
    };

    const markNotificationAsRead = (_notificationId: string) => {
        // Placeholder
    };

    const addAnnouncement = async (_title: string, _content: string, _type: string) => {
        toast.error("Add announcement not implemented.");
    };

    const deleteAnnouncement = async (_id: string) => {
        toast.error("Delete announcement not implemented.");
    };

    const getUnreadAnnouncements = (_business_id: number) => [];

    const markAnnouncementAsRead = (_business_id: number, _announcementId: string) => {
        // Placeholder
    };

    const getTicketsForBusiness = (business_id: number) => tickets.filter(t => t.business_id === business_id);

    const addTicket = async (ticketData: Omit<SupportTicket, 'id' | 'created_at' | 'last_reply_at' | 'status' | 'replies'>) => {
        if (!isSupabaseConfigured) return;
        const { data, error } = await supabase.from('support_tickets').insert({
            business_id: ticketData.business_id,
            business_name: ticketData.business_name,
            subject: ticketData.subject,
            message: ticketData.message,
            status: TicketStatus.OPEN,
            replies: []
        }).select().single();
        if (!error && data) setTickets(prev => [data as unknown as SupportTicket, ...prev]);
    };

    const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'created_at'>) => {
        if (!isSupabaseConfigured) return;
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return;
        const updatedReplies = [...(ticket.replies || []), { ...replyData, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
        const { data, error } = await supabase.from('support_tickets').update({
            replies: updatedReplies as any,
            last_reply_at: new Date().toISOString()
        }).eq('id', ticketId).select().single();
        if (!error && data) setTickets(prev => prev.map(t => t.id === ticketId ? (data as unknown as SupportTicket) : t));
    };

    const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
        if (!isSupabaseConfigured) return;
        const { data, error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId).select().single();
        if (!error && data) setTickets(prev => prev.map(t => t.id === ticketId ? (data as unknown as SupportTicket) : t));
    };

    const approveRegistrationRequest = async (_requestId: string) => {
        toast.error("Approve request not implemented.");
    };

    const rejectRegistrationRequest = async (_requestId: string) => {
        toast.error("Reject request not implemented.");
    };

    const updateSettings = async (newSettings: AppSettings) => {
        if (!isSupabaseConfigured) return;
        const { data, error } = await supabase.from('app_settings').upsert({ id: 1, settings_data: newSettings as any }, { onConflict: 'id' }).select().single();
        if (!error && data) setSettings(data.settings_data as unknown as AppSettings);
    };

    const getPageContent = (page: PageName) => pageContent[page];

    const updatePageContent = async (_page: PageName, _newContent: PageData) => {
        toast.error("Update page content not implemented.");
    };

    const value = {
        currentUser, loading, adminUsers, adminLogin, adminLogout, addAdminUser, updateAdminUser, deleteAdminUser,
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

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within an AdminProvider');
    return context;
};

export const useAdminAuth = () => {
    const { currentUser, loading, adminUsers, adminLogin, adminLogout, addAdminUser, updateAdminUser, deleteAdminUser } = useAdmin();
    return { currentUser, loading, adminUsers, adminLogin, adminLogout, addAdminUser, updateAdminUser, deleteAdminUser };
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
