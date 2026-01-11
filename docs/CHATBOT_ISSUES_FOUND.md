# CHATBOT ISSUES FOUND & FIXES

**Date:** 2025-01-11  
**Status:** FIXED

---

## 🔍 VẤN ĐỀ PHÁT HIỆN

### 1. **Memory Leak - setTimeout không được cleanup** ⚠️ CRITICAL
- **Location:** `components/Chatbot.tsx` lines 77-88
- **Vấn đề:** 
  - Có 2 `setTimeout` trong `processUserMessage` nhưng không có cleanup
  - Nếu component unmount trước khi timeout chạy → memory leak
  - `navigate()` được gọi trong timeout → có thể gây warning nếu component đã unmount

### 2. **useEffect dependency issue** ⚠️ MINOR
- **Location:** `components/Chatbot.tsx` line 23
- **Vấn đề:**
  - `scrollToBottom` function được dùng trực tiếp trong dependency array
  - Nên wrap trong `useCallback` để tránh re-render không cần thiết

### 3. **Missing cleanup for timeouts** ⚠️ MINOR
- **Location:** `components/Chatbot.tsx` 
- **Vấn đề:**
  - Không có cleanup function trong useEffect để clear timeouts khi component unmount

---

## ✅ GIẢI PHÁP

1. **Sử dụng useRef để track timeouts và cleanup**
2. **Wrap scrollToBottom trong useCallback**
3. **Cleanup timeouts khi component unmount**

---

## 📝 FIXES APPLIED

- ✅ Fixed memory leak với setTimeout cleanup
- ✅ Optimized useEffect với useCallback
- ✅ Added proper cleanup on unmount
- ✅ Prevented navigation warnings

---

**Status:** All issues fixed and tested.
