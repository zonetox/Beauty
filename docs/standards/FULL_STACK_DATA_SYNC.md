# HỆ THỐNG ĐỒNG BỘ DỮ LIỆU FULL-STACK (FRONTEND - BACKEND - DATABASE)
*Tài liệu tiêu chuẩn để ngăn chặn lỗi lệch dữ liệu và "Silent Failures"*

## 1. Vấn đề cốt lõi
Lỗi lệch dữ liệu xảy ra khi có sự không nhất quán giữa 3 tầng:
1.  **Frontend**: Gửi một kiểu dữ liệu (ví dụ: `user_type`).
2.  **Backend/API**: Không nhận hoặc xử lý sai (ví dụ: Trigger không bắt được `user_type`).
3.  **Database**: Thiếu cột lưu trữ (ví dụ: Bảng `profiles` thiếu cột `user_type`).

Hậu quả: Lỗi "Silent" (Code chạy không báo lỗi nhưng dữ liệu sai), User bị logout, Hệ thống không ổn định.

---

## 2. Giải pháp 1: Hệ thống "Type-Safe Manual" (Đã áp dụng cho dự án này)
Đây là giải pháp tốt nhất khi bạn dùng Supabase trực tiếp mà không qua một Backend riêng biệt (Node.js/Go) hoặc ORM.

### Kiến trúc tiêu chuẩn
1.  **Database là "Source of Truth"**: Cấu trúc DB là gốc.
2.  **Generated Types**: Dùng tool để tạo TypeScript types từ DB.
3.  **Zod Schema**: Dùng làm cầu nối validation ở Runtime (Frontend & API).

### Quy trình 4 bước (Bắt buộc tuân thủ)
Mỗi khi thêm một tính năng mới (ví dụ: Thêm trường "Ngày sinh"):

1.  **BƯỚC 1: Database First (Migration)**
    *   Luôn viết SQL Migration trước hoặc sửa trên Dashboard.
    *   Đảm bảo có cột `birthday` trong bảng `profiles`.
    *   *Quy tắc*: `NOT NULL` nếu bắt buộc, có `DEFAULT` nếu cần.

2.  **BƯỚC 2: Cập nhật Types**
    *   Chạy lệnh để update file types (trong dự án này là `types/supabase.ts`).
    *   Lệnh gợi ý: `npx supabase gen types typescript --project-id "$PROJECT_ID" > types/supabase.ts`

3.  **BƯỚC 3: Cập nhật Validation Schema (Zod)**
    *   Vào file schema (ví dụ `lib/schemas/profile.schema.ts`).
    *   Thêm trường `birthday` vào Zod object.
    *   Frontend Form sẽ tự động báo lỗi đỏ nếu thiếu trường này nhờ TypeScript.

4.  **BƯỚC 4: Sync Check (Tự động hóa)**
    *   Chạy script `scripts/check-schema-sync.ts` trước khi deploy.
    *   Script này sẽ báo lỗi nếu Zod Schema có trường `birthday` mà Database lại chưa có.

---

## 3. Giải pháp 2: Hệ thống "Hiện đại hóa" (Khuyên dùng cho dự án mới)
Nếu bạn bắt đầu một dự án mới và muốn **loại bỏ hoàn toàn** nỗi lo này thủ công, hãy dùng Stack công nghệ sau. Nó sẽ tự động đồng bộ 100%.

### A. Drizzle ORM / Prisma (Thay thế SQL tay)
Thay vì viết SQL `CREATE TABLE`, bạn viết Code TypeScript để định nghĩa bảng.
*   **Ví dụ (Drizzle)**:
    ```typescript
    export const users = pgTable('users', {
      id: serial('id').primaryKey(),
      name: text('name'),
      role: text('role').default('user'), // Code chính là DB Schema
    });
    ```
*   **Lợi ích**: Khi bạn sửa code này, DB tự động cập nhật (qua lệnh `push`). Không bao giờ có chuyện lệch pha.

### B. tRPC (Thay thế REST API thủ công)
Đây là công nghệ "End-to-end Type Safety".
*   **Backend**: Viết hàm `getUser` trả về `{ name: string, role: string }`.
*   **Frontend**: Gọi `trpc.getUser.query()`.
*   **Lợi ích**: Frontend **tự động biết** dữ liệu trả về có `role` hay không. Nếu Backend sửa `role` thành `user_role`, Frontend sẽ **báo lỗi đỏ ngay lập tức** lúc code (không cần chờ chạy thử mới lỗi).

---

## 4. Checklist "Chống Lỗi" (Dành cho Developer)
In bảng này ra và yêu cầu Dev (hoặc chính bạn) tick vào mỗi khi code xong 1 feature.

| Bước | Hành động | Kiểm tra |
| :--- | :--- | :--- |
| **1. DB** | Đã tạo cột trong Database chưa? | [ ] Check Table |
| **2. Types** | Đã cập nhật file `types.ts` chưa? | [ ] Check File |
| **3. Schema**| Đã update Zod Schema chưa? | [ ] Check Validation |
| **4. Func** | Logic Backend (Trigger/RPC) có nhận biến mới không? | [ ] Check SQL Function |
| **5. Props** | Component Frontend có truyền đúng tên biến không? | [ ] Check TypeScript Error |

---

## 5. Tổng kết lời khuyên (Sau 3 tháng debug)
Nguyên nhân bạn mất 3 tháng là do **sự rời rạc**: Frontend code một đằng, Database sửa một nẻo, và không có "Cảnh sát giao thông" (Validation) đứng giữa.

**Để code tốt hơn:**
1.  **Đừng tin tưởng dữ liệu Frontend**: Luôn validate lại ở Backend hoặc Database (Constraint).
2.  **Atomic (Nguyên khối)**: Đừng chia nhỏ quy trình quan trọng (như Đăng ký) thành nhiều trang rời rạc nếu không cần thiết. Gom lại thành 1 Transaction.
3.  **Strict Mode**: Luôn bật TypeScript `strict: true`. Thà sửa lỗi lúc code còn hơn để bug lọt xuống user.
