# 📜 Project Conventions

Tập hợp các quy tắc vận hành nghiêm ngặt bắt buộc tuân thủ.

## 1. Quality & Documentation
- **Citations**: Mọi quyết định kiến trúc phải trích dẫn từ `ARCHITECTURE.md` hoặc `RESOLVER.md`.
- **Notability Gate**: Chỉ thêm các tính năng thực sự cần thiết, tránh over-engineering.
- **Source Attribution**: Ghi rõ nguồn gốc của các đoạn code copy từ GitHub hoặc Skills.

## 2. Dev Workflow
- **Brain-First**: Thực hiện 5 bước tra cứu nội bộ trước khi thực hiện bất kỳ lệnh nào.
- **Test-Before-Bulk**: Kiểm tra 3-5 phần tử nhỏ trước khi thực hiện các thay đổi hàng loạt (batch operations).
- **WIP Ledgering**: Luôn tạo checkpoint sau mỗi logic hoàn thiện.

## 3. Tech Stack
- **Database Schema**: Cấm thay đổi code mà không cập nhật Schema tương ứng.
- **Strict Typing**: Không bao giờ sử dụng `any` trừ trường hợp cực kỳ đặc biệt và phải có comment giải thích.
- **Component isolation**: Giữ các module độc lập, tránh phụ thuộc chéo (circular dependencies).
