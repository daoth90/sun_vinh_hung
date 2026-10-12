# Quy hoạch Sun Group – Vĩnh Hưng, Hà Nội

## Cách xem tài liệu

GitHub Pages (sau khi bật Pages từ root repository, dùng domain mặc định):

- Danh mục: <https://daoth90.github.io/sun_vinh_hung/>
- Bản đồ: <https://daoth90.github.io/sun_vinh_hung/html/qhsdd-vinhhung-03.html>
- Bản mẫu: <https://daoth90.github.io/sun_vinh_hung/html/demo.html>

Mở `index.html` qua HTTP server để tìm và xem tài liệu. Chạy local từ bất kỳ thư mục nào:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory $HOME/workspace/sun_vinh_hung
```

- Danh mục: <http://127.0.0.1:8000/>
- Bản đồ: <http://127.0.0.1:8000/html/qhsdd-vinhhung-03.html>
- Bản mẫu: <http://127.0.0.1:8000/html/demo.html>

Dừng bằng `Ctrl+C`. Nếu port 8000 đã được dùng, đổi port và URL tương ứng. Mở qua HTTP thay vì `file://` để tải danh mục và HTML gốc trong iframe. Có thể phục vụ các file từ root repository trên GitHub Pages mà không cần build.

Viewer hỗ trợ cuộn chuột để zoom tại con trỏ, pinch hai ngón để zoom tại trung điểm và kéo bằng chuột trái/một ngón để di chuyển. Slider zoom theo tâm vùng xem; nút reset về mức vừa chiều rộng. Mỗi lần mở hoặc refresh trang đều reset về mức vừa chiều rộng; không lưu zoom.

Chỉnh `zoomDebounceMs` (delay slider, hiện 50 ms) và `wheelZoomSensitivity` trong `assets/js/viewer-config.js`. Chế độ kéo bản đồ không hỗ trợ chọn chữ hoặc bấm link bên trong tài liệu; link PDF vẫn nằm trên toolbar.

`allowZoomOutBeyondFit` mặc định `false`: slider, wheel và pinch không thể thu nhỏ hơn mức reset vừa chiều rộng (ví dụ reset 11% thì minimum là 11%). Đặt `true` để cho phép thu nhỏ đến giới hạn gốc 1%. Mức vừa rộng được tính lại khi đổi kích thước cửa sổ.

## Mục tiêu

Lưu trữ, tra cứu và đối chiếu PDF cùng HTML chuyển đổi từ PDF về quy hoạch khu vực Vĩnh Hưng, Hà Nội. HTML gốc được giữ nguyên; viewer cung cấp chế độ đọc có zoom.

Đây là kho tài liệu độc lập, không phải website chính thức. Khi xác minh thông tin, đối chiếu HTML với PDF và nguồn công bố; bản mẫu chỉ là nội dung giả lập.

## Cấu trúc thư mục

```text
sun_vinh_hung/
├── README.md
├── LICENSE
├── index.html
├── pdf/
│   └── qhsdd-vinhhung-03.pdf         # PDF gốc
├── html/
│   ├── qhsdd-vinhhung-03.html        # Viewer có zoom
│   ├── demo.html
│   └── original/
│       ├── qhsdd-vinhhung-03.html    # HTML đã parse, giữ nguyên
│       └── demo.html
├── assets/
│   ├── css/
│   └── js/
├── metadata/
│   └── documents.json              # Danh mục: id, title, group, html, pdf, description
└── skills/
    └── pdf-html-viewer/
        └── SKILL.md
```

PDF, HTML gốc và viewer dùng cùng tên file trong các thư mục tương ứng. Ảnh/font/CSS đi kèm giữ đúng đường dẫn tương đối dưới `html/original/`. Danh mục liên kết đến viewer và PDF, không có tùy chọn xem HTML gốc.

Khi parse PDF sang HTML, dùng zoom mặc định **5x**. Đây là mức zoom khi chuyển đổi tài liệu; viewer vẫn mở ở mức vừa chiều rộng.

## Cách dùng skill

Local skill nằm tại `skills/pdf-html-viewer/SKILL.md`. Gọi bằng đường dẫn trong yêu cầu cho Codex; skill này chưa được đăng ký vào danh sách skill tự động.

Skill nhận tên file, full path hoặc file được mention bằng `@`:

> skills/pdf-html-viewer/ tạo viewer cho file qhsdd-vinhhung-03.html

> skills/pdf-html-viewer/ tạo viewer cho file /absolute/path/qhsdd-vinhhung-03.html

> skills/pdf-html-viewer/ tạo viewer cho @qhsdd-vinhhung-03.html

Với tên file, skill tìm trong `html/original/`. Với full path hoặc `@`, skill dùng đúng file được chỉ định; nếu nằm ngoài thư mục gốc của repo, skill sao chép HTML cùng tài nguyên cần thiết vào `html/original/` và giữ nguyên file đầu vào.

Skill tạo hoặc cập nhật `html/qhsdd-vinhhung-03.html`, tìm PDF cùng tên trong `pdf/` và cập nhật `metadata/documents.json`. Bản HTML gốc được giữ nguyên.
