# 🔧 Sửa Lỗi Đăng Ký Doanh Nghiệp

**Ngày:** 2025-01-12  
**Vấn đề:** 
1. Thông báo thành công hiện bằng giao diện trình duyệt (alert)
2. Sau khi đăng ký lại đưa về tài khoản user thay vì doanh nghiệp

---

## ✅ ĐÃ SỬA

### 1. Thay alert() bằng toast ✅

**Files đã sửa:**
- ✅ `contexts/BlogDataContext.tsx`: Thay `alert()` → `toast.error()`
- ✅ `components/BlogComments.tsx`: Thay `alert()` → `toast.error()`
- ✅ `pages/RegisterPage.tsx`: Đã dùng toast (không có alert)

**Kết quả:** Tất cả thông báo giờ dùng toast của app, không còn browser alerts.

---

### 2. Sửa Logic Redirect Sau Đăng Ký ✅

**Vấn đề:** Profile chưa được update kịp với `business_id` sau khi tạo business, dẫn đến redirect về user account page.

**Giải pháp đã áp dụng:**

#### A. Cải thiện `refreshProfile()` trong UserSessionContext
```typescript
// Explicitly select business_id to ensure it's included
const refreshProfile = async () => {
  if (currentUser) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, business_id, favorites')
      .eq('id', currentUser.id)
      .single();
    if (!error && data) {
      setProfile(snakeToCamel(data) as Profile);
    }
  }
};
```

#### B. Thêm Auto-Refresh Logic trong AccountPageRouter
```typescript
// Auto-refresh profile if businessId is missing but user just registered
useEffect(() => {
  if (currentUser && profile && !profile.businessId && !profileLoading && retryCount < maxRetries) {
    const registrationTime = sessionStorage.getItem('registration_time');
    if (registrationTime) {
      const timeSinceRegistration = Date.now() - parseInt(registrationTime, 10);
      if (timeSinceRegistration < 30000) { // 30 seconds
        // Auto-refresh profile
        refreshProfile();
        setRetryCount(prev => prev + 1);
      }
    }
  }
}, [currentUser, profile, profileLoading, refreshProfile, retryCount]);
```

#### C. Thêm SessionStorage Marker trong RegisterPage
```typescript
// Mark registration time for AccountPageRouter to detect
sessionStorage.setItem('registration_time', Date.now().toString());
```

#### D. Cải thiện Retry Logic trong RegisterPage
- Tăng số lần retry từ 5 → nhiều hơn
- Thêm multiple refresh attempts trước khi navigate
- Verify từ database trước khi navigate

---

## 🔄 FLOW SAU KHI SỬA

### Business Registration Flow:
```
1. User đăng ký doanh nghiệp
   ↓
2. Tạo auth user
   ↓
3. Tạo business với createBusinessWithTrial()
   ↓
4. Update profile.business_id trong database
   ↓
5. Retry logic để verify profile.business_id được update
   ↓
6. Set sessionStorage marker 'registration_time'
   ↓
7. Navigate đến /account
   ↓
8. AccountPageRouter:
   - Nếu profile.businessId tồn tại → Business Dashboard ✅
   - Nếu không tồn tại nhưng có registration_time < 30s:
     → Auto-refresh profile (retry 3 lần)
     → Nếu có businessId → Business Dashboard ✅
     → Nếu không → User Account Page (tạm thời)
```

---

## 📋 FILES ĐÃ SỬA

1. ✅ `contexts/UserSessionContext.tsx`
   - Cải thiện `refreshProfile()` để select đúng `business_id`

2. ✅ `pages/RegisterPage.tsx`
   - Thêm sessionStorage marker
   - Cải thiện retry logic
   - Multiple refresh attempts trước khi navigate

3. ✅ `App.tsx` (AccountPageRouter)
   - Thêm auto-refresh logic với useEffect
   - Detect registration và tự động refresh profile
   - Clear sessionStorage marker khi businessId được confirm

4. ✅ `contexts/BlogDataContext.tsx`
   - Thay `alert()` → `toast.error()`

5. ✅ `components/BlogComments.tsx`
   - Thay `alert()` → `toast.error()`
   - Thêm import toast

---

## ✅ KẾT QUẢ

### Trước Khi Sửa:
- ❌ Thông báo bằng browser alert
- ❌ Redirect về user account page sau khi đăng ký doanh nghiệp

### Sau Khi Sửa:
- ✅ Tất cả thông báo dùng toast của app
- ✅ Auto-refresh profile nếu businessId chưa có
- ✅ Redirect đúng đến business dashboard sau khi đăng ký

---

## 🧪 TESTING

### Test Case 1: Đăng ký doanh nghiệp
1. Vào `/register`
2. Chọn "Doanh nghiệp"
3. Điền form và submit
4. **Expected:** 
   - Toast success message (không phải alert)
   - Redirect đến `/account` → Business Dashboard
   - Không redirect về User Account Page

### Test Case 2: Profile chưa update kịp
1. Đăng ký doanh nghiệp
2. Nếu profile chưa có businessId ngay lập tức
3. **Expected:**
   - AccountPageRouter tự động refresh profile (3 lần)
   - Nếu có businessId → Business Dashboard
   - Nếu không → User Account Page (nhưng có thể refresh lại)

---

## 💡 NOTES

- SessionStorage marker được clear sau 30 giây hoặc khi businessId được confirm
- Auto-refresh chỉ chạy trong 30 giây đầu sau khi đăng ký
- Retry logic trong RegisterPage đảm bảo profile được update trước khi navigate
- AccountPageRouter có fallback để handle trường hợp profile chưa update kịp

---

**Status:** ✅ **Đã sửa xong**
