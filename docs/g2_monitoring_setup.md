# G2 - Error Handling & Monitoring Setup Guide

**Mục đích:** Hướng dẫn setup error handling và monitoring cho production

---

## G2.1 - Frontend Error Boundary ✅ DONE

**Status:** ✅ Hoàn thành ở Phase D

**Deliverables:**
- `components/ErrorBoundary.tsx` - Global error boundary
- Wraps entire app trong `App.tsx`
- Provides fallback UI với error details
- Try Again và Refresh Page buttons

**Ghi chú:** ErrorBoundary hiện tại chỉ log vào console. Để production, nên integrate với error tracking service (Sentry, LogRocket, etc.)

---

## G2.2 - Backend Logging

### Edge Functions Logging

**Hiện trạng:**
- Edge Functions đã có `console.log` và `console.error`
- Logs được ghi vào Supabase Edge Functions logs

**Cải thiện cần thiết:**

1. **Structured Logging:**
   - Thêm log levels (info, warn, error)
   - Thêm request ID cho tracing
   - Thêm timestamp và context

2. **Error Logging:**
   - Log errors với stack trace
   - Log request details (method, path, body)
   - Log response status

**Example improved logging:**
```typescript
// Improved logging helper
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data }),
  };
  
  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}
```

### Request Logging

**Hiện trạng:**
- Edge Functions không log requests systematically

**Cải thiện:**
- Log mỗi request với method, path, headers
- Log response status và duration
- Log errors với full context

---

## G2.3 - Supabase Logs

### Review Supabase Logs

**Cách xem logs:**
1. Vào Supabase Dashboard → Logs
2. Chọn log type:
   - **Edge Functions Logs:** Xem logs từ Edge Functions
   - **Database Logs:** Xem query logs, RLS policy violations
   - **Auth Logs:** Xem authentication events
   - **API Logs:** Xem REST API requests

**Log Types:**
- **Edge Functions:** Console logs từ functions
- **Database:** Query logs, slow queries, RLS violations
- **Auth:** Login attempts, signups, password resets
- **API:** REST API requests, responses

### Setup Log Monitoring

**Manual Monitoring:**
- Review logs hàng ngày/tuần
- Check for errors, warnings
- Monitor slow queries
- Check RLS policy violations

**Automated Monitoring (Future):**
- Setup alerts cho critical errors
- Monitor error rates
- Track performance metrics

---

## G2.4 - Alerts

### Critical Error Alerts

**Cần setup alerts cho:**
1. **Edge Functions errors:**
   - Function crashes
   - High error rate (> 5% requests fail)
   - Timeout errors

2. **Database errors:**
   - Connection failures
   - Query timeouts
   - RLS policy violations (nếu unexpected)

3. **Auth errors:**
   - High failed login attempts
   - Account lockouts
   - Suspicious activity

### Performance Alerts

**Cần setup alerts cho:**
1. **Slow queries:**
   - Queries > 1 second
   - High query count
   - Missing indexes

2. **Edge Functions performance:**
   - Functions > 5 seconds
   - High memory usage
   - Timeout errors

### Security Alerts

**Cần setup alerts cho:**
1. **Unauthorized access attempts:**
   - Failed RLS policy checks
   - Admin login failures
   - Suspicious API requests

2. **Data breaches:**
   - Unusual data access patterns
   - Cross-tenant data access attempts
   - Admin privilege escalation attempts

---

## 📋 IMPLEMENTATION CHECKLIST

### G2.2 - Backend Logging
- [ ] Improve Edge Functions logging (structured logging)
- [ ] Add request logging
- [ ] Add error logging với context
- [ ] Document logging format

### G2.3 - Supabase Logs
- [ ] Document cách review logs
- [ ] Setup log retention policy
- [ ] Create log review checklist
- [ ] Document common log patterns

### G2.4 - Alerts
- [ ] Document alert requirements
- [ ] Setup manual alert checklist
- [ ] Document cách setup automated alerts (future)
- [ ] Create alert response procedures

---

## 🔧 SQL SCRIPTS

### G2.3 - Log Monitoring Queries

**File:** `database/verifications/g2.3_log_monitoring_queries.sql`

**Mục đích:** Queries để monitor logs và errors

**Nội dung:**
- Query để check recent errors
- Query để check slow queries
- Query để check RLS violations
- Query để check auth failures

---

## 📝 NOTES

1. **Logging Strategy:**
   - Frontend: ErrorBoundary logs to console (có thể integrate với error tracking service)
   - Backend: Edge Functions logs to Supabase logs
   - Database: Supabase tự động log queries

2. **Monitoring Strategy:**
   - Manual: Review logs hàng ngày/tuần
   - Automated: Setup alerts (future enhancement)

3. **Error Tracking:**
   - Hiện tại: Console logs
   - Production: Nên integrate với Sentry, LogRocket, hoặc similar service

---

**Last Updated:** 2025-01-06






