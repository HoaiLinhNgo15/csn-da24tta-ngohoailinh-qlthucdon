# Website quản lý thực đơn căn tin trường học

> **Đồ án cơ sở ngành** - hỗ trợ sinh viên, giảng viên tra cứu thực đơn trong trường học theo ngày/buổi và giúp quản trị viên quản lý danh mục món ăn một cách linh hoạt.

## Giới thiệu đề tài

**Website Quản lý thực đơn căn tin trường học** được xây dựng nhằm giải quyết nhu cầu tra cứu thông tin món ăn, giá cả và tình trạng còn/hết món của sinh viên và cán bộ giảng viên trong trường. Hệ thống tập trung vào tính trực quan, nhanh chóng và mượt mà trên cả máy tính lẫn thiết bị di động.

_Phạm vi đồ án chỉ tập trung vào quản lý và hiển thị thực đơn, không bao gồm chức năng đặt món hay thanh toán trực tuyến._

## Các tính năng chính

### Phía người dùng (Sinh viên / Giảng viên - không cần đăng nhập vào hệ thống)

- **Xem thực đơn:** Tra cứu danh sách món ăn được phục vụ theo từng ngày trong tuần và theo buổi (Sáng, Trưa, Chiều).
- **Tìm kiếm và lọc món:** Lọc món ăn theo từ khóa, nhóm món (Món chính, Món phụ, Thức uống,...) hoặc tình trạng còn/hết.
- **Xem chi tiết món ăn:** Hiển thị hình ảnh, mô tả, giá bán và trạng thái thực tế của món ăn.
- **Quan tâm món ăn:** Bấm quan tâm món ăn yêu thích và xem danh sách các món hot nhất.

### Phía quản trị viên (Admin căn tin)

- **Xác thực hệ thống:** Đăng nhập an toàn vào trang quản trị.
- **Quản lý danh mục nền tảng:** Quản lý nhóm món ăn và các buổi phục vụ.
- **Quản lý món ăn:** Thêm, sửa, xóa (CRUD) danh sách món ăn/thức uống, cập nhật hình ảnh và giá bán.
- **Lập thực đơn ngày:** Gán các món ăn vào thực đơn của từng ngày cụ thể trong tuần.
- **Cập nhật trạng thái nhanh:** Bật tắt tình trạng còn/hết món ngay trong ca bán.
- **Theo dõi lượt quan tâm:** Thống kê các món ăn được quan tâm nhiều nhất.

## Công nghệ sử dụng

- **Frontend:** HTML5, CSS, JavaScript.
- **Backend:** Node.js (Express).
- **Database:** Microsoft SQL Server.
- **Tools và IDE:** Visual Studio Code, SQL Server Management Studio, Git.

## Cấu trúc cơ sở dữ liệu

Cơ sở dữ liệu gồm 5 bảng chính được chuẩn hóa:

1. `ADMINISTRATOR`: Lưu thông tin tài khoản quản trị.
2. `NHOMMON`: Danh mục nhóm món(Món chính, Món phụ, thức uống,...).
3. `MONAN`: Danh mục các món ăn chuẩn (Tên, hình ảnh, giá, mô tả, nhóm món).
4. `TD_BUOI`: Danh mục buổi phục vụ (Sáng, Trưa, Chiều).
5. `CHI_TIET_MON_ĂN`: Bảng trung gian liên kết món ăn với ngày phục vụ, buổi phục vụ, trạng thái và lượt quan tâm.

## Cấu trúc thư mục

```text
csn-da24tta-ngohoailinh-qlthucdon/
├───progress-report
├───setup
│   ├───assets
│   │   ├───css
│   │   ├───images
│   │   └───js
│   ├───db
│   ├───html # Các trang giao diện HTML/EJS/Razor
│   └───index.html
├───soft
├───src
├───thesis
│   ├───abs
│   ├───doc
│   ├───html
│   ├───pdf
│   └───refs
└── README.md # Tài liệu hướng dẫn dự án
```

## Hướng dẫn cài đặt và chạy dự án

### Chuẩn bị môi trường

- **Cài đặt Phần mềm:** Microsoft SQL Server và SQL Server Management Studio
- **Cài đặt môi trường:** Node.js

### Cài đặt cơ sở dữ liệu

1. Mở SQL Server Management Studio (SSMS).
2. Mở file _`db/schema.sql`_ và nhấn _`Execute`_ để tạo database và các bảng.
3. Cấu hình lại chuỗi kết nối (ConnectionString) trong file cấu hình dự án sao cho khớp với ServerName, Username, Password SQL.

### Khởi chạy ứng dụng

````markdown
```bash
# Clone repository về máy
git clone [https://github.com/HoaiLinhNgo15/csn-da24tta-ngohoailinh-qlthucdon](https://github.com/HoaiLinhNgo15/csn-da24tta-ngohoailinh-qlthucdon.git)

# Di chuyển vào thư mục dự án
cd csn-da24tta-ngohoailinh-qlthucdon/setup

# Khởi chạy ứng dụng
npm start # Hoặc dotnet run / chạy qua Localhost Web Server
```
````

## Thông tin tác giả

- **Sinh viên thực hiện:** Ngô Hoài Linh
- **Tên đề tài:** Thiết kế Website quản lý thực đơn căn tin trường học
- **Loại đồ án:** Đồ án cơ sở ngành
- **Thời gian thực hiện:** 10/2026 - 12/2026
