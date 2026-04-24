# 📖 MASTER SOP: Quy Trình Vận Hành Agent-Team (G-Stack)

Tài liệu này hướng dẫn bạn cách phối hợp với Antigravity (dưới tư cách một Đội ngũ chuyên gia) để đưa ý tưởng từ bản thảo đến sản phẩm hoàn thiện.

---

## ⚡ Quy Trình 5 Bước Cơ Bản

### Bước 1: Khởi Tạo Ý Tưởng (CEO)
Khi bạn có một tính năng mới hoặc ý tưởng dự án:
- **Câu lệnh:** "Gọi CEO, tôi có ý tưởng về tính năng X. Hãy phân tích tính khả thi và ưu tiên nó."
- **Kết quả:** Bạn sẽ nhận được một bản phân tích yêu cầu (Requirements) và kế hoạch sơ bộ.

### Bước 2: Thiết Kế Trải Nghiệm (Designer)
Trước khi code, hãy định hình diện mạo:
- **Câu lệnh:** "Designer, hãy tạo bản phác thảo giao diện cho tính năng X theo phong cách Luxury."
- **Kết quả:** Designer sẽ đề xuất UI/UX, màu sắc, và flow người dùng (có thể kèm ảnh mockup).

### Bước 3: Lập Kế Hoạch Kỹ Thuật (Eng Manager)
Biến thiết kế thành cấu trúc mã nguồn:
- **Câu lệnh:** "Eng Manager, hãy lập phương án kỹ thuật và rà soát database schema cho tính năng này."
- **Kết quả:** Bạn nhận được `implementation_plan.md` chi tiết và các thay đổi SQL cần thiết.

### Bước 4: Thực Thi & Checkpoint (The Engine)
Quá trình xây dựng thực tế:
- **Quy trình:** Tôi sẽ code từng phần. Sau mỗi bước nhỏ thành công, tôi sẽ tự động gọi **Checkpoint** để lưu WIP commit.
- **Lưu ý:** Bạn có thể yêu cầu: "Ghi lại bài học này vào MemoryOS" nếu có vấn đề gì đáng giá.

### Bước 5: Kiểm Thử & Bàn Giao (QA & Ship)
Hoàn thiện 100%:
- **Câu lệnh:** "QA hãy xác minh tính năng X. Sau đó Eng Manager rà soát lại lỗi tsc và đẩy lên GitHub."
- **Kết quả:** Mã nguồn sạch 0 lỗi được cập nhật lên GitHub.

---

## 🛠️ Các Lệnh Vận Hành Cốt Lõi (Slash Commands)

- `/plan`: Lập kế hoạch tổng thể.
- `/review`: Rà soát chất lượng code hiện tại.
- `/ship`: Đóng gói và đẩy code lên production.
- `Skillify it!`: Lệnh yêu cầu tôi ghi nhớ vĩnh viễn một bài học hoặc quy trình mới.
- `Checkpoint`: Lưu trạng thái công việc ngay lập tức.

## 💡 Bí Quyết Để Có Code Chất Lượng Như Claude

1. **Luôn Review trước khi Ship:** Đừng ngại yêu cầu tôi: "Hãy rà soát kỹ như một Eng Manager thực thụ".
2. **Khai thác MemoryOS:** Luôn hỏi: "Bộ nhớ của bạn về module X hiện ra sao?" trước khi bắt đầu nhiệm vụ mới.
3. **Tuân thủ CONVENTIONS.md:** Đây là "hiến pháp" của dự án, hãy đảm bảo mọi thay đổi đều tuân theo nó.

---
*Tài liệu này được thiết kế để sử dụng cho dự án Beauty-main và mọi dự án tương lai của bạn.*
