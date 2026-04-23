import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply,
  TicketStatus, AppSettings, RegistrationRequest, PageData, PageName, AdminUser
} from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { DEFAULT_PAGE_CONTENT } from './PageContentContext.tsx';
import { snakeToCamel } from '../lib/utils.ts';
import { useErrorHandler } from '../lib/useErrorHandler.ts';
import { keys } from '../lib/queryKeys.ts';
import { User } from '@supabase/supabase-js';
import { useAuth } from '../src/features/auth/hooks/useAuth';

export interface AuthenticatedAdmin extends AdminUser { authUser: User; }

interface AdminContextType {
  // Auth
  currentUser: AuthenticatedAdmin | null;
  authLoading: boolean;
  adminUsers: AdminUser[];
  adminLogin: (email: string, pass: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  // Logs
  logs: AdminLogEntry[];
  logAdminAction: (admin_username: string, action: string, details: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  // Notifications
  notifications: Notification[];
  addNotification: (recipient_email: string, subject: string, body: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  // Announcements
  announcements: Announcement[];
  addAnnouncement: (title: string, content: string, type: 'info' | 'warning' | 'success') => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  getUnreadAnnouncements: (business_id: number) => Announcement[];
  markAnnouncementAsRead: (business_id: number, announcementId: string) => void;
  // Support Tickets
  tickets: SupportTicket[];
  getTicketsForBusiness: (business_id: number) => SupportTicket[];
  addTicket: (ticketData: Omit<SupportTicket, 'id' | 'created_at' | 'lastReplyAt' | 'status' | 'replies'>) => Promise<void>;
  addReply: (ticketId: string, replyData: Omit<TicketReply, 'id' | 'created_at'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  // Registration Requests
  registrationRequests: RegistrationRequest[];
  approveRegistrationRequest: (requestId: string) => Promise<unknown>;
  rejectRegistrationRequest: (requestId: string) => Promise<void>;
  // Settings
  settings: AppSettings | null;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  // Page Content
  getPageContent: (page: PageName) => PageData | undefined;
  updatePageContent: (page: PageName, newContent: PageData) => Promise<void>;
  // User Management
  addAdminUser: (userData: Partial<AdminUser> & { password?: string }) => Promise<void>;
  updateAdminUser: (id: number, updates: Partial<AdminUser>) => Promise<void>;
  deleteAdminUser: (id: number) => Promise<void>;
  // Loading State
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const ANNOUNCEMENT_READ_KEY = 'read_announcements_by_business';

type SupportTicketRow = {
  id: string;
  business_id: number;
  business_name?: string;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
  last_reply_at?: string | null;
  replies?: TicketReply[] | null;
  businesses?: { name?: string | null } | null;
};

type PageContentRow = {
  page_name: PageName;
  content_data: PageData;
};

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { handleEdgeFunctionError } = useErrorHandler();
  const { user, role, isDataLoaded, login: featureLogin, logout: featureLogout } = useAuth();

  // --- ADMIN USERS QUERY ---
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_users')
        .select('*')
        .order('id');
      if (error) throw error;
      return (data || []).map((user: any) => ({
        ...user,
        admin_username: user.admin_username || user.username
      })) as AdminUser[];
    },
    enabled: isSupabaseConfigured && role === 'admin'
  });

  // --- AUTH LOGIC REPLACED BY useAuth ---
  const currentUser = React.useMemo(() => {
    if (role === 'admin' && user && adminUsers.length > 0) {
      const adminProfile = adminUsers.find(au => au.email === user.email);
      if (adminProfile && !adminProfile.is_locked) {
        return { ...adminProfile, authUser: user } as AuthenticatedAdmin;
      }
    }
    return null;
  }, [role, user, adminUsers]);

  const authLoading = !isDataLoaded;

  const adminLogin = featureLogin;
  const adminLogout = featureLogout;

  const addAdminUser = async (userData: Partial<AdminUser> & { password?: string }) => {
    if (!isSupabaseConfigured) return;
    // Note: Creating via edge function or direct if policy allows. 
    // Standard approach: trigger or edge function.
    const { error } = await supabase.from('admin_users').insert([{
      email: userData.email,
      admin_username: userData.admin_username,
      role: userData.role || 'editor',
      is_locked: false
    }]);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const updateAdminUser = async (id: number, updates: Partial<AdminUser>) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('admin_users').update(updates).eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const deleteAdminUser = async (id: number) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  // --- QUERY FETCHERS ---

  // 1. Logs
  const { data: logs = [] } = useQuery({
    queryKey: keys.admin.logs,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from('admin_activity_logs')
        .select('id, timestamp, admin_username, action, details')
        .order('timestamp', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map(log => ({
        id: log.id,
        timestamp: log.timestamp || new Date().toISOString(),
        admin_username: log.admin_username,
        action: log.action,
        details: log.details || '',
        created_at: log.timestamp || new Date().toISOString()
      }));
    },
    enabled: isSupabaseConfigured,
    refetchInterval: false
  });

  // 2. Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: keys.admin.notifications,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from('email_notifications_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map(notif => ({
        id: notif.id,
        recipient_email: notif.recipient_email,
        subject: notif.subject,
        body: notif.body,
        sent_at: notif.sent_at || new Date().toISOString(),
        read: notif.read || false
      }));
    },
    enabled: isSupabaseConfigured,
    refetchInterval: false
  });

  // 3. Announcements
  const { data: announcements = [] } = useQuery({
    queryKey: keys.admin.announcements,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from('announcements')
        .select('id, title, content, type, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return snakeToCamel(data || []) as Announcement[];
    },
    enabled: isSupabaseConfigured
  });

  // 4. Tickets
  const { data: tickets = [] } = useQuery({
    queryKey: keys.admin.tickets,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from('support_tickets')
        .select('id, business_id, subject, message, status, created_at, last_reply_at, replies, businesses!inner(name)')
        .order('last_reply_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const mappedTickets = (data as SupportTicketRow[]).map(t => ({
        ...(snakeToCamel(t) as Omit<SupportTicket, 'business_name'>),
        business_name: t.businesses?.name || t.business_name || 'Unknown Business'
      }));
      return mappedTickets as SupportTicket[];
    },
    enabled: isSupabaseConfigured
  });

  // 5. Registration Requests
  const { data: registrationRequests = [] } = useQuery({
    queryKey: keys.admin.registrationRequests,
    queryFn: async () => {
      if (!isSupabaseConfigured) return [];
      const { data, error } = await supabase.from('registration_requests')
        .select('id, business_name, email, phone, address, category, tier, submitted_at, status')
        .order('submitted_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return snakeToCamel(data || []) as RegistrationRequest[];
    },
    enabled: isSupabaseConfigured
  });

  // 6. Settings
  const { data: settings = null } = useQuery({
    queryKey: keys.admin.settings,
    queryFn: async () => {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase.from('app_settings').select('settings_data').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data?.settings_data as unknown as AppSettings || null;
    },
    enabled: isSupabaseConfigured
  });

  // 7. Page Content
  const { data: pageContent = DEFAULT_PAGE_CONTENT as Record<PageName, PageData> } = useQuery({
    queryKey: keys.admin.pageContent,
    queryFn: async () => {
      if (!isSupabaseConfigured) return DEFAULT_PAGE_CONTENT as Record<PageName, PageData>;
      const { data, error } = await supabase.from('page_content').select('page_name, content_data');
      if (error) throw error;

      const dbContent = (data as PageContentRow[])?.reduce((acc, page) => {
        acc[page.page_name as PageName] = page.content_data as PageData;
        return acc;
      }, {} as Record<PageName, PageData>) || {};

      const finalContent = { ...(DEFAULT_PAGE_CONTENT as Record<PageName, PageData>) };
      for (const pageName of Object.keys(finalContent)) {
        const key = pageName as PageName;
        const dbPage = dbContent[key];
        if (dbPage) {
          finalContent[key] = {
            layout: dbPage.layout || finalContent[key].layout,
            visibility: { ...finalContent[key].visibility, ...dbPage.visibility },
          };
        }
      }
      return finalContent;
    },
    enabled: isSupabaseConfigured
  });

  // --- ACTIONS (MUTATIONS) ---

  const logAdminAction = async (admin_username: string, action: string, details: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('admin_activity_logs')
      .insert({ admin_username: admin_username, action, details, timestamp: new Date().toISOString() });
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.logs });
  };

  const clearLogs = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('admin_activity_logs').delete().neq('id', '');
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.logs });
  };

  const addNotification = async (recipient_email: string, subject: string, body: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.functions.invoke('send-email', { body: { to: recipient_email, subject, html: body.replace(/\n/g, '<br>') } });
      if (error) handleEdgeFunctionError(error, 'addNotification');
      const { error: dbError } = await supabase.from('email_notifications_log')
        .insert({ recipient_email: recipient_email, subject, body, sent_at: new Date().toISOString(), read: false });
      if (!dbError) queryClient.invalidateQueries({ queryKey: keys.admin.notifications });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('email_notifications_log')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('id', notificationId);
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.notifications });
  };

  const addAnnouncement = async (title: string, content: string, type: 'info' | 'warning' | 'success') => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('announcements')
      .insert({ title, content, type })
      .select().single();
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.announcements });
  };

  const deleteAnnouncement = async (id: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.announcements });
  };

  const getUnreadAnnouncements = (business_id: number) => {
    const readKey = `${ANNOUNCEMENT_READ_KEY}_${business_id}`;
    const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || '[]');
    return announcements.filter(ann => !readIds.includes(ann.id));
  };

  const markAnnouncementAsRead = (business_id: number, announcementId: string) => {
    const readKey = `${ANNOUNCEMENT_READ_KEY}_${business_id}`;
    const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || '[]');
    if (!readIds.includes(announcementId)) localStorage.setItem(readKey, JSON.stringify([...readIds, announcementId]));
  };

  const getTicketsForBusiness = (business_id: number) => tickets.filter(t => t.business_id === business_id);

  const addTicket = async (ticketData: Omit<SupportTicket, 'id' | 'created_at' | 'lastReplyAt' | 'status' | 'replies'>) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('support_tickets')
      .insert({
        business_id: ticketData.business_id,
        business_name: ticketData.business_name,
        subject: ticketData.subject,
        message: ticketData.message,
        status: TicketStatus.OPEN,
        replies: []
      })
      .select().single();
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.tickets });
  };

  const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'created_at'>) => {
    if (!isSupabaseConfigured) return;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const updatedReplies = [...(ticket.replies || []), { ...replyData, id: crypto.randomUUID(), created_at: new Date().toISOString() }];
    const { error } = await supabase.from('support_tickets')
      .update({ replies: updatedReplies as unknown as Record<string, unknown>[], last_reply_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select().single();
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.tickets });
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('support_tickets')
      .update({ status })
      .eq('id', ticketId)
      .select().single();
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.tickets });
  };

  const approveRegistrationRequest = async (requestId: string) => {
    const { data, error } = await supabase.functions.invoke('approve-registration', { body: { requestId } });
    if (error) { handleEdgeFunctionError(error, 'approveRegistrationRequest'); throw error; }
    queryClient.invalidateQueries({ queryKey: keys.admin.registrationRequests });
    queryClient.invalidateQueries({ queryKey: keys.admin.logs });
    return data;
  };

  const rejectRegistrationRequest = async (requestId: string): Promise<void> => {
    const { error } = await supabase.from('registration_requests').update({ status: 'Rejected' }).eq('id', requestId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: keys.admin.registrationRequests });
  };

  const updateSettings = async (newSettings: AppSettings) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('app_settings').update({ settings_data: newSettings as unknown as Record<string, unknown> }).eq('id', 1);
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.settings });
  };

  const getPageContent = (page: PageName) => pageContent[page];

  const updatePageContent = async (page: PageName, newContent: PageData) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('page_content')
      .upsert({ page_name: page, content_data: newContent as unknown as Record<string, unknown> }, { onConflict: 'page_name' });
    if (!error) queryClient.invalidateQueries({ queryKey: keys.admin.pageContent });
  };

  const value = {
    currentUser, authLoading, adminUsers, adminLogin, adminLogout,
    logs, logAdminAction, clearLogs,
    notifications, addNotification, markNotificationAsRead,
    announcements, addAnnouncement, deleteAnnouncement, getUnreadAnnouncements, markAnnouncementAsRead,
    tickets, getTicketsForBusiness, addTicket, addReply, updateTicketStatus,
    registrationRequests, approveRegistrationRequest, rejectRegistrationRequest,
    settings, updateSettings,
    getPageContent, updatePageContent,
    addAdminUser, updateAdminUser, deleteAdminUser,
    isLoading: false
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within an AdminPlatformProvider');
  return context;
};

export const useAdminAuth = () => {
  const { currentUser, authLoading, adminUsers, adminLogin, adminLogout, addAdminUser, updateAdminUser, deleteAdminUser } = useAdmin();
  return { currentUser, loading: authLoading, adminUsers, adminLogin, adminLogout, addAdminUser, updateAdminUser, deleteAdminUser };
};

export const useAdminPlatform = () => {
  const context = useAdmin();
  return context;
};

export const useSettings = () => {
  const { settings, updateSettings } = useAdmin();
  return { settings, updateSettings };
};

export const usePageContent = () => {
  const { getPageContent, updatePageContent } = useAdmin();
  return { getPageContent, updatePageContent };
};
