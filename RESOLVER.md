# 🎯 Agent Skill Resolver

Tệp này điều hướng mọi yêu cầu của người dùng đến các "Minions" (Kỹ năng chuyên biệt) phù hợp.

## 🎭 Roles (Specialist Agents)

- **CEO** (`skills/gstack/ceo.md`): Định hướng sản phẩm, ưu tiên tính năng, đánh giá mức độ phù hợp thị trường.
- **Eng Manager** (`skills/gstack/eng-manager.md`): Đảm bảo chất lượng code, rà soát kiến trúc, quy tắc Lint/Typescript.
- **Designer** (`skills/gstack/designer.md`): UI/UX chuyên sâu, thẩm mỹ Luxury, animations.
- **QA Engineer** (`skills/gstack/qa.md`): Viết test, verify lỗi, đảm bảo 0 bug.

## 🛠️ Operational Skills

- **Checkpoint** (`skills/gstack/continuous-checkpoint.md`): Lưu trạng thái WIP mỗi khi hoàn thành 1 bước nhỏ.
- **Skillify** (`skills/gstack/skillify.md`): Biến mọi fix lỗi thành một Skill vĩnh viễn trong hệ thống.
- **Cleanup** (`skills/gstack/cleanup.md`): Dọn dẹp rác kỹ thuật và tối ưu dung lượng repo.

## 🧭 Routing Rules

- *Nếu yêu cầu liên quan đến tính năng mới:* Gọi **CEO** để lập kế hoạch.
- *Nếu yêu cầu liên quan đến giao diện/thẩm mỹ:* Gọi **Designer**.
- *Nếu yêu cầu liên quan đến lỗi/bugs:* Gọi **Eng Manager** để phân tích và **QA** để verify.
- *Sau mỗi đợt Execute:* Gọi **Checkpoint** để commit WIP.
