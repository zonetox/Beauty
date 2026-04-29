---
name: "Royal Gold Heritage"
description: "Hệ thống thiết kế đẳng cấp thế giới cho 1Beauty.asia, tập trung vào Vàng Hoàng Gia, Đen Onyx và Ngọc Trai."
version: "1.0.0"

colors:
  primary: "#D4AF37"      # Vàng Hoàng Gia (Kim loại)
  primary-dark: "#B8934B" # Vàng Đậm
  secondary: "#121212"    # Đen Onyx (Sang trọng)
  background: "#FBF9F4"   # Ngọc Trai Champagne (Nền mềm mại)
  accent: "#C5A021"       # Vàng Đế Vương (Tương tác)
  neutral-dark: "#1A1A1A" # Than Chì Sâu
  luxury-border: "#E8E2D9" # Viền kim loại nhẹ
  white: "#FFFFFF"
  black: "#000000"

typography:
  h1:
    fontFamily: "Playfair Display"
    fontWeight: 700
    fontSize: "6rem"
  h2:
    fontFamily: "Playfair Display"
    fontWeight: 600
    fontSize: "3rem"
  body:
    fontFamily: "Instrument Sans"
    fontWeight: 400
    fontSize: "1rem"
  label:
    fontFamily: "Outfit"
    fontWeight: 600
    fontSize: "0.75rem"

rounded:
  sm: "4px"
  md: "12px"
  lg: "24px"
  luxury: "2rem"

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "32px"
  xl: "64px"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.luxury}"
    padding: "12px 32px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    rounded: "{rounded.luxury}"
    padding: "12px 32px"
  card-glass:
    backgroundColor: "rgba(255, 255, 255, 0.65)"
    backdropBlur: "20px"
    rounded: "{rounded.lg}"
    border: "1px solid {colors.luxury-border}"
---

## Tổng quan
Hệ thống thiết kế "Royal Gold Heritage" lấy cảm hứng từ các thương hiệu đồng hồ xa xỉ và spa cao cấp. Nó nhấn mạnh vào sự tương phản cao, kiểu chữ serif thanh lịch và các điểm nhấn bằng vàng kim loại. Hệ thống này tuyệt đối tránh các tông màu hồng hoặc đỏ, thay vào đó sử dụng màu nâu ấm hoặc đen sâu làm màu bổ trợ.

## Rationale Thiết kế
- **Vàng Hoàng Gia (#D4AF37)**: Đại diện cho sự uy tín và dịch vụ làm đẹp chất lượng cao. Được sử dụng cho các nút kêu gọi hành động (CTA), tiêu đề và các yếu tố thương hiệu chính.
- **Đen Onyx (#121212)**: Mang lại cảm giác cao cấp, vững chãi. Được sử dụng cho header, footer và văn bản có độ tương phản cao.
- **Ngọc Trai Champagne (#FBF9F4)**: Một sự thay thế ấm áp cho màu trắng thuần túy, tạo cảm giác sang trọng hơn.
- **Kiểu chữ**: Sự kết hợp giữa Playfair Display (Serif) và Instrument Sans (Sans) tạo ra sự cân bằng giữa truyền thống và sự chính xác hiện đại.

## Ngôn ngữ hình ảnh
- **Glassmorphism**: Được sử dụng cho các thẻ (cards) để tạo chiều sâu mà không gây rối mắt.
- **Bento Grids**: Được sử dụng để tổ chức thông tin phức tạp một cách sạch sẽ, mô-đun.
- **Chủ nghĩa tối giản**: Sử dụng nhiều khoảng trắng (hoặc không gian Ngọc Trai Champagne) để nội dung được "thở".
