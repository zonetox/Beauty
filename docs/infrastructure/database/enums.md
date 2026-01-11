# Enum Types

**Last Updated:** 2025-01-11  
**Source:** Supabase Database (read via MCP)  
**Note:** Enum values are listed EXACTLY as they exist in the database. No normalization or renaming.

---

## Enum Type: `admin_user_role`

**Values:**
- `Admin`
- `Moderator`
- `Editor`

**Used in:**
- `admin_users.role` (default: `'Editor'`)

---

## Enum Type: `appointment_status`

**Values:**
- `Pending`
- `Confirmed`
- `Cancelled`
- `Completed`

**Used in:**
- `appointments.status` (default: `'Pending'`)

---

## Enum Type: `business_blog_post_status`

**Values:**
- `Draft`
- `Published`

**Used in:**
- `business_blog_posts.status` (default: `'Draft'`)

---

## Enum Type: `business_category`

**Values:**
- `Spa & Massage`
- `Hair Salon`
- `Nail Salon`
- `Beauty Clinic`
- `Dental Clinic`

**Used in:**
- `businesses.categories` (ARRAY type)
- `registration_requests.category`

**Note:** Enum value `'Spa & Massage'` contains an ampersand character.

---

## Enum Type: `deal_status`

**Values:**
- `Active`
- `Expired`
- `Scheduled`

**Used in:**
- `deals.status` (default: `'Active'`)

---

## Enum Type: `media_category`

**Values:**
- `Uncategorized`
- `Interior`
- `Exterior`
- `Staff`
- `Products`

**Used in:**
- `media_items.category` (default: `'Uncategorized'`)

---

## Enum Type: `media_type`

**Values:**
- `IMAGE`
- `VIDEO`

**Used in:**
- `media_items.type` (default: `'IMAGE'`)

---

## Enum Type: `membership_tier`

**Values:**
- `VIP`
- `Premium`
- `Free`

**Used in:**
- `businesses.membership_tier` (default: `'Free'`)
- `registration_requests.tier`

---

## Enum Type: `notification_type`

**Values:**
- `NEW_REVIEW`
- `APPOINTMENT_REQUEST`
- `APPOINTMENT_CONFIRMED`
- `APPOINTMENT_CANCELLED`
- `ORDER_CONFIRMED`
- `ORDER_REJECTED`
- `MEMBERSHIP_EXPIRING`
- `PLATFORM_ANNOUNCEMENT`

**Used in:**
- `notifications.type`

---

## Enum Type: `order_status`

**Values:**
- `Pending`
- `Awaiting Confirmation`
- `Completed`
- `Rejected`

**Used in:**
- `orders.status`

**Note:** Enum value `'Awaiting Confirmation'` contains a space character.

---

## Enum Type: `review_status`

**Values:**
- `Visible`
- `Hidden`

**Used in:**
- `reviews.status` (default: `'Visible'`)

---

## Enum Type: `staff_member_role`

**Values:**
- `Admin`
- `Editor`

**Used in:**
- NOT PRESENT IN DATABASE - Enum type exists but no columns use it

---

## Enum Type: `ticket_status`

**Values:**
- `Open`
- `In Progress`
- `Closed`

**Used in:**
- `support_tickets.status` (default: `'Open'`)

**Note:** Enum value `'In Progress'` contains a space character.

---

## Summary

**Total Enum Types:** 13

**Enum Types Used in Tables:**
- `admin_user_role` - Used in 1 column
- `appointment_status` - Used in 1 column
- `business_blog_post_status` - Used in 1 column
- `business_category` - Used in 2 columns (1 ARRAY)
- `deal_status` - Used in 1 column
- `media_category` - Used in 1 column
- `media_type` - Used in 1 column
- `membership_tier` - Used in 2 columns
- `notification_type` - Used in 1 column
- `order_status` - Used in 1 column
- `review_status` - Used in 1 column
- `staff_member_role` - **NOT USED** (enum exists but no columns use it)
- `ticket_status` - Used in 1 column

---

**END OF ENUMS DOCUMENTATION**
