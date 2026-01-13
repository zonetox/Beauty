# Ngrok Quick Start Guide

**Mục đích:** Expose localhost (http://localhost:3000) ra internet để test webhooks

---

## 🎯 Tại sao cần Ngrok?

Khi bạn chạy app local (`npm run dev`), app chỉ chạy trên `http://localhost:3000` - chỉ máy bạn truy cập được.

**Vấn đề:** Các dịch vụ bên ngoài (Supabase webhooks, payment gateways) không thể gọi về `localhost` của bạn.

**Giải pháp:** Ngrok tạo một URL công khai (ví dụ: `https://abc123.ngrok-free.app`) và forward tất cả traffic về `localhost:3000` của bạn.

---

## 📋 Các bước setup (Chi tiết)

### Bước 1: Install Ngrok

**Làm gì:** Tải và cài đặt Ngrok vào máy của bạn

**Cách làm:**
1. Truy cập: https://ngrok.com/download
2. Chọn phiên bản cho Windows/Mac/Linux
3. Tải file về và giải nén
4. (Tùy chọn) Thêm vào PATH để dùng lệnh `ngrok` từ bất kỳ đâu

**Kết quả:** Bạn có thể chạy lệnh `ngrok` trong terminal

---

### Bước 2: Get Authtoken

**Làm gì:** Lấy mã xác thực từ Ngrok để kết nối tài khoản

**Tại sao cần:**
- Ngrok miễn phí yêu cầu đăng ký tài khoản
- Authtoken để xác thực bạn là chủ tài khoản
- Không có authtoken thì không dùng được Ngrok

**Cách làm:**
1. Truy cập: https://dashboard.ngrok.com/get-started/your-authtoken
2. Đăng nhập hoặc đăng ký tài khoản (miễn phí)
3. Copy authtoken (dạng: `2abc123def456ghi789jkl012mno345pq_6R7s8T9u0V1w2X3y4Z5`)

**Kết quả:** Bạn có authtoken để cấu hình Ngrok

---

### Bước 3: Configure Ngrok

**Làm gì:** Cấu hình Ngrok với authtoken của bạn

**Lệnh:**
```bash
ngrok config add-authtoken YOUR_TOKEN
```

**Thay `YOUR_TOKEN` bằng:** Authtoken bạn đã copy ở bước 2

**Ví dụ:**
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq_6R7s8T9u0V1w2X3y4Z5
```

**Kết quả:** 
- Ngrok đã được cấu hình
- File config được lưu tại:
  - Windows: `%USERPROFILE%\.ngrok2\ngrok.yml`
  - Mac/Linux: `~/.ngrok2/ngrok.yml`

**Lưu ý:** Chỉ cần làm 1 lần, sau đó dùng mãi mãi

---

### Bước 4: Run Dev Server với Ngrok

**Làm gì:** Chạy cả Vite dev server VÀ Ngrok tunnel cùng lúc

**Lệnh:**
```bash
npm run dev:ngrok
```

**Script này sẽ:**
1. ✅ Start Vite dev server trên port 3000
2. ✅ Start Ngrok tunnel forward về port 3000
3. ✅ Hiển thị public URL (ví dụ: `https://abc123.ngrok-free.app`)
4. ✅ Lưu URL vào file `.ngrok-url` (để dùng cho automation)

**Kết quả:**
- App chạy local: `http://localhost:3000`
- App accessible từ internet: `https://abc123.ngrok-free.app`
- Web interface: `http://127.0.0.1:4040` (xem requests)

---

## 🔍 Ví dụ sử dụng

### Scenario 1: Test Supabase Webhook

**Trước khi có Ngrok:**
- ❌ Supabase không thể gọi về `localhost:3000`
- ❌ Webhook không hoạt động

**Sau khi có Ngrok:**
1. Chạy `npm run dev:ngrok`
2. Copy URL: `https://abc123.ngrok-free.app`
3. Trong Supabase Dashboard → Webhooks:
   - Set URL: `https://abc123.ngrok-free.app/api/webhook`
4. ✅ Webhook hoạt động!

### Scenario 2: Test Payment Gateway Webhook

**Tương tự:**
1. Chạy `npm run dev:ngrok`
2. Copy URL
3. Trong Stripe/PayPal dashboard:
   - Set webhook URL: `https://abc123.ngrok-free.app/api/stripe-webhook`
4. ✅ Payment webhooks hoạt động!

---

## 📊 So sánh

| Không có Ngrok | Có Ngrok |
|----------------|----------|
| ❌ Chỉ localhost | ✅ Public URL |
| ❌ Không test webhook được | ✅ Test webhook dễ dàng |
| ❌ Không share với team | ✅ Share URL với team |
| ❌ Không test mobile app | ✅ Test mobile app |

---

## ⚠️ Lưu ý quan trọng

1. **URL thay đổi mỗi lần restart** (free tier)
   - Mỗi lần chạy `npm run dev:ngrok`, URL mới
   - Cần update webhook URL trong dashboard

2. **Session có giới hạn** (free tier)
   - Mỗi session tối đa 2 giờ
   - Sau 2 giờ cần restart

3. **Public access**
   - URL là công khai, ai có URL đều truy cập được
   - Không share URL công khai
   - Dùng cho development/testing only

4. **HTTPS tự động**
   - Ngrok tự động cung cấp HTTPS
   - Không cần cấu hình SSL

---

## 🎯 Tóm tắt

**4 bước đơn giản:**

1. **Install:** Tải Ngrok từ https://ngrok.com/download
2. **Get Token:** Lấy authtoken từ https://dashboard.ngrok.com/get-started/your-authtoken
3. **Configure:** Chạy `ngrok config add-authtoken YOUR_TOKEN`
4. **Run:** Chạy `npm run dev:ngrok`

**Kết quả:** Bạn có public URL để test webhooks!

---

## 📚 Tài liệu thêm

- **Chi tiết:** `docs/NGROK_SETUP_GUIDE.md`
- **Development workflow:** `docs/DEVELOPMENT_WORKFLOW.md`

---

**END OF QUICK START**
