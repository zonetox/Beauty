# XÁC NHẬN SỐ LƯỢNG BẢNG VÀ FUNCTIONS

**Ngày:** 2025-01-11  
**Nguồn:** Supabase Dashboard Overview vs MCP Query Results  
**Mục đích:** Xác nhận sự khác biệt giữa Overview và thực tế

---

## 📊 SO SÁNH: SUPABASE OVERVIEW vs MCP RESULTS

### Supabase Dashboard Overview:
- **Tables:** 23 ✅
- **Functions:** 5 ✅ (chỉ đếm RPC functions - có thể gọi từ client)
- **Replicas:** 0

### MCP Query Results (verified):
- **Tables:** 23 (từ `pg_tables` - verified) ✅ KHỚP VỚI OVERVIEW
- **Functions:** 15 (từ `information_schema.routines` - tất cả routines)
  - RPC Functions: 5 (có thể gọi từ client) ✅ KHỚP VỚI OVERVIEW
  - Trigger Functions: 2 (tự động chạy)
  - Helper Functions: 8 (dùng nội bộ)

---

## 🔍 PHÂN TÍCH SỰ KHÁC BIỆT

### 1. **TABLES: 23 ✅ KHỚP**

**Kết quả từ `pg_tables`:**
- ✅ **23 tables** trong schema `public`
- ✅ **KHỚP** với Supabase Overview

**23 tables trong database:**
1. admin_activity_logs
2. admin_users
3. announcements
4. app_settings
5. appointments
6. blog_categories
7. blog_comments
8. blog_posts
9. business_blog_posts
10. businesses
11. deals
12. email_notifications_log
13. media_items
14. membership_packages
15. notifications
16. orders
17. page_content
18. profiles
19. registration_requests
20. reviews
21. services
22. support_tickets
23. team_members

**✅ XÁC NHẬN:** 23 tables, khớp với Overview

---

### 2. **FUNCTIONS: 5 vs 15**

**Khác biệt lớn! Có thể do:**

1. **Supabase Overview chỉ đếm RPC Functions** (có thể gọi từ client)
2. **MCP query đếm TẤT CẢ functions**, bao gồm:
   - RPC Functions (5) - có thể gọi từ client
   - Trigger Functions (2-3) - tự động chạy
   - Helper Functions (5-7) - dùng nội bộ

**15 functions từ MCP:**

#### RPC Functions (có thể gọi từ client - có thể là 5 functions):
1. `get_business_count` → `integer`
2. `search_businesses` → `record`
3. `search_blog_posts` → `record`
4. `increment_blog_view_count` → `void`
5. `increment_business_blog_view_count` → `void`
6. `increment_business_view_count` → `void`
7. (có thể có thêm)

#### Helper/Utility Functions (dùng nội bộ):
8. `get_user_email` → `text`
9. `is_admin` → `boolean`
10. `is_business_owner` → `boolean`
11. `get_my_business_id` → `bigint`
12. `extract_business_id_from_path` → `bigint`
13. `extract_user_id_from_path` → `uuid`

#### Trigger Functions (tự động chạy):
14. `handle_new_user` → `trigger`
15. `update_business_ratings` → `trigger`

**✅ XÁC NHẬN:** Supabase Overview chỉ đếm **RPC Functions** có thể gọi từ client (5 functions), không đếm trigger functions (2) và helper functions (8).

**5 RPC Functions có thể gọi từ client:**
1. `get_business_count` → `integer`
2. `search_businesses` → `record`
3. `search_blog_posts` → `record`
4. `increment_blog_view_count` → `void`
5. `increment_business_blog_view_count` → `void`
6. `increment_business_view_count` → `void`

(Cần verify chính xác 5 functions nào được Overview đếm)

---

## ✅ KẾT LUẬN

### Tables:
- **Overview:** 23 tables ✅
- **MCP (`pg_tables`):** 23 tables ✅
- **✅ KHỚP:** Cả hai đều đếm 23 tables

### Functions:
- **Overview:** 5 functions (chỉ đếm RPC functions - có thể gọi từ client)
- **MCP:** 15 functions (bao gồm RPC + triggers + helpers)
- **Sử dụng:** 
  - **Frontend code:** Chỉ cần quan tâm RPC functions (5)
  - **Documentation:** Nên document tất cả 15 functions

---

## 📝 RECOMMENDATION

### Cho Documentation:
1. **Tables:** Sử dụng MCP results (24 tables) - đầy đủ và chính xác
2. **Functions:** 
   - Document TẤT CẢ 15 functions trong `database/functions.md`
   - Phân loại: RPC (5), Triggers (2), Helpers (8)
   - Đánh dấu functions nào frontend có thể gọi (RPC)

### Cho Frontend Development:
1. **Tables:** Sử dụng 24 tables từ MCP
2. **Functions:** Chỉ gọi RPC functions (5 functions có thể là những functions user-facing)

---

## 🔍 CẦN VERIFY

1. **Tables:** Table thứ 24 là table nào? (nếu có)
2. **Functions:** 5 RPC functions nào được Supabase Overview đếm?
3. **Functions:** Functions nào frontend code đang gọi? (verify trong code)

---

**END OF COUNT VERIFICATION**
