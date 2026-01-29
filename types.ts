// types.ts

export enum MembershipTier {
  VIP = 'VIP',
  PREMIUM = 'Premium',
  FREE = 'Free',
}

export enum BusinessCategory {
  SPA = 'Spa & Massage',
  SALON = 'Hair Salon',
  NAIL = 'Nail Salon',
  CLINIC = 'Beauty Clinic',
  DENTAL = 'Dental Clinic',
}

export enum AdminUserRole {
  ADMIN = 'Admin',
  MODERATOR = 'Moderator',
  EDITOR = 'Editor',
}

export enum OrderStatus {
  PENDING = 'Pending',
  AWAITING_CONFIRMATION = 'Awaiting Confirmation',
  COMPLETED = 'Completed',
  REJECTED = 'Rejected',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum MediaCategory {
  UNCATEGORIZED = 'Uncategorized',
  INTERIOR = 'Interior',
  EXTERIOR = 'Exterior',
  STAFF = 'Staff',
  PRODUCTS = 'Products',
}

export enum BusinessBlogPostStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
}

export enum ReviewStatus {
  VISIBLE = 'Visible',
  HIDDEN = 'Hidden',
}

export enum StaffMemberRole {
  ADMIN = 'Admin',
  EDITOR = 'Editor',
}

export enum AppointmentStatus {
  PENDING = 'Pending',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed',
}

export enum DealStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  SCHEDULED = 'Scheduled',
}

export interface SEO {
  title?: string;
  description?: string;
  keywords?: string;
}

export interface Socials {
  facebook?: string;
  instagram?: string;
  zalo?: string;
  tiktok?: string;
}

export interface Service {
  id: string;
  business_id: number;
  name: string;
  price: string;
  description: string;
  image_url: string;
  duration_minutes?: number;
  position: number;
}

export interface Deal {
  id: string;
  business_id: number;
  title: string;
  description: string;
  original_price: number;
  deal_price: number;
  discount_percentage: number;
  image_url: string;
  status: 'Active' | 'Expired' | 'Pending';
  start_date: string;
  end_date: string;
  terms?: string;
}

export interface TeamMember {
  id: string;
  business_id: number;
  name: string;
  role: string;
  image_url: string;
}

export interface Appointment {
  id: string;
  business_id: number;
  service_id: string;
  service_name: string;
  staff_member_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  date: string;
  time_slot: string;
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface PageView {
  id: string;
  page_type: 'homepage' | 'business' | 'blog' | 'directory';
  page_id?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  viewed_at: string;
}

export interface Conversion {
  id: string;
  business_id?: number;
  conversion_type: 'click' | 'booking' | 'contact' | 'call';
  source?: 'landing_page' | 'directory' | 'search';
  user_id?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  converted_at: string;
}

export interface AnalyticsDataPoint {
  date: string; // "YYYY-MM-DD"
  page_views: number;
  contact_clicks: number;
  call_clicks: number;
  direction_clicks: number;
}

export interface TrafficSource {
  source: 'Google' | 'Homepage' | 'Blog' | 'Direct Search';
  percentage: number;
}

export interface BusinessAnalytics {
  business_id: number;
  time_series: AnalyticsDataPoint[];
  traffic_sources: TrafficSource[];
  average_time_on_page: number; // in seconds
}

export interface MediaItem {
  id: string;
  business_id: number;
  url: string;
  type: MediaType;
  category: MediaCategory;
  title?: string;
  description?: string;
  position: number;
}

export interface Review {
  id: string;
  user_id?: string;
  business_id: number;
  user_name: string;
  user_avatar_url: string;
  rating: number;
  comment: string;
  submitted_date: string;
  status: ReviewStatus;
  reply?: any;
  reply_content?: string;
  reply_date?: string;
}

// Working hours types
export interface WorkingHourRange {
  open: string; // e.g. "09:00"
  close: string; // e.g. "17:30"
  isOpen?: boolean;
}

export type WorkingHour = WorkingHourRange | string | null;

export type WorkingHours = {
  [day: string]: WorkingHour;
};

// Staff permissions shared type for hooks/components
export interface StaffPermissions {
  can_edit_landing_page?: boolean;
  can_edit_blog?: boolean;
  can_manage_media?: boolean;
  can_manage_services?: boolean;
  is_staff_member?: boolean;
  is_business_owner?: boolean;
  is_owner?: boolean; // alias
  has_access?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffMemberRole;
}

// Business Staff (Sub-user system)
export interface BusinessStaff {
  id: string;
  business_id: number;
  user_id: string;
  role: StaffMemberRole;
  permissions: {
    can_edit_landing_page?: boolean;
    can_edit_blog?: boolean;
    can_manage_media?: boolean;
    can_manage_services?: boolean;
  };
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export interface MembershipPackage {
  id: string;
  name: string;
  tier: MembershipTier;
  price: number;
  duration_months: number;
  description?: string;
  features?: string[];
  permissions?: any;
  is_popular?: boolean;
  is_active?: boolean;
}

// Abuse Report
export interface AbuseReport {
  id: string;
  review_id: string;
  reporter_id?: string;
  reason: string;
  status: 'Pending' | 'Reviewed' | 'Resolved' | 'Dismissed';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// Landing Page Configuration
export interface LandingPageSectionConfig {
  enabled: boolean;
  order: number;
}

export interface LandingPageConfig {
  sections: {
    hero: LandingPageSectionConfig;
    trust: LandingPageSectionConfig;
    services: LandingPageSectionConfig;
    gallery: LandingPageSectionConfig;
    team: LandingPageSectionConfig;
    reviews: LandingPageSectionConfig;
    cta: LandingPageSectionConfig;
    contact: LandingPageSectionConfig;
  };
}

// Trust Indicator
export interface TrustIndicator {
  type: 'badge' | 'certification' | 'award';
  title: string;
  icon?: string;
  description?: string;
}

export interface NotificationSettings {
  review_alerts: boolean;
  booking_requests: boolean;
  platform_news: boolean;
}

export interface Business {
  id: number;
  slug: string;
  name: string;
  logo_url?: string;
  image_url: string;
  slogan?: string;
  categories: BusinessCategory[];
  address: string;
  city: string;
  district: string;
  ward: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  phone: string;
  email?: string;
  website?: string;
  youtube_url?: string;
  rating: number;
  review_count: number;
  view_count: number;
  membership_tier: MembershipTier;
  membership_expiry_date?: string;
  is_verified: boolean;
  is_active: boolean;
  is_featured?: boolean;
  joined_date: string;
  description: string;
  working_hours?: WorkingHours | null;
  socials?: Socials;
  seo?: SEO;
  staff: StaffMember[];
  notification_settings: NotificationSettings;
  hero_slides?: HeroSlide[];
  hero_image_url?: string;
  landing_page_config?: LandingPageConfig;
  trust_indicators?: TrustIndicator[];
  landing_page_status?: 'Pending' | 'Approved' | 'Rejected' | 'Needs Review';
  owner_id?: string;

  // --- RELATIONAL DATA ---
  services?: Service[];
  deals?: Deal[];
  gallery?: MediaItem[];
  team?: TeamMember[];
  reviews?: Review[];
  business_blog_posts?: BusinessBlogPost[];
}

export interface BlogCategory {
  id: string;
  name: string;
  created_at?: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  image_url: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  content: string;
  view_count: number;
  status: 'Draft' | 'Published';
  is_featured?: boolean;
  seo?: {
    title: string;
    description: string;
    keywords: string;
  };
  updated_at?: string;
}

export interface BlogComment {
  id: string;
  post_id: number;
  author_name: string;
  author_avatar_url?: string;
  content: string;
  date: string;
  created_at?: string;
}

export interface BusinessBlogPost {
  id: string;
  business_id: number;
  slug: string;
  title: string;
  excerpt: string;
  image_url: string;
  content: string;
  author: string;
  created_date: string;
  published_date?: string;
  status: BusinessBlogPostStatus;
  view_count: number;
  is_featured?: boolean;
  seo?: SEO;
}

export interface RegistrationRequest {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  address: string;
  category: BusinessCategory;
  tier: MembershipTier;
  submitted_at: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface AdminPermissions {
  can_view_analytics: boolean;
  can_manage_businesses: boolean;
  can_manage_registrations: boolean;
  can_manage_orders: boolean;
  can_manage_platform_blog: boolean;
  can_manage_users: boolean;
  can_manage_packages: boolean;
  can_manage_announcements: boolean;
  can_manage_support_tickets: boolean;
  can_manage_site_content: boolean;
  can_manage_system_settings: boolean;
  can_use_admin_tools: boolean;
  can_view_activity_log: boolean;
  can_view_email_log: boolean;
}

export interface AdminLogEntry {
  id: string;
  admin_user_name: string; // Matches DB column
  action: string;
  details?: string;
  timestamp: string;
  created_at: string;
}

export interface EmailLogEntry {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
  read: boolean;
  read_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
  read: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: AdminUserRole;
  permissions: AdminPermissions;
  last_login?: string;
  is_locked: boolean;
}

import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthenticatedAdmin extends AdminUser {
  authUser: SupabaseUser;
}

export interface Profile {
  id: string;
  updated_at?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  user_type?: string;
  business_id?: number | null;
  favorites?: number[];
}

export type AdminPageTab = 'dashboard' | 'analytics' | 'businesses' | 'registrations' | 'orders' | 'blog' | 'users' | 'packages' | 'content' | 'homepage' | 'settings' | 'tools' | 'activity' | 'notifications' | 'announcements' | 'support' | 'theme' | 'abuse-reports' | 'landing-page-moderation';

export interface HeroSlide {
  title: string;
  subtitle: string;
  image_url: string;
}

export interface HomepageSection {
  id: string;
  type: 'featuredBusinesses' | 'featuredDeals' | 'featuredBlog' | 'exploreByLocation';
  title: string;
  subtitle: string;
  visible: boolean;
}

export interface HomepageData {
  hero_slides: HeroSlide[];
  sections: HomepageSection[];
}

export interface bank_details {
  bank_name: string;
  account_name: string;
  account_number: string;
  transfer_note: string;
}

export interface AppSettings {
  site_name?: string;
  support_email?: string;
  maintenance_mode?: boolean;
  logo_url?: string;
  favicon_url?: string;
  colors?: {
    primary?: string;
    primary_dark?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    neutral_dark?: string;
  };
  seo_defaults?: {
    default_title?: string;
    default_description?: string;
    default_keywords?: string;
  };
  email_config?: {
    from_email?: string;
    from_name?: string;
    reply_to?: string;
  };
  bank_details: bank_details;
}

export interface LayoutItem {
  id: string;
  type: 'section' | 'text' | 'rule';
  key?: string;
  content?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  created_at: string;
}

export interface Order {
  id: string;
  business_id: number;
  business_name: string;
  package_id: string;
  package_name: string;
  amount: number;
  status: OrderStatus;
  payment_method: 'Bank Transfer' | 'Credit Card' | 'Simulated Gateway';
  submitted_at: string;
  confirmed_at?: string;
  notes?: string;
  payment_proof_url?: string;
}

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  CLOSED = 'Closed',
}

export interface TicketReply {
  id: string;
  author: 'Admin' | string;
  content: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  business_id: number;
  business_name: string;
  subject: string;
  message: string;
  status: TicketStatus;
  created_at: string;
  last_reply_at?: string;
  replies?: any[];
}

export type PageName = 'about' | 'contact' | 'homepage';

export interface PageData {
  layout: LayoutItem[];
  visibility: { [key: string]: boolean };
}
