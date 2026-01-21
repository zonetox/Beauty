import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply, TicketStatus, AppSettings, RegistrationRequest, PageData, PageName } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
import { DEFAULT_PAGE_CONTENT } from './PageContentContext.tsx';
import { snakeToCamel } from '../lib/utils.ts';
import { useErrorHandler } from '../lib/useErrorHandler.ts';

interface AdminPlatformContextType {
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

const AdminPlatformContext = createContext<AdminPlatformContextType | undefined>(undefined);

const ANNOUNCEMENT_READ_KEY = 'read_announcements_by_business';

export const AdminPlatformProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pageContent, setPageContent] = useState<Record<PageName, PageData>>(DEFAULT_PAGE_CONTENT as Record<PageName, PageData>);
  const { handleEdgeFunctionError } = useErrorHandler();

  const fetchAllAdminData = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      const [announcementsRes, ticketsRes, requestsRes, settingsRes, pageContentRes] = await Promise.all([
        supabase.from('announcements').select('id, title, content, type, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('support_tickets').select('id, business_id, subject, message, status, created_at, last_reply_at, replies, businesses!inner(name)').order('last_reply_at', { ascending: false }).limit(100),
        supabase.from('registration_requests').select('id, business_name, email, phone, address, category, tier, submitted_at, status').order('submitted_at', { ascending: false }).limit(100),
        supabase.from('app_settings').select('settings_data').eq('id', 1).maybeSingle(),
        supabase.from('page_content').select('page_name, content_data')
      ]);

      if (announcementsRes.data) setAnnouncements(snakeToCamel(announcementsRes.data) as Announcement[]);
      if (ticketsRes.data) {
        const mappedTickets = (ticketsRes.data as any[]).map(t => ({
          ...snakeToCamel(t),
          businessName: t.businesses?.name || t.business_name || 'Unknown Business'
        }));
        setTickets(mappedTickets as SupportTicket[]);
      }
      if (requestsRes.data) setRegistrationRequests(snakeToCamel(requestsRes.data) as RegistrationRequest[]);
      if (settingsRes.data) setSettings(settingsRes.data.settings_data as unknown as AppSettings);

      const dbContent = (pageContentRes.data as any[])?.reduce((acc, page) => {
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
      setPageContent(finalContent);
    } catch (error) {
      console.error('Error fetching admin platform data:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllAdminData().catch(console.error);
    }, 3000);
    return () => clearTimeout(timer);
  }, [fetchAllAdminData]);

  const fetchLogs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from('admin_activity_logs').select('id, timestamp, admin_username, action, details').order('timestamp', { ascending: false }).limit(100);
    if (!error && data) {
      setLogs(data.map(log => ({ id: log.id, timestamp: log.timestamp || new Date().toISOString(), adminUsername: log.admin_username, action: log.action, details: log.details || '' })));
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const logAdminAction = async (adminUsername: string, action: string, details: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('admin_activity_logs').insert({ admin_username: adminUsername, action, details, timestamp: new Date().toISOString() });
    if (!error) fetchLogs();
  };

  const clearLogs = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('admin_activity_logs').delete().neq('id', '');
    if (!error) setLogs([]);
  };

  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.from('email_notifications_log').select('*').order('sent_at', { ascending: false }).limit(100);
    if (!error && data) {
      setNotifications(data.map(notif => ({ id: notif.id, recipientEmail: notif.recipient_email, subject: notif.subject, body: notif.body, sentAt: notif.sent_at || new Date().toISOString(), read: notif.read || false })));
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const addNotification = async (recipientEmail: string, subject: string, body: string) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.functions.invoke('send-email', { body: { to: recipientEmail, subject, html: body.replace(/\n/g, '<br>') } });
      if (error) handleEdgeFunctionError(error, 'addNotification');
      const { error: dbError } = await supabase.from('email_notifications_log').insert({ recipient_email: recipientEmail, subject, body, sent_at: new Date().toISOString(), read: false });
      if (!dbError) fetchNotifications();
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('email_notifications_log').update({ read: true, read_at: new Date().toISOString() }).eq('id', notificationId);
    if (!error) fetchNotifications();
  };

  const addAnnouncement = async (title: string, content: string, type: 'info' | 'warning' | 'success') => {
    if (!isSupabaseConfigured) return;
    const { data: _data, error } = await supabase.from('announcements').insert({ title, content, type }).select().single();
    if (!error && _data) setAnnouncements(prev => [snakeToCamel(_data) as Announcement, ...prev]);
  };

  const deleteAnnouncement = async (id: string) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const getUnreadAnnouncements = (businessId: number) => {
    const readKey = `${ANNOUNCEMENT_READ_KEY}_${businessId}`;
    const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || '[]');
    return announcements.filter(ann => !readIds.includes(ann.id));
  };

  const markAnnouncementAsRead = (businessId: number, announcementId: string) => {
    const readKey = `${ANNOUNCEMENT_READ_KEY}_${businessId}`;
    const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || '[]');
    if (!readIds.includes(announcementId)) localStorage.setItem(readKey, JSON.stringify([...readIds, announcementId]));
  };

  const getTicketsForBusiness = (businessId: number) => tickets.filter(t => t.businessId === businessId);

  const addTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastReplyAt' | 'status' | 'replies'>) => {
    if (!isSupabaseConfigured) return;
    const { data: _data, error } = await supabase.from('support_tickets').insert({ business_id: ticketData.businessId, business_name: ticketData.businessName, subject: ticketData.subject, message: ticketData.message, status: TicketStatus.OPEN, replies: [] }).select().single();
    if (!error && _data) setTickets(prev => [snakeToCamel(_data) as SupportTicket, ...prev]);
  };

  const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured) return;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const updatedReplies = [...(ticket.replies || []), { ...replyData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
    const { data: _data, error } = await supabase.from('support_tickets').update({ replies: updatedReplies as any, last_reply_at: new Date().toISOString() }).eq('id', ticketId).select().single();
    if (!error && _data) setTickets(prev => prev.map(t => t.id === ticketId ? (snakeToCamel(_data) as SupportTicket) : t));
  };

  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    if (!isSupabaseConfigured) return;
    const { data: _data, error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId).select().single();
    if (!error && _data) setTickets(prev => prev.map(t => t.id === ticketId ? (snakeToCamel(_data) as SupportTicket) : t));
  };

  const approveRegistrationRequest = async (requestId: string) => {
    const { data, error } = await supabase.functions.invoke('approve-registration', { body: { requestId } });
    if (error) { handleEdgeFunctionError(error, 'approveRegistrationRequest'); throw error; }
    return data;
  };

  const rejectRegistrationRequest = async (requestId: string): Promise<void> => {
    const { error } = await supabase.from('registration_requests').update({ status: 'Rejected' }).eq('id', requestId);
    if (error) throw error;
  };

  const updateSettings = async (newSettings: AppSettings) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('app_settings').update({ settings_data: newSettings as any }).eq('id', 1);
    if (!error) setSettings(newSettings);
  };

  const getPageContent = (page: PageName) => pageContent[page];

  const updatePageContent = async (page: PageName, newContent: PageData) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('page_content').upsert({ page_name: page, content_data: newContent as any } as any, { onConflict: 'page_name' });
    if (!error) setPageContent(prev => ({ ...prev, [page]: newContent }));
  };

  const value = {
    logs, logAdminAction, clearLogs,
    notifications, addNotification, markNotificationAsRead,
    announcements, addAnnouncement, deleteAnnouncement, getUnreadAnnouncements, markAnnouncementAsRead,
    tickets, getTicketsForBusiness, addTicket, addReply, updateTicketStatus,
    registrationRequests, approveRegistrationRequest, rejectRegistrationRequest,
    settings, updateSettings,
    getPageContent, updatePageContent
  };

  return <AdminPlatformContext.Provider value={value}>{children}</AdminPlatformContext.Provider>;
};

export const useAdminPlatform = () => {
  const context = useContext(AdminPlatformContext);
  if (!context) throw new Error('useAdminPlatform must be used within an AdminPlatformProvider');
  return context;
};

export const useSettings = () => {
  const { settings, updateSettings } = useAdminPlatform();
  return { settings, updateSettings };
};

export const usePageContent = () => {
  const { getPageContent, updatePageContent } = useAdminPlatform();
  return { getPageContent, updatePageContent };
};
