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
  id: string; // Now a UUID from its own table
  business_id: number;
  name: string;
  price: string;
  description: string;
  image_url: string; // Match database column
  duration_minutes?: number;
  position: number; // For drag-and-drop ordering
}

export interface Deal {
  id: string; // Now a UUID from its own table
  business_id: number;
  title: string;
  description: string;
  image_url?: string;
  start_date?: string; // ISO
  end_date?: string; // ISO
  discount_percentage?: number;
  original_price?: number;
  deal_price?: number;
  status: DealStatus;
}

export interface TeamMember {
  id: string; // Now a UUID from its own table
  business_id: number;
  name: string;
  role: string;
  image_url: string; // Match database column
}

export interface MediaItem {
  id: string; // Now a UUID from its own table
  business_id: number;
  url: string;
  type: MediaType;
  category: MediaCategory;
  title?: string;
  description?: string;
  position: number; // For drag-and-drop ordering
}

export interface Review {
  id: string;
  user_id?: string;
  business_id: number;
  user_name: string;
  user_avatar_url: string;
  rating: number; // 1 to 5
  comment: string;
  submitted_date: string; // ISO
  status: ReviewStatus;
  reply?: {
    content: string;
    replied_date: string; // ISO
  };
}

// Working hours types
export interface WorkingHourRange {
  open: string; // e.g. "09:00"
  close: string; // e.g. "17:30"
  isOpen?: boolean;
}

export type WorkingHour = WorkingHourRange | string | null;

export type WorkingHours = {
  [day: string]: WorkingHour; // e.g. 'monday', 'tuesday' or 'mon', 'tue'
};

// Staff permissions shared type for hooks/components
export interface StaffPermissions {
  canEditLandingPage?: boolean;
  canEditBlog?: boolean;
  canManageMedia?: boolean;
  canManageServices?: boolean;
  isStaffMember?: boolean;
  isBusinessOwner?: boolean;
  isOwner?: boolean; // alias
  hasAccess?: boolean;
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
    canEditLandingPage?: boolean;
    canEditBlog?: boolean;
    canManageMedia?: boolean;
    canManageServices?: boolean;
  };
  created_at: string;
  updated_at: string;
  // Optional fields from joined profiles
  user_email?: string;
  user_name?: string;
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
  reviewAlerts: boolean;
  bookingRequests: boolean;
  platformNews: boolean;
}

export interface Business {
  id: number;
  slug: string;
  name: string;
  logoUrl?: string;
  imageUrl: string;
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
  youtubeUrl?: string;
  rating: number;
  reviewCount: number;
  viewCount: number;
  membershipTier: MembershipTier;
  membershipExpiryDate?: string; // ISO
  isVerified: boolean;
  isActive: boolean;
  isFeatured?: boolean;
  joinedDate: string; // ISO string for sorting by newest
  description: string;
  workingHours?: WorkingHours | null;
  socials?: Socials;
  seo?: SEO;
  staff: StaffMember[]; // Kept as JSONB as it's tightly coupled 1-to-1
  notificationSettings: NotificationSettings; // Kept as JSONB
  heroSlides?: HeroSlide[];
  heroImageUrl?: string;
  landingPageConfig?: LandingPageConfig;
  trustIndicators?: TrustIndicator[];
  landingPageStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Needs Review';
  owner_id?: string; // UUID of the business owner (from auth.users)

  // --- RELATIONAL DATA ---
  // These will be populated by Supabase joins
  services?: Service[];
  deals?: Deal[];
  gallery?: MediaItem[];
  team?: TeamMember[];
  reviews?: Review[];
  businessBlogPosts?: BusinessBlogPost[]; // Business blog posts
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
  imageUrl: string;
  excerpt: string;
  author: string;
  date: string; // ISO or dd/mm/yyyy
  category: string;
  content: string;
  viewCount: number;
  status: 'Draft' | 'Published';
  isFeatured?: boolean;
  seo?: {
    title: string;
    description: string;
    keywords: string;
  };
  updatedAt?: string;
}

export interface BlogComment {
  id: string;
  postId: number;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  date: string; // ISO
}

export interface BusinessBlogPost {
  id: string;
  businessId: number;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  content: string;
  author: string;
  createdDate: string; // ISO
  publishedDate?: string; // ISO
  status: BusinessBlogPostStatus;
  viewCount: number;
  isFeatured?: boolean;
  seo?: SEO;
}


export interface RegistrationRequest {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  category: BusinessCategory;
  address: string;
  tier: MembershipTier;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

export interface AdminPermissions {
  canViewAnalytics: boolean;
  canManageBusinesses: boolean;
  canManageRegistrations: boolean;
  canManageOrders: boolean;
  canManagePlatformBlog: boolean;
  canManageUsers: boolean;
  canManagePackages: boolean;
  canManageAnnouncements: boolean;
  canManageSupportTickets: boolean;
  canManageSiteContent: boolean;
  canManageSystemSettings: boolean;
  canUseAdminTools: boolean;
  canViewActivityLog: boolean;
  canViewEmailLog: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  password?: string;
  role: AdminUserRole;
  permissions: AdminPermissions;
  lastLogin?: string;
  isLocked: boolean;
}

// AuthenticatedAdmin extends AdminUser with auth user
// Note: authUser type is from Supabase Auth, using any to avoid circular dependency
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthenticatedAdmin extends AdminUser {
  authUser: SupabaseUser; // Supabase User type from @supabase/supabase-js
}

export interface Profile {
  id: string; // Corresponds to auth.users.id
  updatedAt?: string;
  fullName?: string;
  avatarUrl?: string;
  email?: string;
  userType?: string; // Standardized: 'user', 'business', 'admin'
  businessId?: number; // Link to the business this user owns/manages
  favorites?: number[]; // Array of business IDs
}

export interface MembershipPackage {
  id: string;
  tier: MembershipTier;
  name: string;
  price: number;
  durationMonths: number;
  description: string;
  features: string[];
  permissions: {
    photoLimit: number;
    videoLimit: number;
    featuredLevel: number;
    customLandingPage: boolean;
    privateBlog: boolean;
    seoSupport: boolean;
    monthlyPostLimit: number;
    featuredPostLimit: number;
  };
  isPopular: boolean;
  isActive: boolean;
}

export interface Order {
  id: string;
  businessId: number;
  businessName: string;
  packageId: string;
  packageName: string;
  amount: number;
  status: OrderStatus;
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Simulated Gateway';
  submittedAt: string;
  confirmedAt?: string;
  notes?: string;
  paymentProofUrl?: string;
}

export interface Appointment {
  id: string;
  businessId: number;
  serviceId: string;
  serviceName: string;
  staffMemberId?: string; // Optional for now
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // "YYYY-MM-DD"
  timeSlot: string; // "HH:MM"
  status: AppointmentStatus;
  notes?: string;
  createdAt: string; // ISO
}


export interface AnalyticsDataPoint {
  date: string; // "YYYY-MM-DD"
  pageViews: number;
  contactClicks: number;
  callClicks: number;
  directionClicks: number;
}

export interface TrafficSource {
  source: 'Google' | 'Homepage' | 'Blog' | 'Direct Search';
  percentage: number;
}

export interface BusinessAnalytics {
  businessId: number;
  timeSeries: AnalyticsDataPoint[];
  trafficSources: TrafficSource[];
  averageTimeOnPage: number; // in seconds
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

// Admin specific types that are not in database
export interface AdminLogEntry {
  id: string;
  timestamp: string; // ISO
  adminUsername: string;
  action: string;
  details: string;
}

export interface Notification {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string; // ISO
  read: boolean;
}

export type AdminPageTab = 'dashboard' | 'analytics' | 'businesses' | 'registrations' | 'orders' | 'blog' | 'users' | 'packages' | 'content' | 'homepage' | 'settings' | 'tools' | 'activity' | 'notifications' | 'announcements' | 'support' | 'theme' | 'abuse-reports' | 'landing-page-moderation';

// FIX: Correct HeroSlideItem to HeroSlide
export interface HeroSlide {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export interface HomepageSection {
  id: string;
  type: 'featuredBusinesses' | 'featuredDeals' | 'featuredBlog' | 'exploreByLocation';
  title: string;
  subtitle: string;
  visible: boolean;
}

export interface HomepageData {
  heroSlides: HeroSlide[];
  sections: HomepageSection[];
}

// FIX: Add missing type definitions.
export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferNote: string;
}

export interface AppSettings {
  siteName?: string;
  supportEmail?: string;
  maintenanceMode?: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  colors?: {
    primary?: string;
    primaryDark?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    neutralDark?: string;
  };
  seoDefaults?: {
    defaultTitle?: string;
    defaultDescription?: string;
    defaultKeywords?: string;
  };
  emailConfig?: {
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
  };
  bankDetails: BankDetails;
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
  createdAt: string; // ISO
  created_at?: string; // from Supabase
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
  createdAt: string; // ISO
}

export interface SupportTicket {
  id: string;
  businessId: number;
  businessName: string;
  subject: string;
  message: string;
  status: TicketStatus;
  createdAt: string; // ISO
  lastReplyAt: string; // ISO
  replies: TicketReply[];
}

export interface ThemeSettings {
  logoUrl: string;
  faviconUrl: string;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    background: string;
    neutralDark: string;
  };
  fonts: {
    sans: string;
    serif: string;
  };
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

export type PageName = 'about' | 'contact' | 'homepage';

export interface PageData {
  layout: LayoutItem[];
  visibility: { [key: string]: boolean };
}