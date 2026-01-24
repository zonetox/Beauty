-- ============================================
-- REPAIR & BULK IMPORT: Tet 2026 Blog Season
-- Ensures schema compatibility and imports content
-- ============================================
-- 1. Ensure columns exist (Defensive Schema Update)
DO $$ BEGIN -- Add status column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'status'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN status TEXT DEFAULT 'Published' CHECK (status IN ('Draft', 'Published'));
END IF;
-- Add SEO column (JSONB is standard)
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'seo'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN seo JSONB DEFAULT '{"title": "", "description": "", "keywords": ""}'::JSONB;
END IF;
-- Add is_featured column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'is_featured'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
END IF;
-- Add updated_at column
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE table_name = 'blog_posts'
        AND column_name = 'updated_at'
) THEN
ALTER TABLE public.blog_posts
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END IF;
END $$;
-- 2. Clear previous attempts (Optional - to prevent duplicates if any went through)
-- DELETE FROM public.blog_posts WHERE category IN ('Spa Tết', 'Chăm Sóc Da', 'Nail & Móng', 'Chăm Sóc Tại Nhà', 'Quà Tặng', 'Tóc & Tạo Kiểu', 'Trang Điểm', 'Massage', 'Sức Khỏe', 'Lối Sống');
-- 3. Import Blog Posts with correct JSONB mapping
INSERT INTO public.blog_posts (
        title,
        slug,
        image_url,
        excerpt,
        author,
        category,
        content,
        status,
        is_featured,
        seo,
        date
    )
VALUES (
        'Top 5 Spa Đón Tết 2026 Tại TP.HCM',
        'top-5-spa-don-tet-2026-tp-hcm',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070',
        'Các địa điểm spa tốt nhất để làm đẹp đón Tết Nguyên Đán.',
        'Chuyên Gia Làm Đẹp',
        'Spa Tết',
        '<h2>Spa Thư Giãn Và Làm Đẹp Đón Tết 2026</h2><p>Trước thềm năm mới, việc chăm sóc bản thân tại spa là điều cần thiết để có diện mạng tươi tắn. Dưới đây là 5 spa hàng đầu tại TP.HCM:</p><h3>1. La Belle Spa</h3><p>Chuyên về liệu pháp thải độc da mặt và massage thư giãn với tinh dầu thiên nhiên.</p><h3>2. Herbal Spa</h3><p>Sử dụng thảo dược Đông y truyền thống kết hợp công nghệ hiện đại.</p><h3>3. Royal Luxury Spa</h3><p>Dịch vụ cao cấp với gói chăm sóc toàn diện trước Tết.</p><h3>4. Zen Garden Spa</h3><p>Không gian thiền định, giảm stress hiệu quả.</p><h3>5. Crystal Care Spa</h3><p>Trị liệu bằng đá quý và tinh thể tự nhiên.</p><p><strong>Lưu ý:</strong> Nên đặt lịch trước 1-2 tuần để có suất ưng ý.</p>',
        'Published',
        TRUE,
        '{"title": "Spa đón Tết 2026 TP.HCM", "description": "Top 5 spa làm đẹp đón Tết Nguyên Đán tại TP.HCM", "keywords": "spa tết, làm đẹp tết, thư giãn tết, spa TP.HCM"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Bí Quyết Chăm Sóc Da Cấp Tốc 7 Ngày Trước Tết',
        'bi-quyet-cham-soc-da-cap-toc-7-ngay-truoc-tet',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2087',
        'Lộ trình chăm sóc da khẩn cấp để có làn da rạng rỡ đón xuân.',
        'Bác Sĩ Da Liễu',
        'Chăm Sóc Da',
        '<h2>Lộ Trình 7 Ngày Cứu Cánh Cho Làn Da</h2><p>Chỉ còn một tuần trước Tết, làn da của bạn vẫn có thể cải thiện đáng kể với lộ trình khoa học:</p><h3>Ngày 1-2: Làm Sạch Sâu</h3><p>Tẩy trang kỹ + rửa mặt double cleansing + tẩy tế bào chết nhẹ nhàng.</p><h3>Ngày 3-4: Cấp Ẩm Tối Ưu</h3><p>Sử dụng mặt nạ cấp ẩm hàng ngày, serum HA, kem dưỡng ẩm đậm đặc.</p><h3>Ngày 5-6: Phục Hồi Và Sáng Da</h3><p>Vitamin C serum, mặt nạ sáng da, ngủ đủ giấc.</p><h3>Ngày 7: Dưỡng Da Cuối Cùng</h3><p>Dưỡng ẩm nhẹ, tránh thử sản phẩm mới, chuẩn bị trang điểm.</p><h3>Sản Phẩm Nên Có:</h3><ul><li>Kem dưỡng ẩm chứa ceramide</li><li>Serum vitamin C</li><li>Mặt nạ giấy cấp ẩm</li><li>Tinh chất HA</li></ul>',
        'Published',
        TRUE,
        '{"title": "Chăm sóc da cấp tốc Tết", "description": "Lộ trình 7 ngày chăm sóc da cấp tốc trước Tết", "keywords": "chăm sóc da tết, skincare cấp tốc, làm đẹp đón xuân"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Xu Hướng Nail Tết 2026 Cho Phụ Nữ Hiện Đại',
        'xu-huong-nail-tet-2026-cho-phu-nu-hien-dai',
        'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=2074',
        'Các mẫu nail hot nhất dịp Tết Bính Ngọ 2026.',
        'Nail Artist',
        'Nail & Móng',
        '<h2>Năm Mới - Móng Mới</h2><p>Móng tay đẹp là điểm nhấn không thể thiếu trong dịp Tết. Xu hướng nail Tết 2026 có những điểm mới sau:</p><h3>Màu Sắc Thịnh Hành</h3><p>Đỏ may mắn, vàng tài lộc, hồng đào phai, nude sang trọng kết hợp ánh kim.</p><h3>Họa Tiết Đặc Trưng</h3><ul><li>Hoa mai, hoa đào cách điệu</li><li>Hình ảnh con Ngựa (năm Bính Ngọ)</li><li>Hoa văn Á Đông hiện đại</li><li>Đính đá pha lê tinh tế</li></ul><h3>Kiểu Dáng Phổ Biến</h3><p>Móng oval, almond, stiletto ngắn. Mẫu french tip biến tấu with màu đỏ vàng.</p><h3>Lời Khuyên Chuyên Gia</h3><p>Nên làm nail trước Tết 3-4 ngày để sửa chữa kịp thời nếu cần. Chọn salon uy tín, đảm bảo vệ sinh.</p>',
        'Published',
        TRUE,
        '{"title": "Mẫu nail Tết 2026", "description": "Xu hướng nail Tết 2026 cho phụ nữ hiện đại", "keywords": "nail tết, mẫu nail đẹp, nail xu hướng, làm nail tết"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Công Thức Xông Hơi Mặt Tại Nhà Đón Tết',
        'cong-thuc-xong-hoi-mat-tai-nha-don-tet',
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070',
        'Hướng dẫn xông hơi mặt đơn giản với nguyên liệu tự nhiên.',
        'Chuyên Gia Thiên Nhiên',
        'Chăm Sóc Tại Nhà',
        '<h2>Xông Hơi Mặt - Bí Quyết Da Sáng Rạng Rỡ</h2><p>Xông hơi mặt là bước quan trọng giúp da sạch sâu và hấp thụ dưỡng chất tốt hơn.</p><h3>Công Thức Xông Hơi Mặt Đón Tết:</h3><h4>1. Xông Hơi Thảo Dược</h4><p>Nguyên liệu: Lá chanh, sả, gừng, tinh dầu bưởi.<br>Lợi ích: Se khít lỗ chân lông, diệt khuẩn.</p><h4>2. Xông Hơi Sữa Tươi</h4><p>Pha 200ml nước nóng với 50ml sữa tươi không đường.<br>Giúp da mềm mại, trắng sáng tự nhiên.</p><h4>3. Xông Hơi Trà Xanh</h4><p>Dùng lá trà xanh tươi hoặc túi trà.<br>Chống oxy hóa, giảm mụn, làm dịu da.</p><h3>Quy Trình 5 Bước:</h3><ol><li>Làm sạch mặt cơ bản</li><li>Xông hơi 10-15 phút (cách mặt 30cm)</li><li>Lấy nhân mụn nếu cần (dùng dụng cụ vô trùng)</li><li>Đắp mặt nạ dưỡng ẩm</li><li>Thoa toner và kem dưỡng</li></ol>',
        'Published',
        TRUE,
        '{"title": "Xông hơi mặt tại nhà Tết", "description": "Công thức xông hơi mặt đón Tết tại nhà", "keywords": "xông hơi mặt, chăm sóc da tại nhà, làm đẹp tự nhiên"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Set Quà Tết Cao Cấp Cho Phái Đẹp 2026',
        'set-qua-tet-cao-cap-cho-phai-dep-2026',
        'https://images.unsplash.com/photo-1556228578-9c360e1d8d34?q=80&w=2070',
        'Gợi ý những set quà làm đẹp sang trọng làm quà Tết.',
        'Chuyên Gia Mỹ Phẩm',
        'Quà Tặng',
        '<h2>Quà Tết Ý Nghĩa Cho Người Phụ Nữ Bạn Trân Quý</h2><p>Set quà làm đẹp cao cấp không chỉ là món quà mà còn là sự quan tâm tinh tế.</p><h3>Set Quà Spa Tại Gia</h3><p>Bao gồm: Tinh dầu massage, mặt nạ ngủ, nến thơm, muối tắm thảo dược, gua sha bằng đá.</p><h3>Bộ Dưỡng Da Cao Cấp</h3><ul><li>Serum chống lão hóa</li><li>Kem mắt đặc trị</li><li>Kem dưỡng ban đêm</li><li>Son dưỡng cao cấp</li></ul><h3>Combo Nước Hoa & Body Care</h3><p>Nước hoa signature kèm sữa tắm, lotion cùng mùi hương, tạo trải nghiệm đồng bộ.</p><h3>Set Chăm Sóc Toàn Diện</h3><p>Kết hợp skincare, makeup và dụng cụ làm đẹp trong hộp quà thiết kế sang trọng.</p><p><strong>Ngân sách gợi ý:</strong><br>• 1-3 triệu: Set cơ bản<br>• 3-7 triệu: Set trung cấp<br>• 7-15 triệu: Set cao cấp</p>',
        'Published',
        TRUE,
        '{"title": "Quà Tết cho phái đẹp 2026", "description": "Set quà làm đẹp cao cấp dịp Tết", "keywords": "quà tết làm đẹp, set quà mỹ phẩm, quà tặng phái đẹp"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Kiểu Tóc Đi Chúc Tết Hợp Từng Độ Tuổi',
        'kieu-toc-di-chuc-tet-hop-tung-do-tuoi',
        'https://images.unsplash.com/photo-1605497788044-5a32c7078486?q=80&w=2070',
        'Các kiểu tóc thời thượng và phù hợp khi đi chúc Tết.',
        'Stylist Tóc',
        'Tóc & Tạo Kiểu',
        '<h2>Tóc Đẹp - Tự Tin Đón Xuân</h2><p>Mái tóc đẹp giúp bạn tự tin trong những ngày đầu năm mới.</p><h3>Độ Tuổi 20-30</h3><p>Phù hợp với các kiểu trẻ trung, năng động:<br>• Tóc bob ngang vai<br>• Layer nhẹ nhàng<br>• Nhuộm highlights pastel nhẹ</p><h3>Độ Tuổi 30-40</h3><p>Ưu tiên sự thanh lịch, chỉn chu:<br>• Tóc lob (long bob)<br>• Uốn lọn nhẹ đuôi tóc<br>• Màu nâu trầm ấm</p><h3>Độ Tuổi 40-50</h3><p>Tạo sự trẻ trung nhưng vẫn trang nhã:<br>• Tóc ngắn layer mỏng<br>• Uốn xoăn nhẹ gốc<br>• Nhuộm màu che bạc tự nhiên</p><h3>Độ Tuổi 50+</h3><p>Sự gọn gàng, lịch sự:<br>• Kiểu tóc ngắn gọn<br>• Perm nhẹ tạo phồng<br>• Màu nâu đen tự nhiên</p><h3>Lưu Ý Chung:</h3><p>Cắt tóc trước Tết 1 tuần, gội đầu sạch sẽ trước khi đi chúc Tết, chuẩn bị một vài phụ kiện tóc đơn giản.</p>',
        'Published',
        TRUE,
        '{"title": "Kiểu tóc đi chúc Tết 2026", "description": "Các kiểu tóc đẹp đi chúc Tết hợp độ tuổi", "keywords": "kiểu tóc tết, tóc đẹp đón xuân, tạo kiểu tóc tết"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Trang Điểm Ngày Tết: Từ Công Sở Đến Tiệc Gia Đình',
        'trang-diem-ngay-tet-tu-cong-so-den-tiec-gia-dinh',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=2087',
        'Hướng dẫn makeup phù hợp các hoạt động ngày Tết.',
        'Makeup Artist',
        'Trang Điểm',
        '<h2>Makeup Đa Phong Cách Cho Ngày Tết</h2><p>Mỗi dịp trong ngày Tết cần một phong cách trang điểm khác nhau.</p><h3>Makeup Đi Chúc Tết Sáng Sớm</h3><p>Nhẹ nhàng, tự nhiên:<br>• Kem nền nhẹ<br>• Má hồng cam đào<br>• Son tint lì nhẹ màu<br>• Chân mày tự nhiên</p><h3>Trang Điểm Tiệc Gia Đình</h3><p>Ấm áp, thân thiện:<br>• Mắt nâu đồng nhẹ<br>• Đánh highlight nhẹ<br>• Son màu đỏ cam<br>• Kẻ mắt nâu thay vì đen</p><h3>Makeup Dự Tiệc Tối</h3><p>Long lanh, nổi bật:<br>• Mắt khói nhẹ màu vàng kim<br>• Đính sequin nhẹ đuôi mắt<br>• Son đỏ đậm hoặc đỏ rượu vang<br>• Contour rõ nét hơn</p><h3>Mẹo Giữ Makeup Cả Ngày:</h3><ul><li>Dùng primer trước khi makeup</li><li>Setting spray sau khi hoàn thiện</li><li>Mang theo son và phấn phủ để touch-up</li><li>Giấy thấm dầu trong túi xách</li></ul>',
        'Published',
        TRUE,
        '{"title": "Trang điểm ngày Tết 2026", "description": "Hướng dẫn trang điểm các dịp trong ngày Tết", "keywords": "trang điểm tết, makeup đón xuân, son màu tết"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Massage Thư Giãn Sau Những Ngày Tết Bận Rộn',
        'massage-thu-gian-sau-nhung-ngay-tet-ban-ron',
        'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?q=80&w=2070',
        'Các động tác massage giảm mệt mỏi sau kỳ nghỉ Tết.',
        'Chuyên Gia Massage',
        'Massage',
        '<h2>Hồi Phục Năng Lượng Sau Tết</h2><p>Sau những ngày Tết bận rộn, cơ thể cần được thư giãn và phục hồi.</p><h3>Massage Vùng Cổ Vai Gáy</h3><p>Động tác:<br>1. Day nhẹ vùng vai<br>2. Bấm huyệt hai bên gáy<br>3. Kéo giãn cổ nhẹ nhàng<br>4. Sử dụng con lăn massage</p><h3>Massage Chân Giảm Phù Nề</h3><p>Sau những ngày đi lại nhiều:<br>• Ngâm chân nước ấm với muối và gừng<br>• Massage từ ngón chân lên cổ chân<br>• Bấm huyệt lòng bàn chân<br>• Kê cao chân khi ngủ</p><h3>Massage Mặt Giảm Stress</h3><p>Kỹ thuật facial massage Nhật Bản:<br>• Massage theo chiều từ trong ra ngoài<br>• Ấn nhẹ các huyệt quanh mắt<br>• Vuốt dọc sóng mũi<br>• Massage vùng hàm</p><h3>Tự Massage Tại Nhà:</h3><p>Dầu massage: Dầu dừa + tinh dầu oải hương + tinh dầu bạc hà. Mỗi ngày 15 phút trước khi ngủ.</p>',
        'Draft',
        FALSE,
        '{"title": "Massage sau Tết 2026", "description": "Kỹ thuật massage thư giãn sau kỳ nghỉ Tết", "keywords": "massage thư giãn, giảm mệt mỏi sau tết, tự massage"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Chế Độ Ăn Giữ Dáng Trong Và Sau Tết',
        'che-do-an-giu-dang-trong-va-sau-tet',
        'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=2074',
        'Thực đơn khoa học để không tăng cân dịp lễ Tết.',
        'Chuyên Gia Dinh Dưỡng',
        'Sức Khỏe',
        '<h2>Ăn Uống Thông Minh, Vóc Dáng Thon Gọn</h2><p>Duy trì vóc dáng trong dịp Tết không khó nếu có kế hoạch hợp lý.</p><h3>Nguyên Tắc Ăn Uống Ngày Tết:</h3><ul><li>Ăn rau xanh trước khi ăn món chính</li><li>Hạn chế bánh chưng, bánh tét (1/2 cái/ngày)</li><li>Uống nhiều nước, trà xanh không đường</li><li>Ăn chậm, nhai kỹ</li></ul><h3>Thực Đơn Mẫu 1 Ngày:</h3><p><strong>Sáng:</strong> Cháo yến mạch + trứng luộc + rau củ<br><strong>Trưa:</strong> Cơm ít + canh + thịt nạc + nhiều rau<br><strong>Tối:</strong> Salad + súp + cá hấp<br><strong>Ăn vặt:</strong> Hạt dinh dưỡng, trái cây ít ngọt</p><h3>Mẹo Khi Đi Chúc Tết:</h3><p>• Chọn bánh mứt ít đường<br>• Uống trà không đường thay nước ngọt<br>• Ăn một ít đỗ xanh trước khi ăn bánh chưng<br>• Vận động nhẹ sau mỗi bữa ăn</p><h3>Detox Sau Tết:</h3><p>3 ngày sau Tết: Nước ép rau củ, sinh tố xanh, súp rau, tránh đồ dầu mỡ và bánh kẹo.</p>',
        'Published',
        TRUE,
        '{"title": "Giữ dáng ngày Tết 2026", "description": "Chế độ ăn giữ dáng trong và sau Tết", "keywords": "ăn kiêng tết, giữ dáng ngày tết, thực đơn tết"}'::JSONB,
        CURRENT_DATE
    ),
    (
        'Bí Quyết Ngủ Đủ Giấc Để Da Đẹp Trong Dịp Tết',
        'bi-quyet-ngu-du-giac-de-da-dep-trong-dip-tet',
        'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=2060',
        'Cách có giấc ngủ chất lượng dù lịch trình dày đặc ngày Tết.',
        'Chuyên Gia Giấc Ngủ',
        'Lối Sống',
        '<h2>Ngủ Ngon - Da Đẹp - Tết Vui</h2><p>Giấc ngủ đóng vai trò quan trọng trong việc giữ gìn nhan sắc dịp Tết.</p><h3>Tác Hại Của Thiếu Ngủ:</h3><ul><li>Quầng thâm mắt</li><li>Da xỉn màu, thiếu sức sống</li><li>Tăng tiết bã nhờn, dễ nổi mụn</li><li>Lão hóa nhanh hơn</li></ul><h3>Bí Quyết Ngủ Ngon Dù Bận Rộn:</h3><h4>Trước Khi Ngủ 1 Giờ:</h4><p>• Tắt thiết bị điện tử<br>• Uống trà hoa cúc hoặc sữa ấm<br>• Ngâm chân nước ấm<br>• Đọc sách nhẹ nhàng</p><h4>Tạo Môi Trường Ngủ Lý Tưởng:</h4><p>• Phòng tối, yên tĩnh<br>• Nhiệt độ mát mẻ (24-26°C)<br>• Sử dụng máy tạo độ ẩm<br>• Tinh dầu oải hương hoặc hoa nhài</p><h3>Giấc Ngủ Ngắn Chất Lượng:</h3><p>Nếu không ngủ đủ 8 tiếng, hãy ngủ trưa 20-30 phút. Đây là thời gian vàng để da phục hồi.</p><h3>Skincare Trước Khi Ngủ:</h3><p>Dù mệt mỏi đến đâu cũng phải:<br>1. Tẩy trang thật sạch<br>2. Dưỡng da cơ bản<br>3. Thoa kem mắt<br>4. Dưỡng ẩm kỹ</p><p><em>Giấc ngủ là mỹ phẩm tự nhiên tốt nhất!</em></p>',
        'Published',
        TRUE,
        '{"title": "Ngủ đủ giấc đón Tết", "description": "Bí quyết ngủ ngon để da đẹp dịp Tết", "keywords": "giấc ngủ đẹp da, ngủ ngon tết, chăm sóc da khi ngủ"}'::JSONB,
        CURRENT_DATE
    );