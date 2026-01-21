/**
 * Business Creation & Trial Management Utilities
 * 
 * Centralized logic for:
 * - Business creation with trial initialization
 * - Trial expiry handling
 * - Membership tier management
 * - Business activation when order is completed (paid packages)
 * 
 * This is the SINGLE SOURCE OF TRUTH for business lifecycle operations.
 * All business creation and trial logic should use these functions.
 */

import { supabase } from './supabaseClient.ts';
import { Business, MembershipTier, MembershipPackage } from '../types.ts';

/**
 * Generate a unique slug from business name
 */
export function generateBusinessSlug(businessName: string): string {
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim() + `-${Date.now()}`;
}

/**
 * Calculate trial expiry date (30 days from now)
 */
export function calculateTrialExpiryDate(): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);
  return expiryDate.toISOString();
}

/**
 * Initialize trial membership for a business
 * Sets: membership_tier = 'Premium', membership_expiry_date = now() + 30 days
 * 
 * @param businessId - The business ID to initialize trial for
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function initializeTrial(businessId: number): Promise<boolean> {
  try {
    const expiryDate = calculateTrialExpiryDate();

    const { error } = await supabase
      .from('businesses')
      .update({
        membership_tier: MembershipTier.PREMIUM,
        membership_expiry_date: expiryDate,
        is_active: true,
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error initializing trial:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception initializing trial:', error);
    return false;
  }
}

/**
 * Check and handle trial expiry
 * If business has Premium tier and expiry date has passed, downgrade to Free
 * 
 * @param businessId - The business ID to check
 * @returns Promise<boolean> - true if downgraded, false otherwise
 */
export async function checkAndHandleTrialExpiry(businessId: number): Promise<boolean> {
  try {
    // Fetch current business data
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id, membership_tier, membership_expiry_date')
      .eq('id', businessId)
      .single();

    if (fetchError || !business) {
      console.error('Error fetching business for expiry check:', fetchError);
      return false;
    }

    const now = new Date();
    const expiryDate = business.membership_expiry_date
      ? new Date(business.membership_expiry_date)
      : null;

    // Check if trial has expired
    if (
      business.membership_tier === MembershipTier.PREMIUM &&
      expiryDate &&
      expiryDate < now
    ) {
      // Downgrade to Free
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          membership_tier: MembershipTier.FREE,
          membership_expiry_date: null,
          // Do NOT set is_active = false (requirement: do not deactivate)
        })
        .eq('id', businessId);

      if (updateError) {
        console.error('Error downgrading expired trial:', updateError);
        return false;
      }

      return true; // Successfully downgraded
    }

    return false; // No downgrade needed
  } catch (error) {
    console.error('Exception checking trial expiry:', error);
    return false;
  }
}

/**
 * Create a new business with trial initialization
 * This is the CENTRALIZED business creation function.
 * 
 * @param businessData - Partial business data (must include: name, owner_id, email, phone, address, categories)
 * @returns Promise<Business | null> - Created business or null if failed
 */
export async function createBusinessWithTrial(
  businessData: {
    name: string;
    owner_id: string;
    email?: string;
    phone: string;
    address: string;
    categories: string[];
    description?: string;
    city?: string;
    district?: string;
    ward?: string;
    image_url?: string;
  }
): Promise<Business | null> {
  try {
    const slug = generateBusinessSlug(businessData.name);
    const expiryDate = calculateTrialExpiryDate();

    // Prepare business insert data
    const newBusiness = {
      name: businessData.name.trim(),
      slug: slug,
      owner_id: businessData.owner_id,
      email: businessData.email || null,
      phone: businessData.phone.trim(),
      address: businessData.address.trim(),
      city: businessData.city || 'Ho Chi Minh',
      district: businessData.district || 'District 1',
      ward: businessData.ward || 'Ben Nghe',
      categories: businessData.categories,
      description: businessData.description || `Welcome to ${businessData.name.trim()}`,
      image_url: businessData.image_url || `https://via.placeholder.com/400x300/E6A4B4/FFFFFF?text=${encodeURIComponent(businessData.name.substring(0, 20))}`,
      // Trial initialization
      membership_tier: MembershipTier.PREMIUM,
      membership_expiry_date: expiryDate,
      is_active: true,
      is_verified: false,
      rating: 0,
      review_count: 0,
      view_count: 0,
      working_hours: { "Monday - Friday": "09:00 - 20:00" },
      joined_date: new Date().toISOString(),
    };

    const { data: createdBusiness, error: businessError } = await supabase
      .from('businesses')
      .insert(newBusiness as any) // Type assertion to bypass strict generated types
      .select()
      .single();

    if (businessError || !createdBusiness) {
      console.error('Error creating business:', businessError);
      return null;
    }

    // Update profile to link business_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ business_id: createdBusiness.id })
      .eq('id', businessData.owner_id);

    if (profileError) {
      console.error('Error linking profile to business:', profileError);
      // Business was created, but profile link failed - log but don't fail
    }

    // Type assertion needed because DB types don't match camelCase Business type
    return createdBusiness as any as Business;
  } catch (error) {
    console.error('Exception creating business with trial:', error);
    return null;
  }
}

/**
 * Activate business when order is completed (for paid packages, not trial)
 * This is called when an order status changes to COMPLETED.
 * 
 * @param businessId - The business ID to activate
 * @param packagePurchased - The membership package that was purchased
 * @param businessEmail - Business email for notifications
 * @param businessName - Business name for notifications
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function activateBusinessFromOrder(
  businessId: number,
  packagePurchased: MembershipPackage
): Promise<boolean> {
  try {
    // Calculate expiry date based on package duration
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + packagePurchased.durationMonths);

    const { error } = await supabase
      .from('businesses')
      .update({
        membership_tier: packagePurchased.tier,
        membership_expiry_date: expiryDate.toISOString(),
        is_active: true,
      })
      .eq('id', businessId);

    if (error) {
      console.error('Error activating business from order:', error);
      return false;
    }

    // Clear expiry notification flag
    localStorage.removeItem(`expiry_notification_sent_${businessId}`);

    // Note: Notification sending should be handled by the caller
    // (e.g., via AdminContext.addNotification or Edge Function)
    // This function only handles the business activation

    return true;
  } catch (error) {
    console.error('Exception activating business from order:', error);
    return false;
  }
}
