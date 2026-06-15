# August Mark 🖊️

> **Tagline:** *Mark everything, review later.*

**August Mark** là một ứng dụng desktop hỗ trợ review, chụp màn hình và vẽ ghi chú (markup/annotation) trực tiếp trên màn hình, giúp các nhà phát triển, nhà thiết kế, kiểm thử viên (QC/QA) và quản lý sản phẩm nhanh chóng ghi lại lỗi (bug), phản hồi (feedback) và xuất báo cáo tiện lợi.

Dự án được xây dựng với mục tiêu hoạt động độc lập, gọn nhẹ, bảo mật dữ liệu cục bộ (offline-first) và giao diện tối giản, trực quan.

---

## 🚀 Tính năng nổi bật (MVP v0.1)

- **Quản lý Project & Session:** Tổ chức các phiên review theo từng dự án riêng biệt.
- **Chụp ảnh & Đánh dấu (Markup) Màn hình:** (Đang phát triển) Vẽ trực tiếp các khối chữ nhật, mũi tên, chữ ghi chú, số thứ tự lỗi lên màn hình.
- **Cơ sở dữ liệu SQLite nội bộ:** Lưu trữ toàn bộ dữ liệu cục bộ bảo mật trên máy khách, không gửi dữ liệu qua API bên thứ ba.
- **Xuất báo cáo HTML:** (Đang phát triển) Đóng gói toàn bộ phiên làm việc thành một file HTML duy nhất tự chứa (chứa ảnh base64) để chia sẻ nhanh.

---

## 🛠️ Công nghệ sử dụng

- **Khung ứng dụng:** [Tauri 2](https://tauri.app/) (Rust backend)
- **Giao diện (Frontend):** [Vue 3](https://vuejs.org/) + [Vuetify 3](https://vuetifyjs.com/) (Material Design) + [TypeScript](https://www.typescriptlang.org/)
- **Quản lý trạng thái:** [Pinia](https://pinia.vuejs.org/)
- **Hệ cơ sở dữ liệu:** [SQLite](https://www.sqlite.org/) (Sử dụng `rusqlite` đóng gói kèm ứng dụng)

---

## 📁 Tiến trình Week 1 - Cấu trúc nền tảng (Foundation)

Tuần 1 tập trung vào xây dựng bộ khung ứng dụng chạy ổn định và thiết lập hệ thống lưu trữ cục bộ:
- **T1.01 -> T1.02:** Khởi tạo cấu trúc dự án Tauri 2, Vue 3, TypeScript, và tích hợp bộ giao diện Vuetify 3 (Theme tối màu chủ đạo `#0F1117`, màu cam thương hiệu `#FF6B35`).
- **T1.03:** Định nghĩa đầy đủ các kiểu dữ liệu TypeScript dùng chung (Project, Session, Capture, Issue, Annotation, Point).
- **T1.04:** Định nghĩa hệ thống bắt lỗi trong Rust (`AppError`) hỗ trợ tuần tự hóa qua Tauri IPC và các tiện ích sinh ID, định vị thư mục.
- **T1.05:** Khai báo cấu trúc thực thể (Rust structs) và Payload trao đổi dữ liệu tương thích với frontend.
- **T1.06:** Thiết kế lược đồ cơ sở dữ liệu SQLite v001 hỗ trợ ràng buộc khóa ngoại (Foreign Keys) tự động cascade xóa dữ liệu con và quản lý migrations chạy tự động khi khởi động.
- **T1.07:** Khởi tạo AppState toàn cục quản lý kết nối cơ sở dữ liệu luồng an toàn (`Mutex<Connection>`).
- **T1.08 -> T1.09:** Xây dựng Project repository (CRUD) ở Rust và Tauri IPC Bridge ở frontend.
- **T1.10:** Phát triển giao diện Sidebar chọn dự án (`ProjectSelector`) và thanh điều hướng.
- **T1.11 -> T1.12:** Xây dựng Session repository (CRUD) ở Rust, tạo Pinia store và thiết kế danh sách phiên làm việc (`SessionList`, `SessionCard`).
- **T1.13:** Hoàn thiện bố cục trang chính (Dashboard Layout) kết hợp Header (`AppHeader`) hiển thị phím tắt và màn hình trống (`EmptyState`).

---

## 💻 Hướng dẫn chạy thử nghiệm

### 1. Yêu cầu hệ thống trước khi cài đặt
- **Node.js** (Phiên bản v20 trở lên)
- **Rust Toolchain** (Cài đặt thông qua [rustup](https://rustup.rs/))
- **Visual Studio Build Tools** (Chọn C++ build tools trên hệ điều hành Windows)

### 2. Cài đặt các gói phụ thuộc
```bash
# Cài đặt thư viện frontend
npm install
```

### 3. Khởi động môi trường phát triển (Development)
Chạy lệnh sau để khởi chạy máy chủ hot-reload Vite và biên dịch chương trình Tauri chạy trên cửa sổ máy tính:
```bash
npm run tauri dev
```

### 4. Đóng gói ứng dụng (Production Build)
```bash
npm run tauri build
```
File thực thi cài đặt (`.msi` hoặc `.exe` trên Windows) sẽ được đóng gói tại đường dẫn `src-tauri/target/release/bundle/`.

---

## 🤝 Liên hệ & Phát triển

Dự án được phát triển bởi **August Trung**. Mọi ý kiến phản hồi xin vui lòng tạo Issue trên kho mã nguồn Github này.

*Tagline: Mark everything, review later.*
