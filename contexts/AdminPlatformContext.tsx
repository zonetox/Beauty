import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply, TicketStatus, AppSettings, LayoutItem, RegistrationRequest } from '../types.ts';
import { supabase } from '../lib/supabaseClient.ts';
import { DEFAULT_PAGE_CONTENT } from './PageContentContext.tsx';

type PageName = 'about' | 'contact';
interface PageData { layout: LayoutItem[]; visibility: { [key: string]: boolean }; }

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
  // Registration Requests (moved from AdminPage)
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
  const [pageContent, setPageContent] = useState<{ [key in PageName]?: PageData }>(DEFAULT_PAGE_CONTENT);

  const fetchAllAdminData = useCallback(async () => {
    const [
      announcementsRes,
      ticketsRes,
      requestsRes,
      settingsRes,
      pageContentRes
    ] = await Promise.all([
      supabase.from('announcements').select('*').order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').order('last_reply_at', { ascending: false }),
      supabase.from('registration_requests').select('*').order('submitted_at', { ascending: false }),
      supabase.from('app_settings').select('settings_data').eq('id', 1).maybeSingle(),
      supabase.from('page_content').select('*')
    ]);

    if (announcementsRes.data) setAnnouncements(announcementsRes.data);
    if (ticketsRes.data) setTickets(ticketsRes.data);
    if (requestsRes.data) setRegistrationRequests(requestsRes.data as RegistrationRequest[]);
    if (settingsRes.data) setSettings(settingsRes.data.settings_data as AppSettings);

    // Merge database page content with local defaults
    const dbContent = pageContentRes.data?.reduce((acc, page) => {
      acc[page.page_name as PageName] = page.content_data;
      return acc;
    }, {} as { [key in PageName]?: PageData }) || {};

    const finalContent = { ...DEFAULT_PAGE_CONTENT };
    for (const pageName of Object.keys(finalContent)) {
      const key = pageName as PageName;
      const defaultPage = DEFAULT_PAGE_CONTENT[key];
      const dbPage = dbContent[key];

      if (dbPage) {
        finalContent[key] = {
          layout: dbPage.layout || defaultPage.layout,
          visibility: { ...defaultPage.visibility, ...dbPage.visibility },
        };
      }
    }
    setPageContent(finalContent);

  }, []);

  useEffect(() => {
    fetchAllAdminData();
    // Supabase real-time subscription for new registrations
    const channel = supabase.channel('public:registration_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_requests' }, payload => {
        console.log('Change received!', payload)
        fetchAllAdminData(); // Refetch all data on change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel);
    }
  }, [fetchAllAdminData]);

  // --- LOGS --- (Still using localStorage as they are client-side only)
  useEffect(() => {
    const savedLogs = localStorage.getItem('admin_activity_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);
  const logAdminAction = (adminUsername: string, action: string, details: string) => {
    const newLog: AdminLogEntry = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), adminUsername, action, details };
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100); // Keep last 100 logs
      localStorage.setItem('admin_activity_logs', JSON.stringify(updated));
      return updated;
    });
  };
  const clearLogs = () => {
    setLogs([]);
    localStorage.removeItem('admin_activity_logs');
  };

  // --- NOTIFICATIONS --- (Simulated email sending)
  const addNotification = async (recipientEmail: string, subject: string, body: string) => {
    // This now calls the Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to: recipientEmail, subject, html: body.replace(/\n/g, '<br>') }
    });
    if (error) console.error('Error sending email:', error);

    // Also add to local log for display in admin panel
    const newNotification: Notification = { id: crypto.randomUUID(), recipientEmail, subject, body, sentAt: new Date().toISOString(), read: false };
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      localStorage.setItem('app_notifications', JSON.stringify(updated)); // Keep this for logging UI
      return updated;
    });
  };
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
      localStorage.setItem('app_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  // --- ANNOUNCEMENTS ---
  const addAnnouncement = async (title: string, content: string, type: 'info' | 'warning' | 'success') => {
    const { data, error } = await supabase.from('announcements').insert({ title, content, type }).select().single();
    if (data) setAnnouncements(prev => [data, ...prev]);
  };
  const deleteAnnouncement = async (id: string) => {
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
    if (!readIds.includes(announcementId)) {
      localStorage.setItem(readKey, JSON.stringify([...readIds, announcementId]));
    }
  };

  // --- SUPPORT TICKETS ---
  const getTicketsForBusiness = (businessId: number) => tickets.filter(t => t.businessId === businessId);
  const addTicket = async (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'lastReplyAt' | 'status' | 'replies'>) => {
    const { data, error } = await supabase.from('support_tickets').insert({ ...ticketData, status: TicketStatus.OPEN }).select().single();
    if (data) setTickets(prev => [data, ...prev]);
  };
  const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'createdAt'>) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const newReply = { ...replyData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updatedReplies = [...ticket.replies, newReply];
    const { data, error } = await supabase.from('support_tickets').update({ replies: updatedReplies, last_reply_at: new Date().toISOString() }).eq('id', ticketId).select().single();
    if (data) setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
  };
  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    const { data, error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId).select().single();
    if (data) setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
  };

  // --- REGISTRATION REQUESTS ---
  const approveRegistrationRequest = async (requestId: string) => {
    const { data, error } = await supabase.functions.invoke('approve-registration', {
      body: { requestId }
    });
    if (error) throw error;
    // Data will refetch via real-time subscription
    return data;
  };

  const rejectRegistrationRequest = async (requestId: string) => {
    // A simple status update can be done on the client if RLS allows it for admins,
    // or you could create a separate, simple edge function for this.
    const { data, error } = await supabase.from('registration_requests').update({ status: 'Rejected' }).eq('id', requestId).select().single();
    if (error) throw error;
    // Data will refetch via real-time subscription
  };

  // --- SETTINGS ---
  const updateSettings = async (newSettings: AppSettings) => {
    const { error } = await supabase.from('app_settings').update({ settings_data: newSettings }).eq('id', 1);
    if (!error) setSettings(newSettings);
  };

  // --- PAGE CONTENT ---
  const getPageContent = (page: PageName) => pageContent[page];
  const updatePageContent = async (page: PageName, newContent: PageData) => {
    const { error } = await supabase.from('page_content').upsert({ page_name: page, content_data: newContent }, { onConflict: 'page_name' });
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

  return (
    <AdminPlatformContext.Provider value={value}>
      {children}
    </AdminPlatformContext.Provider>
  );
};

// --- CUSTOM HOOKS ---
export const useAdminPlatform = () => {
  const context = useContext(AdminPlatformContext);
  if (!context) {
    throw new Error('useAdminPlatform must be used within an AdminPlatformProvider');
  }
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
