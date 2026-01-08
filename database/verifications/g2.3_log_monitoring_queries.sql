-- ============================================
-- G2.3 - Log Monitoring Queries
-- Tuân thủ Master Plan v1.1
-- Queries để monitor logs và errors trong Supabase
-- ============================================
--
-- LƯU Ý: Các queries này cần chạy trong Supabase SQL Editor
-- Hoặc có thể tạo views để dễ query hơn
-- ============================================

-- ============================================
-- 1. CHECK RECENT ERRORS IN ADMIN ACTIVITY LOGS
-- ============================================
-- Mục đích: Xem các errors gần đây trong admin activity logs
SELECT 
    id,
    admin_username,
    action,
    details,
    timestamp
FROM admin_activity_logs
WHERE action LIKE '%error%' OR action LIKE '%Error%' OR action LIKE '%ERROR%'
ORDER BY timestamp DESC
LIMIT 50;

-- ============================================
-- 2. CHECK EMAIL SENDING ERRORS
-- ============================================
-- Mục đích: Xem các email không gửi được
-- Note: Cần check Edge Functions logs để xem errors thực tế
SELECT 
    id,
    recipient_email,
    subject,
    sent_at,
    read
FROM email_notifications_log
WHERE sent_at IS NULL OR sent_at < NOW() - INTERVAL '1 day'
ORDER BY sent_at DESC NULLS LAST
LIMIT 50;

-- ============================================
-- 3. CHECK RECENT ADMIN ACTIONS
-- ============================================
-- Mục đích: Monitor admin activities
SELECT 
    admin_username,
    action,
    COUNT(*) as action_count,
    MAX(timestamp) as last_action
FROM admin_activity_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY admin_username, action
ORDER BY last_action DESC;

-- ============================================
-- 4. CHECK FOR SUSPICIOUS ACTIVITIES
-- ============================================
-- Mục đích: Detect suspicious admin activities
SELECT 
    admin_username,
    action,
    details,
    timestamp
FROM admin_activity_logs
WHERE 
    action IN ('DELETE', 'DELETE_USER', 'DELETE_BUSINESS', 'UPDATE_ADMIN_USER')
    AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- ============================================
-- 5. CHECK REGISTRATION APPROVAL ERRORS
-- ============================================
-- Mục đích: Xem các registration requests có vấn đề
SELECT 
    id,
    business_name,
    email,
    status,
    submitted_at
FROM registration_requests
WHERE 
    status = 'Pending'
    AND submitted_at < NOW() - INTERVAL '7 days'
ORDER BY submitted_at ASC;

-- ============================================
-- 6. CHECK FOR ORPHANED DATA
-- ============================================
-- Mục đích: Detect data integrity issues
-- Orphaned services (business_id không tồn tại)
SELECT 
    s.id,
    s.business_id,
    s.name
FROM services s
LEFT JOIN businesses b ON s.business_id = b.id
WHERE b.id IS NULL
LIMIT 10;

-- Orphaned deals
SELECT 
    d.id,
    d.business_id,
    d.title
FROM deals d
LEFT JOIN businesses b ON d.business_id = b.id
WHERE b.id IS NULL
LIMIT 10;

-- Orphaned reviews
SELECT 
    r.id,
    r.business_id,
    r.user_name
FROM reviews r
LEFT JOIN businesses b ON r.business_id = b.id
WHERE b.id IS NULL
LIMIT 10;

-- ============================================
-- 7. CHECK FOR DATA INCONSISTENCIES
-- ============================================
-- Mục đích: Detect data inconsistencies
-- Businesses với owner_id không tồn tại trong auth.users
SELECT 
    b.id,
    b.name,
    b.owner_id
FROM businesses b
WHERE b.owner_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = b.owner_id
  )
LIMIT 10;

-- Reviews với user_id không tồn tại
SELECT 
    r.id,
    r.user_id,
    r.business_id
FROM reviews r
WHERE r.user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = r.user_id
  )
LIMIT 10;

-- ============================================
-- 8. CHECK FOR PERFORMANCE ISSUES
-- ============================================
-- Mục đích: Detect potential performance issues
-- Businesses với nhiều services (có thể cần pagination)
SELECT 
    b.id,
    b.name,
    COUNT(s.id) as service_count
FROM businesses b
LEFT JOIN services s ON s.business_id = b.id
GROUP BY b.id, b.name
HAVING COUNT(s.id) > 50
ORDER BY service_count DESC;

-- Businesses với nhiều reviews
SELECT 
    b.id,
    b.name,
    COUNT(r.id) as review_count
FROM businesses b
LEFT JOIN reviews r ON r.business_id = b.id
GROUP BY b.id, b.name
HAVING COUNT(r.id) > 100
ORDER BY review_count DESC;

-- ============================================
-- 9. CHECK FOR SECURITY ISSUES
-- ============================================
-- Mục đích: Detect potential security issues
-- Admin users bị locked
SELECT 
    id,
    username,
    email,
    role,
    is_locked,
    last_login
FROM admin_users
WHERE is_locked = TRUE;

-- Businesses không active nhưng vẫn có data
SELECT 
    b.id,
    b.name,
    b.is_active,
    COUNT(s.id) as service_count,
    COUNT(d.id) as deal_count
FROM businesses b
LEFT JOIN services s ON s.business_id = b.id
LEFT JOIN deals d ON d.business_id = b.id
WHERE b.is_active = FALSE
GROUP BY b.id, b.name, b.is_active
HAVING COUNT(s.id) > 0 OR COUNT(d.id) > 0;

-- ============================================
-- 10. SUMMARY VIEW
-- ============================================
-- Mục đích: Tổng hợp thông tin monitoring
DO $$
DECLARE
    v_total_businesses INTEGER;
    v_active_businesses INTEGER;
    v_total_users INTEGER;
    v_total_reviews INTEGER;
    v_pending_registrations INTEGER;
    v_locked_admins INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_businesses FROM businesses;
    SELECT COUNT(*) INTO v_active_businesses FROM businesses WHERE is_active = TRUE;
    SELECT COUNT(*) INTO v_total_users FROM auth.users;
    SELECT COUNT(*) INTO v_total_reviews FROM reviews;
    SELECT COUNT(*) INTO v_pending_registrations FROM registration_requests WHERE status = 'Pending';
    SELECT COUNT(*) INTO v_locked_admins FROM admin_users WHERE is_locked = TRUE;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'System Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total Businesses: %', v_total_businesses;
    RAISE NOTICE 'Active Businesses: %', v_active_businesses;
    RAISE NOTICE 'Total Users: %', v_total_users;
    RAISE NOTICE 'Total Reviews: %', v_total_reviews;
    RAISE NOTICE 'Pending Registrations: %', v_pending_registrations;
    RAISE NOTICE 'Locked Admins: %', v_locked_admins;
    RAISE NOTICE '========================================';
END $$;






