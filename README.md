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

Viewer hỗ trợ cuộn chuột để zoom tại con trỏ, pinch hai ngón để zoom tại trung điểm và kéo bằng chuột trái/một ngón để di chuyển. Slider zoom theo tâm vùng xem nhưng không hiển thị phần trăm zoom; nút reset về mức vừa chiều rộng. Mỗi lần mở hoặc refresh trang đều reset về mức vừa chiều rộng; không lưu zoom.

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
│   └── documents.json              # Danh mục: id, title, group, html, pdf, url, description, scale, hidden
└── skills/
    └── pdf-html-viewer/
        └── SKILL.md
```

PDF, HTML gốc và viewer dùng cùng tên file trong các thư mục tương ứng. Ảnh/font/CSS đi kèm giữ đúng đường dẫn tương đối dưới `html/original/`. Danh mục liên kết đến viewer và PDF, không có tùy chọn xem HTML gốc.

Để thêm liên kết web, đặt `url` thành URL đầy đủ bắt đầu bằng `https://` hoặc `http://`; không cần `html` hoặc `pdf`. Title hiển thị như tài liệu thông thường, bên dưới hiển thị `description` nếu có và dòng `URL: <full_url>`, trong đó URL đầy đủ là liên kết mở trong tab/cửa sổ mới. Field `url` có thể bỏ qua hoặc để rỗng đối với tài liệu thông thường. Ô tìm kiếm hỗ trợ cả nội dung URL.

Đặt `hidden: true` để ẩn mục khỏi cả danh mục chính và trang tài liệu cũ. `hidden: false` hoặc không có field này thì mục được hiển thị theo nhóm. Đây chỉ là tùy chọn hiển thị; metadata và file vẫn truy cập được qua đường dẫn trực tiếp.

Đặt `group: "Deprecated"` cho tài liệu đã lỗi thời. Các mục này chỉ xuất hiện tại `deprecated/`. Danh mục chính hiện nút **Tài liệu cũ (N)** khi có ít nhất một mục Deprecated không bị ẩn; số lượng không phụ thuộc từ khóa tìm kiếm. Trang tài liệu cũ có ô tìm kiếm riêng và liên kết quay lại danh mục chính.

Khi parse PDF sang HTML, dùng zoom mặc định **5x**. Đây là mức zoom khi chuyển đổi tài liệu; viewer vẫn mở ở mức vừa chiều rộng.

`scale` trong `metadata/documents.json` là số biểu thị scale chuyển đổi để lưu metadata nội bộ. Field này không hiển thị trên giao diện và không thay đổi zoom mặc định của viewer. Các tài liệu chưa xác nhận scale được đặt `0`.

## Thêm tài liệu qua localhost

Tool riêng trên máy này nằm trong `tools/add-resource/`, được Git ignore. Chạy từ root repo:

```bash
node tools/add-resource/server.mjs
```

Mở <http://127.0.0.1:8766/add-resource>, chọn PDF, Original HTML hoặc cả hai, nhập metadata rồi nhấn Add. Khi có Original HTML, tool gọi Codex CLI với skill `pdf-html-viewer` để tạo viewer; khi chỉ có PDF, tool thêm tài liệu và cập nhật danh mục. Yêu cầu Node 22+, Python 3 và Codex CLI đã đăng nhập để tạo viewer. Có thể đổi port bằng `node tools/add-resource/server.mjs 8767`.

Tool sao chép file đầu vào, giữ nguyên file tại vị trí đã chọn; chỉ đưa kết quả hợp lệ vào `pdf/`, `html/original/`, `html/` và `metadata/documents.json`. PDF và HTML cần cùng tên trước phần mở rộng. Nếu chỉ chọn PDF thì thêm mục PDF vào danh mục. HTML cần được chuyển đổi trước; tool không tự parse PDF. File trùng tên hoặc ID đã tồn tại sẽ được báo lỗi. Không tự commit hoặc push.

Danh mục và kết quả import chỉ hiển thị `Xem HTML (nhẹ hơn)` khi có viewer, `Xem PDF` khi có PDF. HTML upload nên nhúng sẵn ảnh/font/CSS vì form chỉ nhận hai loại file trên.

Tool không được đưa lên GitHub Pages và không có trong clone mới vì bị Git ignore; tài liệu và metadata tạo ra vẫn được theo dõi bằng Git.

## Cách dùng skill

Local skill nằm tại `skills/pdf-html-viewer/SKILL.md`. Gọi bằng đường dẫn trong yêu cầu cho Codex; skill này chưa được đăng ký vào danh sách skill tự động.

Skill nhận tên file, full path hoặc file được mention bằng `@`:

> skills/pdf-html-viewer/ tạo viewer cho file qhsdd-vinhhung-03.html

> skills/pdf-html-viewer/ tạo viewer cho file /absolute/path/qhsdd-vinhhung-03.html

> skills/pdf-html-viewer/ tạo viewer cho @qhsdd-vinhhung-03.html

Với tên file, skill tìm trong `html/original/`. Với full path hoặc `@`, skill dùng đúng file được chỉ định; nếu nằm ngoài thư mục gốc của repo, skill sao chép HTML cùng tài nguyên cần thiết vào `html/original/` và giữ nguyên file đầu vào.

Skill tạo hoặc cập nhật `html/qhsdd-vinhhung-03.html`, tìm PDF cùng tên trong `pdf/` và cập nhật `metadata/documents.json`. Bản HTML gốc được giữ nguyên.
