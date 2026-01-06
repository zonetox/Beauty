import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AdminLogEntry, Notification, Announcement, SupportTicket, TicketReply, TicketStatus, AppSettings, LayoutItem, RegistrationRequest } from '../types.ts';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.ts';
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
    if (!isSupabaseConfigured) {
      // Fallback mode - skip database queries
      return;
    }

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
        .order('last_reply_at', { ascending: false }),
      supabase.from('registration_requests')
        .select('id, business_name, email, phone, address, city, district, categories, submitted_at, status, notes')
        .order('submitted_at', { ascending: false }),
      supabase.from('app_settings').select('settings_data').eq('id', 1).maybeSingle(),
      supabase.from('page_content')
        .select('id, page_name, content_data')
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
    if (isSupabaseConfigured) {
      const channel = supabase.channel('public:registration_requests')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'registration_requests' }, payload => {
          console.log('Change received!', payload)
          fetchAllAdminData(); // Refetch all data on change
        })
        .subscribe()

      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [fetchAllAdminData]);

  // --- LOGS --- (C4.9: Database connection - 100%)
  const fetchLogs = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      const savedLogs = localStorage.getItem('admin_activity_logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (error) {
          console.error('Failed to parse logs from localStorage:', error);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching admin logs:', error);
        // Fallback to localStorage
        const savedLogs = localStorage.getItem('admin_activity_logs');
        if (savedLogs) {
          try {
            setLogs(JSON.parse(savedLogs));
          } catch (e) {
            console.error('Failed to parse logs from localStorage:', e);
          }
        }
      } else if (data) {
        const mappedLogs: AdminLogEntry[] = data.map(log => ({
          id: log.id,
          timestamp: log.timestamp,
          adminUsername: log.admin_username,
          action: log.action,
          details: log.details || '',
        }));
        setLogs(mappedLogs);
      }
    } catch (error) {
      console.error('Error in fetchLogs:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logAdminAction = async (adminUsername: string, action: string, details: string) => {
    const newLog: AdminLogEntry = { 
      id: crypto.randomUUID(), 
      timestamp: new Date().toISOString(), 
      adminUsername, 
      action, 
      details 
    };

    // Update local state immediately
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      return updated;
    });

    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        localStorage.setItem('admin_activity_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
      } catch (error) {
        console.error('Failed to save logs to localStorage:', error);
      }
      return;
    }

    try {
      // Save to database
      const { error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_username: adminUsername,
          action,
          details,
          timestamp: newLog.timestamp,
        });

      if (error) {
        console.error('Error saving admin log:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem('admin_activity_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      } else {
        // Refresh logs from database
        await fetchLogs();
      }
    } catch (error) {
      console.error('Error in logAdminAction:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('admin_activity_logs', JSON.stringify([newLog, ...logs].slice(0, 100)));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  };

  const clearLogs = async () => {
    setLogs([]);

    if (!isSupabaseConfigured) {
      localStorage.removeItem('admin_activity_logs');
      return;
    }

    try {
      // Delete all logs from database (admin only)
      const { error } = await supabase
        .from('admin_activity_logs')
        .delete()
        .neq('id', ''); // Delete all

      if (error) {
        console.error('Error clearing logs:', error);
      }
      localStorage.removeItem('admin_activity_logs');
    } catch (error) {
      console.error('Error in clearLogs:', error);
    }
  };

  // --- NOTIFICATIONS --- (C4.9: Database connection - 100%)
  const fetchNotifications = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      const savedNotifications = localStorage.getItem('app_notifications');
      if (savedNotifications) {
        try {
          setNotifications(JSON.parse(savedNotifications));
        } catch (error) {
          console.error('Failed to parse notifications from localStorage:', error);
        }
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_notifications_log')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching notifications:', error);
        // Fallback to localStorage
        const savedNotifications = localStorage.getItem('app_notifications');
        if (savedNotifications) {
          try {
            setNotifications(JSON.parse(savedNotifications));
          } catch (e) {
            console.error('Failed to parse notifications from localStorage:', e);
          }
        }
      } else if (data) {
        const mappedNotifications: Notification[] = data.map(notif => ({
          id: notif.id,
          recipientEmail: notif.recipient_email,
          subject: notif.subject,
          body: notif.body,
          sentAt: notif.sent_at,
          read: notif.read || false,
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error in fetchNotifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = async (recipientEmail: string, subject: string, body: string) => {
    // Use email service for better integration and database logging
    if (isSupabaseConfigured) {
      try {
        // Import email service dynamically to avoid circular dependencies
        const { sendSimpleEmail } = await import('../lib/emailService');
        const result = await sendSimpleEmail(recipientEmail, subject, body.replace(/\n/g, '<br>'));
        if (!result.success) {
          console.error('Error sending email:', result.error);
        }
      } catch (error) {
        console.error('Error importing email service:', error);
        // Fallback to direct Edge Function call
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: { to: recipientEmail, subject, html: body.replace(/\n/g, '<br>') }
        });
        if (emailError) console.error('Error sending email:', emailError);
      }
    }

    const newNotification: Notification = { 
      id: crypto.randomUUID(), 
      recipientEmail, 
      subject, 
      body, 
      sentAt: new Date().toISOString(), 
      read: false 
    };

    // Update local state immediately
    setNotifications(prev => [newNotification, ...prev]);

    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        localStorage.setItem('app_notifications', JSON.stringify([newNotification, ...notifications]));
      } catch (error) {
        console.error('Failed to save notifications to localStorage:', error);
      }
      return;
    }

    try {
      // Save to database
      const { error } = await supabase
        .from('email_notifications_log')
        .insert({
          recipient_email: recipientEmail,
          subject,
          body,
          sent_at: newNotification.sentAt,
          read: false,
        });

      if (error) {
        console.error('Error saving notification:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem('app_notifications', JSON.stringify([newNotification, ...notifications]));
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }
      } else {
        // Refresh notifications from database
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error in addNotification:', error);
      // Fallback to localStorage
      try {
        localStorage.setItem('app_notifications', JSON.stringify([newNotification, ...notifications]));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    // Update local state immediately
    setNotifications(prev => {
      const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
      return updated;
    });

    if (!isSupabaseConfigured) {
      // Fallback to localStorage if Supabase not configured
      try {
        const updated = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
        localStorage.setItem('app_notifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save notifications to localStorage:', error);
      }
      return;
    }

    try {
      // Update in database
      const { error } = await supabase
        .from('email_notifications_log')
        .update({ 
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error updating notification:', error);
        // Revert local state
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: false } : n));
      } else {
        // Refresh notifications from database
        await fetchNotifications();
      }
    } catch (error) {
      console.error('Error in markNotificationAsRead:', error);
    }
  };

  // --- ANNOUNCEMENTS ---
  const addAnnouncement = async (title: string, content: string, type: 'info' | 'warning' | 'success') => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot save announcement');
      return;
    }
    const { data, error } = await supabase.from('announcements').insert({ title, content, type }).select().single();
    if (data) setAnnouncements(prev => [data, ...prev]);
  };
  const deleteAnnouncement = async (id: string) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot delete announcement');
      return;
    }
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
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot save ticket');
      return;
    }
    const { data, error } = await supabase.from('support_tickets').insert({ ...ticketData, status: TicketStatus.OPEN }).select().single();
    if (data) setTickets(prev => [data, ...prev]);
  };
  const addReply = async (ticketId: string, replyData: Omit<TicketReply, 'id' | 'createdAt'>) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot add reply');
      return;
    }
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    const newReply = { ...replyData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updatedReplies = [...ticket.replies, newReply];
    const { data, error } = await supabase.from('support_tickets').update({ replies: updatedReplies, last_reply_at: new Date().toISOString() }).eq('id', ticketId).select().single();
    if (data) setTickets(prev => prev.map(t => t.id === ticketId ? data : t));
  };
  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot update ticket status');
      return;
    }
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
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot save settings');
      return;
    }
    const { error } = await supabase.from('app_settings').update({ settings_data: newSettings }).eq('id', 1);
    if (!error) setSettings(newSettings);
  };

  // --- PAGE CONTENT ---
  const getPageContent = (page: PageName) => pageContent[page];
  const updatePageContent = async (page: PageName, newContent: PageData) => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, cannot save page content');
      return;
    }
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
