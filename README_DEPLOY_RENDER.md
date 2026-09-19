# HƯỚNG DẪN TRIỂN KHAI ỨNG DỤNG KHBD AI PRO LÊN RENDER.COM

Ứng dụng **KHBD AI PRO** đã được cấu hình hoàn chỉnh 100% để chạy mượt mà trên **Render.com (Web Service)**.

---

## 🚀 Các Bước Triển Khai Lên Render.com

### Bước 1: Tạo mới Web Service trên Render
1. Đăng nhập vào tài khoản [Render.com](https://dashboard.render.com/).
2. Nhấn nút **New +** ở góc trên cùng bên phải và chọn **Web Service**.
3. Kết nối với kho lưu trữ GitHub chứa mã nguồn của ứng dụng (hoặc chọn Public Git Repository).

---

### Bước 2: Điền thông tin cấu hình dịch vụ
- **Name:** `khbd-ai-pro` (hoặc tên tùy thích)
- **Region:** `Singapore (Southeast Asia)` hoặc `Oregon (US West)`
- **Branch:** `main` (hoặc nhánh mặc định của bạn)
- **Runtime:** `Node`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Instance Type:** Chọn gói **Free** (Miễn phí)

---

### Bước 3: Cấu hình Biến Môi Trường (Environment Variables)
Trong mục **Environment Variables**, thêm các biến sau:
1. `NODE_ENV`: `production`
2. `GEMINI_API_KEY`: *(Dán mã Gemini API Key quản trị của bạn, ví dụ: AIzaSy...)*
3. *(Tùy chọn - nếu có nhiều key dự phòng)*:
   - `GEMINI_API_KEY_1`: `AIzaSy...`
   - `GEMINI_API_KEY_2`: `AIzaSy...`

---

### Bước 4: Nhấn "Deploy Web Service"
- Render sẽ tự động thực hiện lệnh `npm install`, `vite build`, `esbuild` đóng gói backend `dist/server.cjs` và khởi động server.
- Sau khi build hoàn tất, Render sẽ cấp cho bạn một đường link HTTPS trực tiếp dạng:
  `https://khbd-ai-pro.onrender.com`

---

## 🔑 Tài Khoản Quản Trị Mặc Định
- **Tài khoản:** `admin@123`
- **Mật khẩu:** `111111`
*(Tài khoản quản trị có toàn quyền quản lý kho SGK, cấp tài khoản cho giáo viên và tự động sử dụng khóa hệ thống của Render).*
