# August Mark 🖊️

> **Tagline:** *Mark everything, review later.*

**August Mark** là một ứng dụng desktop gọn nhẹ, bảo mật và mạnh mẽ dành cho các nhà phát triển, nhà thiết kế, kiểm thử viên (QA/QC) và quản lý sản phẩm. Ứng dụng giúp chụp ảnh màn hình nhanh, vẽ trực tiếp các ghi chú, mũi tên, số thứ tự lỗi và xuất báo cáo HTML tiện lợi để chia sẻ.

---

## 🚀 Tính năng nổi bật

- **Quản lý Dự án & Phiên làm việc (Project & Session):** Tổ chức các phiên review và chụp ảnh màn hình gọn gàng theo từng dự án riêng biệt.
- **Chụp ảnh & Ghi chú Màn hình (Markup):**
  - **Marker (Ghim số):** Đánh số thứ tự lỗi tăng dần tự động.
  - **Rectangle (Hình chữ nhật):** Khoanh vùng khu vực có lỗi.
  - **Arrow (Mũi tên):** Chỉ rõ tiêu điểm hoặc luồng thao tác lỗi.
  - **Text (Văn bản):** Viết ghi chú trực tiếp lên ảnh.
- **Báo cáo HTML Tự chứa (Self-contained):** Đóng gói toàn bộ phiên làm việc (bao gồm các ảnh chụp và thông tin chi tiết của lỗi) thành một file HTML duy nhất (sử dụng ảnh Base64) để dễ dàng gửi qua email, chat hoặc đính kèm vào Jira.
- **Offline-First & Bảo mật:** Toàn bộ dữ liệu (cơ sở dữ liệu SQLite và tệp tin hình ảnh) được lưu trữ cục bộ 100% trên máy tính của bạn.

---

## ⌨️ Phím tắt & Thao tác nhanh

### Kích hoạt chụp ảnh màn hình
Để kích hoạt chế độ chụp và vẽ ghi chú từ bất kỳ ứng dụng nào khác:
- **Phím tắt toàn cục:** Nhấn phím `PrintScreen`.
- **Thao tác chuột:** Nhấn và giữ **nút cuộn chuột giữa** (Middle Click Hold) từ **1 giây** trở lên.

### Trong giao diện vẽ ghi chú (Overlay Window)
- **Phím `1`**: Chuyển sang công cụ **Marker (Ghim số)**.
- **Phím `2`**: Chuyển sang công cụ **Rectangle (Hình chữ nhật)**.
- **Phím `3`**: Chuyển sang công cụ **Arrow (Mũi tên)**.
- **Phím `4`**: Chuyển sang công cụ **Text (Văn bản)**.
- **Phím `Escape` (Esc)**: Hủy bỏ hình vẽ đang dở, đóng form nhập lỗi hoặc thoát chế độ Overlay.

---

## 🛠️ Công nghệ sử dụng

- **Rust / Tauri 2:** Xử lý chụp ảnh đa màn hình, lắng nghe phím tắt toàn cục và tương tác cơ sở dữ liệu SQLite.
- **Vue 3 / Vuetify 3 / TypeScript:** Giao diện điều khiển mượt mà, tối giản với bảng màu Dark Mode hiện đại.
- **SQLite:** Lưu trữ dữ liệu cục bộ an toàn, hiệu năng cao.

---

## 📦 Hướng dẫn cài đặt

Bạn chỉ cần tải xuống bộ cài đặt của August Mark tại mục **Releases** trên GitHub:
- **Bộ cài đặt `.msi`:** Dành cho Windows (tự động cấu hình và tích hợp hệ thống).
- **Bộ cài đặt NSIS (`.exe`):** Cài đặt nhanh và gọn nhẹ.

---

## 💻 Hướng dẫn chạy thử nghiệm & Phát triển (Dành cho Lập trình viên)

### Yêu cầu hệ thống
- **Node.js** (Phiên bản v20 trở lên)
- **Rust Toolchain** (Cài đặt thông qua [rustup](https://rustup.rs/))
- **Visual Studio Build Tools** (Cài đặt C++ build tools trên Windows)

### 1. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 2. Khởi động chế độ phát triển
Chạy lệnh sau để khởi chạy máy chủ hot-reload frontend và biên dịch ứng dụng Tauri:
```bash
npm run tauri dev
```

### 3. Đóng gói ứng dụng (Production Build)
```bash
npm run tauri build
```
Bộ cài đặt sau khi đóng gói thành công sẽ nằm ở thư mục: `src-tauri/target/release/bundle/`.

---

## 🤝 Liên hệ & Đóng góp ý kiến

Dự án được thiết kế và phát triển bởi **August Trung**. Mọi ý kiến đóng góp, phản hồi hoặc báo lỗi vui lòng tạo **Issue** hoặc gửi pull request trên kho lưu trữ mã nguồn này.

