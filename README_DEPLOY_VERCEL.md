# HƯỚNG DẪN TRIỂN KHAI ỨNG DỤNG KHBD AI PRO LÊN VERCEL

Ứng dụng **KHBD AI PRO** đã được tối ưu hóa cấu hình hoàn chỉnh để triển khai lên **Vercel**:
- ⚡ **Tốc độ mở web tức thì (< 1 giây)** – Không có hiện tượng ngủ đông (sleep) phải chờ 50s như Render Free.
- 🚀 **Không giới hạn 750 giờ/tháng** – Chạy thoải mái 24/7.
- 🌐 **Tên miền Vercel ngắn & đẹp** – Dạng `https://khbd-ai-pro.vercel.app` hoặc gắn tên miền riêng miễn phí.

---

## 🚀 Các Bước Triển Khai Lên Vercel (Chỉ mất 2 phút)

### Bước 1: Đăng nhập Vercel & Import Dự Án
1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
2. Nhấn nút **Add New...** -> chọn **Project**.
3. Chọn kho lưu trữ GitHub chứa mã nguồn ứng dụng của bạn rồi bấm **Import**.

---

### Bước 2: Cấu hình Dự Án (Configure Project)
- **Framework Preset**: Chọn **Vite** (Vercel thường tự động nhận diện).
- **Build Command**: `vite build` (đã được cấu hình tự động trong `vercel.json`).
- **Output Directory**: `dist`.

---

### Bước 3: Thêm Biến Môi Trường (Environment Variables)
Trong mục **Environment Variables**, bấm mở rộng và thêm các biến:
1. `GEMINI_API_KEY`: *(Dán mã khóa Gemini API Key quản trị của bạn, ví dụ: `AIzaSy...`)*
2. *(Tùy chọn nếu có nhiều key dự phòng)*:
   - `GEMINI_API_KEY_1`: `AIzaSy...`
   - `GEMINI_API_KEY_2`: `AIzaSy...`

---

### Bước 4: Nhấn "Deploy"
- Chờ khoảng 1 phút để Vercel build và tạo Serverless Functions.
- Khi hoàn tất, Vercel sẽ cấp ngay cho bạn một đường link HTTPS siêu nhanh dạng:
  👉 **`https://khbd-ai-pro.vercel.app`**
- Bạn có thể vào mục **Settings -> Domains** trên Vercel để đổi tên link hoặc gắn tên miền riêng miễn phí.

---

## 🔑 Tài Khoản Quản Trị Mặc Định
- **Tài khoản:** `admin@123`
- **Mật khẩu:** `111111`
*(Tài khoản quản trị có toàn quyền quản lý kho SGK, cấp tài khoản cho giáo viên và tự động sử dụng khóa hệ thống của Vercel).*
