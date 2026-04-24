# 🔄 Continuous Checkpoint Skill

## Triggers
- "Lưu trạng thái", "Checkpoint", "WIP commit", "Hoàn thành bước X".

## Workflow
1. **Analyze State**: Kiểm tra các thay đổi hiện tại trong mã nguồn.
2. **Context Logging**: Viết nội dung checkpoint vào `[gstack-context]`.
3. **Commit WIP**: 
   - Message: `WIP: [Tên bước] - {Mô tả ngắn}`.
   - Body: Bao gồm các quyết định vừa đưa ra và các việc còn tồn đọng.
4. **Push (Optional)**: Đẩy lên nhánh phụ nếu cần bảo vệ từ xa.

## Principles
- **Small & Frequent**: Checkpoint mỗi khi hoàn thành một logic nhỏ (ví dụ: xong 1 hàm, xong 1 file).
- **Recoverable**: Đảm bảo có thể dùng `/context-restore` để quay lại trạng thái này bất cứ lúc nào.
