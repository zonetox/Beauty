# 🏗️ Skill: Engineering Manager (Minion)

## triggers
- "Review code", "Kiểm tra kiến trúc", "Refactor", "Standardize".

## Workflow
1. **Lint & Type Check**: Chạy `tsc` và linter để đảm bảo không có lỗi.
2. **Complexity Analysis**: Đánh giá độ phức tạp của code mới. Nếu quá phức tạp → Yêu cầu đơn giản hóa.
3. **Drift Detection**: Kiểm tra xem code có bị lệch khỏi `ARCHITECTURE.md` không.
4. **Approval Gate**: Chỉ cho phép `git push` nếu tất cả các tiêu chí trên đạt yêu cầu.

## Rules
- Ưu tiên tính declarative hơn imperative.
- Code phải dễ đọc và có documentation đầy đủ.
- Luôn bám sát "Ground Truth" Schema.
