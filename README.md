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

## Google Maps dưới lớp quy hoạch

Bản thử cho tờ 03: `html/20261012_qhsdd-vinhhung-03.html?view=map`. Có thể chuyển giữa **Tài liệu** và **Bản đồ** ngay trên toolbar. Chế độ bản đồ dùng nguyên HTML gốc trong iframe sandbox, không xuất ảnh hoặc tile mới. Google Maps điều khiển kéo/zoom chung; hai slider điều khiển opacity độc lập. Ảnh nền nhúng sẵn trong HTML vẫn có giới hạn độ phân giải của nguồn; chữ HTML giữ nguyên. Nền trắng trong ảnh cũng giảm opacity cùng lớp quy hoạch.

### Tạo Google Maps API key

1. Tạo project trong [Google Cloud Console](https://console.cloud.google.com/) và liên kết billing account.
2. Bật **Maps JavaScript API** trong APIs & Services, rồi tạo API key trong Credentials.
3. Application restrictions chọn **Websites**. Thêm referrer dùng thực tế, ví dụ `http://127.0.0.1:8000/*`, `http://localhost:8000/*`, `https://daoth90.github.io/sun_vinh_hung/*`. Port local khác cần referrer tương ứng.
4. API restrictions chỉ cho phép **Maps JavaScript API**. Dán key vào form trong viewer để thử; form không lưu key vào localStorage. Khi triển khai, đặt key website trong `GOOGLE_MAPS_VIEWER_CONFIG.apiKey` tại `assets/js/viewer-config.js`. Key dùng phía trình duyệt luôn có thể đọc được, nên cần giới hạn referrer/API.

Theo [bảng giá Google](https://developers.google.com/maps/billing-and-pricing/pricing), Dynamic Maps có 10.000 lượt tải miễn phí mỗi tháng; bậc đầu sau miễn phí là 7 USD/1.000 lượt (kiểm tra lại giá khi triển khai). Bật billing vẫn là điều kiện sử dụng. Xem [hướng dẫn key](https://developers.google.com/maps/documentation/javascript/get-api-key) và [usage/billing](https://developers.google.com/maps/documentation/javascript/usage-and-billing). Viewer chỉ khởi tạo bản đồ khi mở chế độ Bản đồ, và dùng lại cùng instance khi đổi qua lại. Có thể đặt quota trong Cloud Console để giới hạn mức sử dụng; budget alert chỉ cảnh báo, không tự dừng chi phí.

### Cấu hình và căn lớp

`assets/js/viewer-config.js` chứa cấu hình Google Maps chung: API key, ngôn ngữ, region, version, giới hạn zoom và mặc định của các lớp. `metadata/documents.json` chứa `mapOverlay` cho từng tài liệu:

```json
{
  "enabled": true,
  "calibrated": false,
  "center": { "lat": 20.99, "lng": 105.877 },
  "widthMeters": 3000,
  "rotationDegrees": 0,
  "zoom": 15,
  "mapTypeId": "roadmap",
  "mapOpacity": 1,
  "documentOpacity": 0.6
}
```

`center` là tâm **toàn bộ tờ HTML**, `widthMeters` là chiều rộng thực tế tương ứng với **toàn bộ tờ**, bao gồm cả khung/chú giải. Chiều cao suy ra từ tỷ lệ HTML. `rotationDegrees` xoay theo chiều kim đồng hồ; `zoom` là mức zoom Google Maps khi mở. Không dùng field `scale` của tài liệu để định vị. Đây là phép căn đồng dạng trên mặt phẳng Mercator; chưa hỗ trợ nắn ảnh theo nhiều điểm hoặc sửa sai lệch phép chiếu của bản quy hoạch.

Giá trị tờ 03 hiện chỉ là điểm bắt đầu gần khu vực Vĩnh Hưng, **chưa xác nhận tọa độ chính xác**. Mở **Căn lớp**, chỉnh tâm, chiều rộng và góc xoay rồi **Áp dụng**. **Lấy tâm bản đồ** đặt tâm tờ tại tâm bản đồ đang xem. **Lưu trên máy** lưu riêng theo ID tài liệu trong trình duyệt; **Tải JSON** xuất cấu hình `mapOverlay` để cập nhật metadata khi đã căn xong. Nút reset trong Căn lớp xóa bản lưu cục bộ và khôi phục metadata. Chỉ đặt `calibrated: true` sau khi đối chiếu nhiều điểm mốc thực tế. Tải lại trang khởi động lại camera; không tự khôi phục lần pan/zoom cuối nếu chưa bấm lưu.

Kiểm tra phép căn tọa độ: `node --test tests/map-overlay-geometry.test.cjs`.

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
│   └── documents.json              # Danh mục: id, title, group, html, pdf, description, scale
└── skills/
    └── pdf-html-viewer/
        └── SKILL.md
```

PDF, HTML gốc và viewer dùng cùng tên file trong các thư mục tương ứng. Ảnh/font/CSS đi kèm giữ đúng đường dẫn tương đối dưới `html/original/`. Danh mục liên kết đến viewer và PDF, không có tùy chọn xem HTML gốc.

Khi parse PDF sang HTML, dùng zoom mặc định **5x**. Đây là mức zoom khi chuyển đổi tài liệu; viewer vẫn mở ở mức vừa chiều rộng.

`scale` trong `metadata/documents.json` là số biểu thị scale chuyển đổi để lưu metadata nội bộ. Field này không hiển thị trên giao diện và không thay đổi zoom mặc định của viewer. Các tài liệu chưa xác nhận scale được đặt `0`.

## Thêm tài liệu qua localhost

Tool riêng trên máy này nằm trong `tools/add-resource/`, được Git ignore. Chạy từ root repo:

```bash
node tools/add-resource/server.mjs
```

Mở <http://127.0.0.1:8766/add-resource>, chọn PDF, Original HTML hoặc cả hai, nhập metadata rồi nhấn Add. Khi có Original HTML, tool gọi Codex CLI với skill `pdf-html-viewer` để tạo viewer; khi chỉ có PDF, tool thêm tài liệu và cập nhật danh mục. Yêu cầu Node 22+, Python 3 và Codex CLI đã đăng nhập để tạo viewer. Có thể đổi port bằng `node tools/add-resource/server.mjs 8767`.

Tool sao chép file đầu vào, giữ nguyên file tại vị trí đã chọn; chỉ đưa kết quả hợp lệ vào `pdf/`, `html/original/`, `html/` và `metadata/documents.json`. PDF và HTML cần cùng tên trước phần mở rộng. Nếu chỉ chọn PDF thì thêm mục PDF vào danh mục. HTML cần được chuyển đổi trước; tool không tự parse PDF. File trùng tên hoặc ID đã tồn tại sẽ được báo lỗi. Không tự commit hoặc push.

Danh mục và kết quả import chỉ hiển thị `Xem HTML` khi có viewer, `Xem PDF` khi có PDF. HTML upload nên nhúng sẵn ảnh/font/CSS vì form chỉ nhận hai loại file trên.

Tool không được đưa lên GitHub Pages và không có trong clone mới vì bị Git ignore; tài liệu và metadata tạo ra vẫn được theo dõi bằng Git.

## Cách dùng skill

Local skill nằm tại `skills/pdf-html-viewer/SKILL.md`. Gọi bằng đường dẫn trong yêu cầu cho Codex; skill này chưa được đăng ký vào danh sách skill tự động.

Skill nhận tên file, full path hoặc file được mention bằng `@`:

> skills/pdf-html-viewer/ tạo viewer cho file qhsdd-vinhhung-03.html

> skills/pdf-html-viewer/ tạo viewer cho file /absolute/path/qhsdd-vinhhung-03.html

> skills/pdf-html-viewer/ tạo viewer cho @qhsdd-vinhhung-03.html

Với tên file, skill tìm trong `html/original/`. Với full path hoặc `@`, skill dùng đúng file được chỉ định; nếu nằm ngoài thư mục gốc của repo, skill sao chép HTML cùng tài nguyên cần thiết vào `html/original/` và giữ nguyên file đầu vào.

Skill tạo hoặc cập nhật `html/qhsdd-vinhhung-03.html`, tìm PDF cùng tên trong `pdf/` và cập nhật `metadata/documents.json`. Bản HTML gốc được giữ nguyên.
