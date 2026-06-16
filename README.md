# August Mark 🖊️

> **Tagline:** *Mark everything, review later.*

**August Mark** là một ứng dụng desktop gọn nhẹ, bảo mật và mạnh mẽ dành cho các nhà phát triển, nhà thiết kế, kiểm thử viên (QA/QC) và quản lý sản phẩm. Ứng dụng giúp chụp ảnh màn hình nhanh, vẽ ghi chú trực quan, phân loại lỗi và xuất báo cáo đa định dạng chuyên nghiệp.

---

## 🚀 Tính năng nổi bật (v0.1.1)

- **Quản lý Dự án & Phiên làm việc (Project & Session):** Tổ chức các phiên review và chụp ảnh màn hình gọn gàng theo từng dự án riêng biệt.
- **Công cụ ghi chú phong phú (Advanced Drawing Tools):**
  - **Marker (Ghim số):** Tự động đánh số thứ tự lỗi tăng dần.
  - **Rectangle (Hình chữ nhật):** Khoanh vùng khu vực có lỗi.
  - **Arrow (Mũi tên):** Chỉ rõ tiêu điểm hoặc luồng thao tác lỗi.
  - **Text (Văn bản):** Nhập văn bản ghi chú trực tiếp.
  - **Freehand (Vẽ tự do):** Vẽ phác thảo tự do trên màn hình.
  - **Highlight (Tô sáng):** Tô sáng vùng nội dung quan trọng bằng màu vàng bán trong suốt.
  - **Blur / Pixelate (Làm mờ):** Che các thông tin nhạy cảm (mật khẩu, email, số thẻ) một cách an toàn.
- **Hỗ trợ Undo/Redo & Xóa nét vẽ:** Hoàn tác (`Ctrl+Z`) hoặc khôi phục (`Ctrl+Y`) các nét vẽ lỗi, hoặc click chuột phải/nhấn phím `Delete` để xóa nhanh một nét vẽ riêng lẻ.
- **Hệ thống nhãn (Tags System):** Phân loại issue bằng các thẻ tag trực quan ngay trên overlay hoặc trong trang chi tiết, hỗ trợ bộ lọc tag trên dashboard.
- **Tìm kiếm toàn cục (Global Autocomplete Search):** Thanh tìm kiếm nhanh trên đầu Header tự động gợi ý các session và issue liên quan khi gõ từ khóa.
- **Sắp xếp & Bộ lọc nâng cao (Sorting & Filtering):** Sắp xếp session (theo ngày, số lượng issue, trạng thái) và issue (theo độ nghiêm trọng, trạng thái, ngày). Bộ lọc nhanh chóng cập nhật UI tức thời.
- **Báo cáo đa định dạng (Multi-format Exporters):** Xuất báo cáo session sang các định dạng **HTML**, **PDF**, **Markdown** (kèm thư mục lưu ảnh cục bộ), và **CSV** (tương thích Jira/Linear) kèm theo các bộ lọc trạng thái và độ nghiêm trọng.
- **Chế độ chạy nền (Minimize to Tray):** Chạy ngầm ứng dụng ở khay hệ thống (System Tray), đóng ứng dụng sẽ thu nhỏ xuống tray thay vì thoát hẳn để sẵn sàng chụp bất kỳ lúc nào.
- **Window State Persistence:** Tự động ghi nhớ kích thước và vị trí cửa sổ ở lần mở trước đó.

---

## ⌨️ Phím tắt & Thao tác nhanh

### Kích hoạt chụp ảnh màn hình
Để kích hoạt chế độ chụp màn hình ở bất kỳ ứng dụng nào khác:
- **Phím tắt toàn cục:** Nhấn tổ hợp phím `Ctrl + Shift + M`.
- **Thao tác chuột:** Nhấn và giữ **nút cuộn chuột giữa** (Middle Click Hold) từ **1 giây** trở lên.

### Trong giao diện vẽ ghi chú (Overlay Window)
- **Phím `1`**: Chuyển sang công cụ **Marker (Ghim số)**.
- **Phím `2`**: Chuyển sang công cụ **Rectangle (Hình chữ nhật)**.
- **Phím `3`**: Chuyển sang công cụ **Arrow (Mũi tên)**.
- **Phím `4`**: Chuyển sang công cụ **Text (Văn bản)**.
- **Phím `5`**: Chuyển sang công cụ **Freehand (Vẽ tự do)**.
- **Phím `6`**: Chuyển sang công cụ **Blur (Làm mờ)**.
- **Phím `7`**: Chuyển sang công cụ **Highlight (Tô sáng)**.
- **Phím `Escape` (Esc)**: Hủy bỏ hình vẽ đang dở, đóng form nhập lỗi hoặc thoát chế độ Overlay.
- **Tổ hợp `Ctrl + Z`**: Hoàn tác nét vẽ vừa thực hiện.
- **Tổ hợp `Ctrl + Y`**: Khôi phục nét vẽ vừa hoàn tác.
- **Phím `Delete`** (khi chọn nét vẽ): Xóa nhanh nét vẽ được chọn.

---

## 🛠️ Công nghệ sử dụng

- **Rust / Tauri 2:** Xử lý chụp ảnh đa màn hình (`xcap`), lắng nghe phím tắt toàn cục, sự kiện click chuột nền và tương tác cơ sở dữ liệu SQLite.
- **Vue 3 / Vuetify 3 / Pinia / TypeScript:** Giao diện điều khiển mượt mà với hiệu ứng chuyển trang và sắp xếp danh sách sinh động.
- **SQLite:** Lưu trữ dữ liệu và cài đặt ứng dụng cục bộ an toàn, hiệu năng cao.

---

## 📦 Hướng dẫn cài đặt

Tải xuống bộ cài đặt của August Mark tại mục **Releases** trên GitHub:
- **Bộ cài đặt `.msi`:** Dành cho Windows (tự động cấu hình và tích hợp hệ thống).
- **Bộ cài đặt NSIS (`.exe`):** Bản cài đặt di động, gọn nhẹ.

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
