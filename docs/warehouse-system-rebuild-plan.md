# Plan Xây Dựng Lại Hệ Thống Quản Lý Kho K-MTP-PRo

Tài liệu này là kế hoạch triển khai tổng thể cho hệ thống quản lý kho vật tư trại gà. Mục tiêu là để các agent khác có thể bám theo từng phase, từng checklist và triển khai code theo cùng một kiến trúc thống nhất.

## 1. Mục Tiêu Sản Phẩm

K-MTP-PRo phải trở thành hệ thống quản lý kho vật tư nội bộ cho trại gà, phục vụ cả điện thoại và desktop.

Mục tiêu nghiệp vụ:

- Quản lý danh mục vật tư, biến thể, đơn vị tính, nhà cung cấp, khu sử dụng.
- Nhập vật tư từ cửa hàng/nhà cung cấp bên ngoài về kho.
- Các khu gửi yêu cầu vật tư hằng ngày.
- Quản kho duyệt, xuất kho, cấp phát vật tư cho từng khu.
- Khu nhận hàng và xác nhận số lượng thực nhận.
- Theo dõi vật tư dùng một lần, vật tư có thể thu hồi, vật tư hỏng, vật tư đổi mới, vật tư đem đi sửa.
- Kiểm kê kho định kỳ hoặc đột xuất.
- Báo cáo xuất nhập tồn chi tiết, thống kê tiêu hao, tồn thấp, vật tư hỏng/sửa, hiệu suất cấp phát.
- In phiếu và xuất Excel/PDF cho phiếu nhập, phiếu xuất, phiếu yêu cầu, phiếu kiểm kê.

Mục tiêu trải nghiệm:

- Mobile-first cho tạo yêu cầu, xem phiếu, duyệt nhanh, xác nhận nhận hàng, kiểm kê nhanh.
- Desktop-first cho báo cáo, thống kê, quản trị danh mục, in/xuất file, rà soát lịch sử.
- Luồng thao tác phải rõ trạng thái, ít nhập tay, dễ lọc, dễ tìm vật tư, phù hợp dùng ngoài hiện trường.

## 2. Nguyên Tắc Kiến Trúc

Các agent triển khai phải giữ các nguyên tắc sau:

- Không vá tiếp bằng cách cập nhật trực tiếp `variants.stock` từ nhiều nơi.
- Xây một nguồn sự thật trung tâm cho tồn kho: `stock_movements`.
- Tồn hiện tại là snapshot/tổng hợp có kiểm soát từ sổ kho: `stock_balances`.
- Mọi thay đổi tồn phải đi qua service/RPC nghiệp vụ, không update rải rác trong UI.
- Không xóa bảng cũ ngay; migrate dần để giữ app chạy được.
- Không thay đổi business rule âm thầm. Mọi status và workflow phải được map rõ.
- Không đưa private key/service-role key vào frontend.
- Sau mỗi phase code có ý nghĩa phải chạy `npm run build`.

Kiến trúc mục tiêu:

```text
UI mobile/desktop
  -> feature components
  -> hooks
  -> domain services
  -> Supabase RPC/services
  -> PostgreSQL tables
```

## 3. Quyền Xóa Legacy Trong Rebuild

Chủ repo đã cho phép xóa toàn bộ file/code cũ không còn cần thiết để rebuild lại hệ thống quản lý kho. Các agent được quyền xóa hoặc thay thế legacy code khi việc đó phục vụ trực tiếp cho kiến trúc mới trong tài liệu này.

Được phép xóa:

- File debug, import tạm, setup/report cũ, metadata rác, build output.
- Component/page/service/hook/utils cũ khi đã có implementation mới thay thế trong cùng phase hoặc phase trước đó.
- Luồng nghiệp vụ cũ gây trùng nguồn dữ liệu, ví dụ code cập nhật tồn kho trực tiếp ngoài `stock_movements`.
- Adapter legacy sau khi không còn import nào dùng.
- Code báo cáo/in phiếu cũ khi report/export mới đã thay thế và build pass.

Không được xóa bừa:

- `.env`, `env.example`, lockfile, package config, Supabase config, hoặc file chứa cấu hình chạy app nếu chưa có thay thế rõ.
- Migration lịch sử nếu chưa có chiến lược migration/reset database rõ ràng.
- Bảng/dữ liệu production bằng thao tác thủ công. Mọi thay đổi database phải qua migration/RPC có thể review.
- Source đang còn được import bởi app nếu chưa chỉnh import và build pass.

Quy tắc xóa:

- Trước khi xóa chạy `git status --short`.
- Với file source, chạy `rg` để xác nhận import/reference.
- Xóa theo batch nhỏ, có lý do rõ trong commit/PR.
- Sau khi xóa code/runtime, chạy `npm run build`.
- Sau khi xóa nhiều file, chạy `git diff --check`.
- Nếu đang thay một module lớn, ưu tiên tạo module mới trước, nối route/import sang module mới, rồi xóa module cũ.

## 4. Hiện Trạng Repo Cần Tôn Trọng

Repo hiện đã có các mảnh nghiệp vụ:

- Sản phẩm/biến thể/danh mục/khu.
- Phiếu yêu cầu vật tư.
- Phiếu nhập kho.
- Phiếu giao nhận.
- Kiểm kê kho.
- Hàng hỏng, đổi hàng, batch sửa chữa.
- Báo cáo và xuất file.

Vấn đề chính:

- Tồn kho đang dựa nhiều vào `variants.stock`.
- Nhập, xuất, kiểm kê, sửa chữa chưa cùng ghi vào một sổ kho thống nhất.
- `services/supabaseService.ts` đang quá lớn, nhiều nghiệp vụ dồn chung.
- Một số bảng có nghiệp vụ trùng ý nghĩa: requisition, delivery, receipt, inventory_transactions, defective_items, repair_batches.
- UI mobile đã có cải thiện ở phiếu yêu cầu, nhưng toàn hệ thống chưa mobile-first.
- Những phần cũ có thể bị xóa/thay thế trong quá trình rebuild nếu đã có replacement đúng kiến trúc mới.

## 5. Thuật Ngữ Chuẩn

Các agent phải dùng thống nhất các thuật ngữ sau trong code và UI.

Vai trò:

- `requester`: người yêu cầu vật tư tại khu.
- `manager`: quản kho/quản lý có quyền duyệt và xuất kho.
- `auditor`: người kiểm kê/xem báo cáo.
- `admin`: quyền quản trị hệ thống nếu được tách riêng sau này.

Địa điểm:

- `warehouse`: kho chính.
- `zone`: khu/trại sử dụng vật tư.
- `supplier`: cửa hàng/nhà cung cấp bên ngoài.
- `repair_vendor`: nơi sửa chữa.

Trạng thái tồn:

- `available`: còn trong kho, có thể cấp phát.
- `reserved`: đã được duyệt/giữ cho phiếu nhưng chưa xuất.
- `issued`: đã xuất cho khu.
- `defective`: hàng hỏng đã thu hồi về kho.
- `repairing`: đang gửi đi sửa.
- `disposed`: đã thanh lý/bỏ.

Loại vật tư:

- `consumable`: dùng một lần, cấp phát xong coi như tiêu hao.
- `returnable`: có thể thu hồi/trả lại.
- `repairable`: có thể hỏng, đổi mới, gửi sửa.
- `asset`: tài sản/thiết bị cần theo dõi vòng đời kỹ hơn.

## 6. Data Model Mục Tiêu

### 5.1. Bảng danh mục nền

Tạo hoặc chuẩn hóa:

- `suppliers`
- `warehouses`
- `stock_locations`
- `product_units` nếu cần chuẩn hóa đơn vị tính.

Đề xuất schema:

```sql
suppliers (
  id uuid primary key,
  name text not null,
  phone text,
  address text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)

warehouses (
  id uuid primary key,
  name text not null,
  type text not null check (type in ('main', 'zone', 'repair_vendor')),
  zone_id uuid null references zones(id),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Ghi chú:

- Nếu muốn đơn giản giai đoạn đầu, có thể chỉ tạo một kho chính mặc định và map `zones` thành địa điểm nhận hàng.
- Không bắt buộc tạo nhiều kho vật lý ngay nếu chưa cần.

### 5.2. Bảng cấu hình vật tư

Mở rộng `variants` hoặc thêm bảng phụ:

```sql
ALTER TABLE variants
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS min_stock integer default 0,
ADD COLUMN IF NOT EXISTS max_stock integer,
ADD COLUMN IF NOT EXISTS item_type text default 'consumable'
  check (item_type in ('consumable', 'returnable', 'repairable', 'asset'));
```

Yêu cầu:

- `sku` dùng cho mã vật tư/QR/barcode.
- `min_stock` dùng cảnh báo tồn thấp.
- `item_type` quyết định luồng sau cấp phát: tiêu hao luôn, có thể thu hồi, hay có thể hỏng/sửa.

### 5.3. Phiếu nghiệp vụ chung

Tạo bảng đầu phiếu thống nhất:

```sql
inventory_documents (
  id uuid primary key,
  document_code text not null unique,
  document_type text not null check (
    document_type in (
      'stock_receipt',
      'stock_issue',
      'requisition',
      'return_to_warehouse',
      'defective_return',
      'repair_issue',
      'repair_return',
      'stock_audit',
      'stock_adjustment',
      'disposal'
    )
  ),
  status text not null,
  source_location_id uuid null references warehouses(id),
  destination_location_id uuid null references warehouses(id),
  supplier_id uuid null references suppliers(id),
  zone_id uuid null references zones(id),
  requester_id uuid null references users(id),
  requester_name text,
  created_by uuid null references users(id),
  approved_by uuid null references users(id),
  fulfilled_by uuid null references users(id),
  received_by uuid null references users(id),
  document_date date not null default current_date,
  needed_by date,
  approved_at timestamptz,
  fulfilled_at timestamptz,
  received_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  metadata jsonb default '{}'::jsonb,
  legacy_table text,
  legacy_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
)
```

Tạo bảng dòng phiếu:

```sql
inventory_document_items (
  id uuid primary key,
  document_id uuid not null references inventory_documents(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid not null references variants(id),
  quantity_requested numeric(12,2),
  quantity_approved numeric(12,2),
  quantity_issued numeric(12,2),
  quantity_received numeric(12,2),
  unit text,
  unit_price numeric(12,2),
  batch_code text,
  expiry_date date,
  condition text default 'good' check (condition in ('good', 'defective', 'damaged', 'repaired', 'disposed')),
  purpose_type text,
  reason text,
  notes text,
  display_order integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
)
```

### 5.4. Sổ kho trung tâm

Tạo bảng `stock_movements` bất biến:

```sql
stock_movements (
  id uuid primary key,
  document_id uuid not null references inventory_documents(id),
  document_item_id uuid null references inventory_document_items(id),
  movement_type text not null check (
    movement_type in (
      'IN',
      'OUT',
      'RESERVE',
      'UNRESERVE',
      'TRANSFER',
      'RETURN',
      'RETURN_DEFECTIVE',
      'REPAIR_OUT',
      'REPAIR_IN',
      'ADJUST',
      'DISPOSAL'
    )
  ),
  product_id uuid not null references products(id),
  variant_id uuid not null references variants(id),
  source_location_id uuid null references warehouses(id),
  destination_location_id uuid null references warehouses(id),
  quantity numeric(12,2) not null check (quantity > 0),
  balance_state text not null default 'available',
  batch_code text,
  expiry_date date,
  unit_cost numeric(12,2),
  occurred_at timestamptz not null default now(),
  created_by uuid null references users(id),
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
)
```

Quy tắc:

- Không update/delete movement trong UI.
- Nếu sai thì tạo phiếu điều chỉnh hoặc phiếu hủy, không sửa lịch sử.
- Mọi báo cáo xuất nhập tồn lấy từ `stock_movements`.

### 5.5. Tồn hiện tại

Tạo bảng snapshot:

```sql
stock_balances (
  id uuid primary key,
  warehouse_id uuid not null references warehouses(id),
  product_id uuid not null references products(id),
  variant_id uuid not null references variants(id),
  balance_state text not null,
  batch_code text,
  expiry_date date,
  quantity numeric(12,2) not null default 0,
  updated_at timestamptz default now(),
  unique (warehouse_id, variant_id, balance_state, batch_code, expiry_date)
)
```

Quy tắc:

- `stock_balances` được cập nhật qua RPC trong transaction cùng lúc tạo movement.
- Giai đoạn chuyển đổi có thể đồng bộ ngược về `variants.stock` để UI cũ không vỡ, nhưng code mới phải đọc từ `stock_balances`.

### 5.6. Nhật ký duyệt và audit log

Tạo bảng:

```sql
document_events (
  id uuid primary key,
  document_id uuid not null references inventory_documents(id) on delete cascade,
  event_type text not null,
  actor_id uuid null references users(id),
  actor_name text,
  from_status text,
  to_status text,
  notes text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
)
```

Dùng cho:

- Ai tạo phiếu.
- Ai duyệt.
- Ai sửa số lượng duyệt.
- Ai xuất kho.
- Ai xác nhận nhận hàng.
- Ai hủy/từ chối.
- Ai kiểm kê/điều chỉnh.

## 7. Workflow Chuẩn

### 6.1. Nhập kho từ cửa hàng

Trạng thái:

```text
draft -> posted
draft -> cancelled
```

Luồng:

1. Quản kho tạo phiếu nhập.
2. Chọn nhà cung cấp, ngày nhập, ghi chú, ảnh hóa đơn nếu có.
3. Thêm vật tư, số lượng, đơn giá, lô/hạn dùng nếu có.
4. Bấm xác nhận nhập kho.
5. Hệ thống tạo `inventory_documents(stock_receipt)`.
6. Hệ thống tạo `inventory_document_items`.
7. Hệ thống tạo `stock_movements(IN)`.
8. Hệ thống tăng `stock_balances.available`.
9. Hệ thống ghi `document_events`.

Acceptance:

- Không có dòng số lượng <= 0.
- Không cho xác nhận nếu thiếu nhà cung cấp hoặc người tạo.
- Sau xác nhận, tồn khả dụng tăng đúng.
- Báo cáo nhập kho hiển thị được phiếu.
- Có thể in/xuất Excel phiếu nhập.

### 6.2. Yêu cầu vật tư từ khu

Trạng thái:

```text
draft -> submitted -> approved -> issued -> received
submitted -> rejected
submitted/approved -> cancelled
approved -> partially_issued -> issued
issued -> partially_received -> received
```

Luồng:

1. Người khu mở mobile.
2. Tìm vật tư theo tên, mã, danh mục, vật tư hay dùng.
3. Thêm vào phiếu.
4. Chọn mục đích: dùng hằng ngày, sửa chữa, bổ sung, đổi hàng hỏng, khác.
5. Nhập ngày cần nếu có.
6. Gửi phiếu.
7. Quản kho nhận thông báo/chỉ báo phiếu chờ duyệt.
8. Quản kho duyệt toàn bộ hoặc duyệt một phần.
9. Nếu duyệt, hệ thống có thể ghi `RESERVE` để giữ tồn.
10. Khi xuất, hệ thống ghi `OUT` và giảm `available` hoặc giảm `reserved`.
11. Khu xác nhận số nhận thực tế.

Acceptance:

- Mobile thao tác được bằng một tay ở viewport 360px.
- Phiếu gửi xong có mã phiếu rõ ràng.
- Quản kho thấy tồn hiện tại và tồn sau duyệt.
- Duyệt một phần không làm mất số lượng yêu cầu ban đầu.
- Xuất kho không được vượt tồn khả dụng trừ khi có quyền/luồng backorder rõ.
- Khu nhận thiếu phải ghi lý do/chênh lệch.

### 6.3. Cấp phát vật tư dùng một lần

Áp dụng cho `item_type = consumable`.

Luồng:

1. Khu yêu cầu.
2. Kho xuất.
3. Khu xác nhận nhận.
4. Vật tư coi là đã tiêu hao, không cần thu hồi.

Báo cáo:

- Tiêu hao theo khu.
- Tiêu hao theo vật tư.
- Tiêu hao theo ngày/tháng.
- Top vật tư dùng nhiều.

### 6.4. Vật tư hỏng, đổi mới, đem sửa

Áp dụng cho `repairable` hoặc `asset`.

Luồng đổi hàng:

1. Khu gửi yêu cầu đổi vật tư, chọn vật tư hỏng và vật tư cần cấp mới.
2. Khu nhập mô tả hỏng, ảnh hỏng nếu có.
3. Quản kho duyệt.
4. Kho xuất vật tư mới cho khu: `OUT`.
5. Kho nhận vật tư hỏng về: `RETURN_DEFECTIVE`, tăng `defective`.
6. Nếu đem sửa, tạo phiếu xuất sửa: `REPAIR_OUT`, giảm `defective`, tăng `repairing`.
7. Khi nhận lại sau sửa: `REPAIR_IN`, giảm `repairing`, tăng `available`.
8. Nếu không sửa được: `DISPOSAL`, giảm `defective` hoặc `repairing`.

Acceptance:

- Một phiếu đổi có thể vừa xuất hàng mới vừa ghi nhận hàng hỏng trả về.
- Có ảnh/mô tả tình trạng hỏng.
- Theo dõi được hàng đang chờ sửa, đang sửa, đã sửa, đã bỏ.
- Không cộng hàng hỏng vào tồn khả dụng.

### 6.5. Thu hồi/trả lại vật tư còn dùng được

Áp dụng cho `returnable`.

Luồng:

1. Khu trả vật tư về kho.
2. Quản kho kiểm tra tình trạng.
3. Nếu còn tốt: `RETURN`, tăng `available`.
4. Nếu hỏng: `RETURN_DEFECTIVE`, tăng `defective`.

Acceptance:

- Phiếu trả lại liên kết được với phiếu xuất gốc nếu có.
- Có trạng thái tình trạng vật tư.
- Báo cáo phân biệt vật tư trả tốt và vật tư hỏng.

### 6.6. Kiểm kê kho

Trạng thái:

```text
draft -> counting -> completed
draft/counting -> cancelled
```

Luồng:

1. Tạo phiếu kiểm kê theo toàn kho, danh mục, hoặc danh sách vật tư.
2. Chốt tồn hệ thống tại thời điểm tạo phiếu.
3. Người kiểm kê nhập số lượng thực tế trên mobile hoặc desktop.
4. Dòng nào lệch phải có lý do.
5. Khi hoàn thành, hệ thống tạo phiếu điều chỉnh `stock_adjustment`.
6. Ghi `stock_movements(ADJUST)` cho phần chênh lệch.
7. Cập nhật `stock_balances`.

Acceptance:

- Số hệ thống không thay đổi lung tung trong lúc đang kiểm kê; phải lưu snapshot.
- Lệch kho có lý do.
- Hoàn thành kiểm kê làm tồn hiện tại đúng bằng số thực tế.
- Có phiếu kiểm kê in được.

### 6.7. Điều chỉnh tồn thủ công

Chỉ cho manager/admin.

Luồng:

1. Chọn vật tư.
2. Nhập tăng/giảm hoặc số thực tế mới.
3. Bắt buộc lý do.
4. Tạo `stock_adjustment`.
5. Ghi `ADJUST`.

Acceptance:

- Không được điều chỉnh không lý do.
- Có log người chỉnh.
- Báo cáo thể hiện rõ điều chỉnh, không trộn với nhập/xuất thường.

## 8. Báo Cáo Và Thống Kê

### 7.1. Báo cáo xuất nhập tồn

Input:

- Từ ngày, đến ngày.
- Kho/khu.
- Danh mục.
- Vật tư.
- Trạng thái tồn.

Output:

- Tồn đầu kỳ.
- Nhập trong kỳ.
- Xuất trong kỳ.
- Trả về.
- Hỏng.
- Sửa xong nhập lại.
- Điều chỉnh.
- Tồn cuối kỳ.

Nguồn dữ liệu:

- `stock_movements` là nguồn chính.
- `stock_balances` dùng cho tồn hiện tại.

### 7.2. Báo cáo tiêu hao theo khu

Output:

- Khu.
- Vật tư.
- Tổng số lượng đã cấp.
- Số phiếu.
- Trung bình/ngày hoặc tháng.
- So sánh kỳ trước.

### 7.3. Báo cáo vật tư hỏng/sửa

Output:

- Vật tư hỏng đang chờ xử lý.
- Đang gửi sửa.
- Đã sửa về.
- Đã thanh lý.
- Tỷ lệ hỏng theo vật tư/khu.

### 7.4. Cảnh báo tồn thấp

Điều kiện:

- `stock_balances.available <= variants.min_stock`.

UI:

- Badge cảnh báo trên dashboard.
- Danh sách vật tư cần mua bổ sung.
- Gợi ý số lượng mua = `max_stock - available` nếu có `max_stock`.

### 7.5. Lịch sử từng vật tư

Màn hình chi tiết vật tư cần có:

- Tồn hiện tại theo trạng thái.
- Lịch sử nhập/xuất/điều chỉnh.
- Phiếu liên quan.
- Khu dùng nhiều nhất.
- Giá nhập gần nhất.
- Nhà cung cấp gần nhất.

## 9. Tính Năng Mới Nên Triển Khai

Triển khai theo mức ưu tiên.

P0 - bắt buộc cho lõi kho:

- Sổ kho `stock_movements`.
- Tồn hiện tại `stock_balances`.
- Mã phiếu tự động.
- Luồng yêu cầu -> duyệt -> xuất -> nhận.
- Nhập kho từ nhà cung cấp.
- Kiểm kê sinh điều chỉnh tồn.
- Báo cáo xuất nhập tồn.

P1 - rất nên có:

- Nhà cung cấp.
- Tồn tối thiểu/tối đa.
- Vật tư hay dùng theo khu.
- Duyệt một phần/xuất một phần.
- Ảnh hàng hỏng.
- Nhật ký duyệt phiếu.
- In phiếu xuất/nhập/yêu cầu/kiểm kê.
- Xuất Excel theo kỳ.

P2 - nâng cao:

- QR/barcode vật tư.
- Gợi ý mua bổ sung.
- Dashboard bất thường tiêu hao theo khu.
- Dự báo hết hàng theo tốc độ dùng.
- Đính kèm hóa đơn/ảnh chứng từ.
- Theo dõi tài sản theo serial nếu cần.
- Offline draft trên mobile bằng localStorage.
- Push notification hoặc thông báo trong app.

## 10. Phân Quyền

Quyền đề xuất:

```text
requester:
  - tạo phiếu yêu cầu cho khu của mình
  - xem phiếu của khu mình
  - xác nhận nhận hàng
  - báo hỏng/đổi vật tư

manager:
  - toàn quyền nhập/xuất/duyệt phiếu
  - quản lý vật tư, nhà cung cấp, khu
  - tạo phiếu sửa chữa, thanh lý
  - xem báo cáo kho

auditor:
  - tạo/thực hiện kiểm kê
  - xem báo cáo
  - không tự ý xuất/nhập nếu không được cấp quyền

admin:
  - quản trị user/role
  - cấu hình hệ thống
```

Yêu cầu kỹ thuật:

- Client-side role chỉ là UX.
- RLS/Supabase policy phải được rà soát trong phase bảo mật.
- Không dùng policy `WITH CHECK (true)` cho nghiệp vụ nhạy cảm trong bản hoàn thiện.

## 11. Service Và Module Cần Tách

Tách dần `services/supabaseService.ts` thành:

```text
services/productsService.ts
services/categoriesService.ts
services/zonesService.ts
services/usersService.ts
services/suppliersService.ts
services/inventoryDocumentsService.ts
services/stockMovementsService.ts
services/stockBalancesService.ts
services/requisitionsService.ts
services/receiptsService.ts
services/repairsService.ts
services/auditsService.ts
services/reportsService.ts
services/dashboardService.ts
```

Không cần tách một lần. Tách theo phase để giảm rủi ro.

RPC nên có:

```text
create_stock_receipt(...)
submit_requisition(...)
approve_requisition(...)
issue_requisition(...)
confirm_requisition_received(...)
return_defective_item(...)
create_repair_issue(...)
confirm_repair_return(...)
complete_stock_audit(...)
post_stock_adjustment(...)
rebuild_stock_balances(...)
get_inventory_summary(...)
get_stock_card(...)
```

Lý do dùng RPC:

- Tạo document, item, movement, balance trong cùng transaction.
- Tránh frontend chạy nhiều query rồi lỗi giữa chừng làm lệch tồn.
- Giữ business rule gần database hơn.

## 12. UI/UX Mục Tiêu

### 11.1. Mobile-first

Màn hình mobile bắt buộc:

- Trang chủ nhanh theo vai trò.
- Tạo yêu cầu vật tư.
- Giỏ yêu cầu/vật tư đã chọn.
- Danh sách phiếu yêu cầu.
- Chi tiết phiếu yêu cầu.
- Duyệt/xuất nhanh cho quản kho.
- Xác nhận nhận hàng.
- Báo hàng hỏng/đổi hàng.
- Kiểm kê nhanh.

Quy tắc mobile:

- Ưu tiên bottom sheet/modal full-height `100dvh`.
- Button đủ lớn cho cảm ứng.
- Không dùng bảng rộng cho thao tác chính.
- Dùng card/list compact thay bảng ở mobile.
- Search luôn dễ chạm.
- Filter dạng segmented/tabs.
- Mỗi màn hình chỉ một hành động chính rõ ràng.

### 11.2. Desktop

Màn hình desktop bắt buộc:

- Dashboard kho.
- Danh sách phiếu dạng table có filter mạnh.
- Chi tiết phiếu có timeline.
- Nhập kho.
- Xuất kho/cấp phát.
- Kiểm kê.
- Báo cáo xuất nhập tồn.
- Báo cáo tiêu hao theo khu.
- Báo cáo hàng hỏng/sửa.
- Quản lý vật tư/danh mục/khu/user/nhà cung cấp.
- In/xuất Excel/PDF.

Quy tắc desktop:

- Table có search, filter, sort.
- Export theo filter hiện tại.
- In phiếu theo mẫu sạch, không phụ thuộc layout màn hình.
- Dashboard tập trung chỉ số vận hành, không trang trí quá nhiều.

## 13. Phase Triển Khai

### Phase 0 - Audit hiện trạng và khóa phạm vi

Mục tiêu:

- Chốt hiện trạng schema, type, service, UI liên quan kho.
- Không sửa nghiệp vụ lớn trong phase này.

Checklist:

- Đọc `types.ts`, `types/supabase.ts`.
- Đọc toàn bộ migrations hiện có.
- Đọc các component: `CreateRequisitionModal`, `RequisitionListPage`, `RequisitionCard`, `CreateReceiptPage`, `ReceiptList`, `InventoryAuditSection`, `DefectManagement`, `Dashboard`.
- Đọc service hiện có trong `services/supabaseService.ts`.
- Lập mapping bảng cũ -> bảng mới.
- Ghi danh sách màn hình sẽ bị thay thế/dùng lại.

Deliverables:

- Ghi chú audit ngắn trong PR/commit.
- Không cần migration/code lớn.

Validation:

- `npm run build` nếu có sửa code.

### Phase 1 - Schema lõi kho

Mục tiêu:

- Tạo nền database mới nhưng chưa phá UI cũ.

Checklist:

- Thêm migration `015_inventory_core.sql`.
- Tạo `suppliers`.
- Tạo `warehouses`.
- Tạo `inventory_documents`.
- Tạo `inventory_document_items`.
- Tạo `stock_movements`.
- Tạo `stock_balances`.
- Tạo `document_events`.
- Thêm cột `sku`, `min_stock`, `max_stock`, `item_type` cho `variants`.
- Tạo indexes cho `document_type`, `status`, `variant_id`, `occurred_at`, `warehouse_id`.
- Tạo updated_at triggers.
- Tạo seed kho chính mặc định nếu chưa có.
- Thêm RLS policy tối thiểu nhưng không mở bừa cho thao tác nhạy cảm.

Acceptance:

- Migration chạy được trên database mới.
- Các bảng cũ vẫn còn.
- Không màn hình cũ nào bị vỡ vì schema mới.

Validation:

- Apply migration trên Supabase/local nếu có môi trường.
- `npm run build`.

### Phase 2 - Types và domain constants

Mục tiêu:

- Thêm type chuẩn cho hệ thống mới.

Checklist:

- Tạo `types/inventory.ts` hoặc thêm nhóm type rõ trong `types.ts`.
- Định nghĩa `InventoryDocumentType`.
- Định nghĩa `InventoryDocumentStatus`.
- Định nghĩa `StockMovementType`.
- Định nghĩa `StockBalanceState`.
- Định nghĩa `ItemType`.
- Định nghĩa DTO cho create/approve/issue/receive/audit/report.
- Cập nhật `types/supabase.ts` nếu đang dùng generated/manual types.
- Tạo helper map label tiếng Việt cho status/type.

Acceptance:

- Không dùng string rải rác cho status mới.
- UI dùng helper label chung.
- Không thêm `any` không cần thiết.

Validation:

- `npm run build`.

### Phase 3 - RPC transaction và inventory service

Mục tiêu:

- Mọi biến động tồn đi qua transaction chuẩn.

Checklist:

- Tạo migration `016_inventory_rpc.sql`.
- Viết function/RPC dùng transaction mặc định của PostgreSQL.
- RPC `post_stock_movement`.
- RPC `create_stock_receipt`.
- RPC `submit_requisition`.
- RPC `approve_requisition`.
- RPC `issue_requisition`.
- RPC `confirm_requisition_received`.
- RPC `post_stock_adjustment`.
- RPC `complete_stock_audit`.
- RPC `rebuild_stock_balances`.
- Tạo `services/inventoryDocumentsService.ts`.
- Tạo `services/stockService.ts`.
- Tạo `services/reportsService.ts` phần nền.
- Giữ adapter trong `supabaseService.ts` nếu component cũ còn import từ đó.

Acceptance:

- Tạo nhập kho mới sinh document, item, movement, balance đúng.
- Xuất kho không vượt tồn.
- Nếu bất kỳ bước nào lỗi, không có dữ liệu nửa vời.
- `stock_balances` khớp tổng movement.

Validation:

- Script kiểm tra logic nếu có thể tạo trong `scripts/`.
- `npm run build`.

### Phase 4 - Migration dữ liệu legacy

Mục tiêu:

- Chuyển dữ liệu cũ sang hệ mới đủ để báo cáo và vận hành tiếp.

Checklist:

- Viết migration/script map `goods_receipt_notes` -> `inventory_documents(stock_receipt)`.
- Map `receipt_items` -> `inventory_document_items` + `stock_movements(IN)`.
- Map `requisition_forms` -> `inventory_documents(requisition)`.
- Map requisition đã duyệt/hoàn thành -> `stock_movements(OUT)` theo trạng thái phù hợp.
- Map `inventory_audits` -> `inventory_documents(stock_audit)`.
- Map `inventory_transactions` -> movement tương ứng.
- Map `defective_items`/`repair_batches` -> defective/repair documents nếu đủ dữ liệu.
- Chạy `rebuild_stock_balances`.
- Không xóa bảng legacy.

Acceptance:

- Dữ liệu cũ vẫn xem được.
- Báo cáo mới có số liệu từ dữ liệu cũ.
- Có cờ `legacy_table`, `legacy_id` để truy vết.
- Không duplicate movement nếu script chạy lại.

Validation:

- So sánh tổng tồn cũ `variants.stock` với `stock_balances.available`.
- Ghi danh sách lệch nếu có.
- `npm run build`.

### Phase 5 - Rebuild luồng yêu cầu mobile

Mục tiêu:

- Mobile trở thành luồng chính cho khu gửi yêu cầu.

Checklist:

- Tạo/refactor feature folder `components/requisitions/` nếu phù hợp.
- Màn hình chọn vật tư mobile-first.
- Tìm kiếm theo tên, SKU, danh mục, thuộc tính.
- Bộ lọc vật tư thường dùng.
- Giỏ yêu cầu hỗ trợ nhiều nhóm mục đích.
- Form gửi phiếu: khu, người yêu cầu, ngày cần, ghi chú.
- Hỗ trợ đổi/hỏng: mô tả, ảnh, vật tư trả về.
- Lưu draft localStorage khi chưa gửi.
- Submit qua RPC/service mới.
- Danh sách phiếu mobile dạng tab theo status.
- Chi tiết phiếu có timeline.

Acceptance:

- Viewport 360px không tràn layout.
- Có loading/error/empty states.
- Không mất giỏ khi đóng modal ngoài ý muốn.
- Gửi phiếu thành công có mã phiếu.
- Build pass.

Validation:

- `npm run build`.
- Kiểm tra thủ công mobile viewport nếu có login/session.

### Phase 6 - Rebuild duyệt và xuất kho

Mục tiêu:

- Quản kho xử lý phiếu nhanh, đúng tồn, có lịch sử.

Checklist:

- Màn hình hàng đợi phiếu chờ duyệt.
- Chi tiết phiếu cho quản kho.
- Hiển thị tồn khả dụng từng dòng.
- Cho phép duyệt đủ, duyệt một phần, từ chối dòng, ghi chú.
- Nếu bật reservation, duyệt tạo `RESERVE`.
- Xuất kho tạo `OUT` và event.
- In phiếu xuất sau khi xuất.
- Khu xác nhận nhận hàng.
- Xử lý nhận thiếu/sai số lượng.

Acceptance:

- Không xuất vượt tồn khả dụng.
- Duyệt một phần giữ nguyên số yêu cầu ban đầu.
- Timeline thể hiện đủ action.
- Desktop và mobile đều xử lý được, mobile ưu tiên thao tác nhanh.

Validation:

- `npm run build`.
- Test thủ công các case: đủ tồn, thiếu tồn, xuất một phần, hủy.

### Phase 7 - Rebuild nhập kho

Mục tiêu:

- Phiếu nhập kho dùng schema mới và phục vụ báo cáo chuẩn.

Checklist:

- Tạo supplier CRUD.
- Tạo form nhập kho desktop tốt, mobile vẫn dùng được.
- Chọn vật tư, số lượng, đơn giá, lô, hạn dùng.
- Cho phép thêm nhanh nhà cung cấp.
- Cho phép đính kèm ảnh hóa đơn nếu storage đã có nền.
- Xác nhận nhập qua RPC `create_stock_receipt`.
- Danh sách phiếu nhập có filter/search.
- Chi tiết phiếu nhập có in/xuất Excel.

Acceptance:

- Nhập kho tăng `stock_balances.available`.
- Báo cáo nhập trong kỳ lấy được phiếu.
- Không còn logic nhập kho chỉ insert receipt mà không ghi movement.

Validation:

- `npm run build`.
- Test nhập nhiều vật tư, nhập lô/hạn dùng, nhập thiếu đơn giá.

### Phase 8 - Rebuild hàng hỏng, đổi mới, sửa chữa

Mục tiêu:

- Quản lý đầy đủ vòng đời vật tư hỏng/sửa.

Checklist:

- Chuẩn hóa `item_type` trên vật tư.
- Màn hình báo hỏng/đổi hàng từ phiếu yêu cầu.
- Màn hình hàng hỏng trong kho.
- Tạo phiếu xuất đi sửa.
- Tạo phiếu nhập hàng đã sửa.
- Tạo phiếu thanh lý/bỏ.
- Ghi movement `RETURN_DEFECTIVE`, `REPAIR_OUT`, `REPAIR_IN`, `DISPOSAL`.
- Thống kê hàng hỏng theo khu/vật tư.

Acceptance:

- Hàng hỏng không tính vào `available`.
- Hàng đang sửa không tính vào `available`.
- Nhập sửa xong mới tăng `available`.
- Có lịch sử ảnh/mô tả/lý do.

Validation:

- `npm run build`.
- Test đổi motor: xuất motor mới, nhận motor hỏng, gửi sửa, nhập lại.

### Phase 9 - Rebuild kiểm kê

Mục tiêu:

- Kiểm kê không chỉ lưu số đếm mà điều chỉnh tồn đúng.

Checklist:

- Tạo phiếu kiểm kê từ `stock_balances`.
- Snapshot tồn hệ thống lúc bắt đầu.
- Mobile UI nhập số thực tế nhanh.
- Desktop UI table/filter/export.
- Dòng lệch bắt buộc lý do.
- Complete audit tạo `stock_adjustment`.
- Adjustment ghi `ADJUST` và update balance.
- In phiếu kiểm kê.

Acceptance:

- Hoàn thành kiểm kê làm tồn đúng số thực tế.
- Chênh lệch có lý do.
- Có báo cáo chênh lệch kiểm kê.

Validation:

- `npm run build`.
- Test tăng, giảm, bằng nhau, bỏ trống dòng.

### Phase 10 - Reports/dashboard/export/print

Mục tiêu:

- Báo cáo đủ để quản lý kho thực tế.

Checklist:

- `reportsService.getInventoryMovementReport`.
- `reportsService.getStockOnHandReport`.
- `reportsService.getZoneConsumptionReport`.
- `reportsService.getLowStockReport`.
- `reportsService.getDefectiveRepairReport`.
- `reportsService.getSupplierPurchaseReport`.
- `reportsService.getStockCard`.
- Dashboard desktop.
- Dashboard mobile rút gọn.
- Xuất Excel nhiều sheet.
- In PDF/browser print cho phiếu.

Acceptance:

- Filter ngày/khu/danh mục/vật tư hoạt động.
- Số liệu khớp movement/balance.
- Excel có tiếng Việt rõ ràng.
- Print không vỡ layout trên A4.

Validation:

- `npm run build`.
- So sánh vài phiếu mẫu với báo cáo tổng.

### Phase 11 - UX polish và performance

Mục tiêu:

- App dùng mượt trên điện thoại và desktop.

Checklist:

- Audit tất cả màn hình kho ở viewport 360px, 390px, 768px, desktop.
- Loại bỏ table không responsive ở mobile.
- Tối ưu search/filter lớn.
- Pagination hoặc query theo kỳ cho danh sách phiếu.
- Lazy load màn hình admin/report nặng.
- Giảm rerender không cần thiết.
- Loading skeleton/empty states.
- Toast nhất quán.
- Chuẩn hóa icon/button/tabs.

Acceptance:

- Mobile không tràn ngang.
- Desktop report không quá chậm khi nhiều phiếu.
- Bundle không tăng vô lý.

Validation:

- `npm run build`.
- Visual check nếu có thể đăng nhập.

### Phase 12 - Security, RLS, cleanup legacy

Mục tiêu:

- Khóa quyền đúng và dọn dần phần cũ.

Checklist:

- Rà toàn bộ RLS policy mới.
- Rà policy cũ đang `true`.
- Đảm bảo requester chỉ thao tác phiếu/khu phù hợp.
- Manager/auditor/admin đúng quyền.
- Không expose secret.
- Deprecate service cũ.
- Xóa adapter cũ khi không còn dùng.
- Cập nhật README/AGENTS nếu cần.
- Xóa code chết sau khi chắc chắn không còn import.

Acceptance:

- Không có luồng nhạy cảm chỉ dựa vào client role.
- Không còn hai nguồn tồn kho cùng được update bởi code mới.
- Legacy table được giữ để audit hoặc đã có migration cleanup rõ.

Validation:

- `npm run build`.
- Kiểm tra role thủ công.
- `rg` tìm import/service cũ trước khi xóa.

## 14. Thứ Tự Ưu Tiên Triển Khai Thực Tế

Nếu cần chia việc cho nhiều agent, dùng thứ tự này:

1. Agent A: Phase 0 audit + mapping legacy.
2. Agent B: Phase 1 schema core.
3. Agent C: Phase 2 types/constants.
4. Agent D: Phase 3 RPC + service mới.
5. Agent E: Phase 5 requisition mobile.
6. Agent F: Phase 6 approve/issue/receive.
7. Agent G: Phase 7 receipt/supplier.
8. Agent H: Phase 8 defective/repair.
9. Agent I: Phase 9 audit/adjustment.
10. Agent J: Phase 10 reports/export/print.
11. Agent K: Phase 11 UX/performance.
12. Agent L: Phase 12 security/cleanup.

Không cho nhiều agent cùng sửa một component lớn nếu không có người điều phối merge.

## 15. Mapping Legacy Sang Hệ Mới

Bảng cũ -> bảng mới:

```text
goods_receipt_notes
  -> inventory_documents(document_type='stock_receipt')

receipt_items
  -> inventory_document_items
  -> stock_movements(movement_type='IN')

requisition_forms
  -> inventory_documents(document_type='requisition')

requisition_items
  -> inventory_document_items
  -> stock_movements(movement_type='OUT') nếu phiếu đã xuất/hoàn thành

inventory_audits
  -> inventory_documents(document_type='stock_audit')

inventory_audit_items
  -> inventory_document_items
  -> stock_movements(movement_type='ADJUST') nếu đã hoàn thành và có lệch

inventory_transactions
  -> stock_movements theo type tương ứng

defective_items
  -> inventory_documents(document_type='defective_return') hoặc metadata của document/item

repair_batches
  -> inventory_documents(document_type='repair_issue'/'repair_return')
```

Quy tắc migration:

- Có `legacy_table`, `legacy_id`.
- Script/migration phải idempotent nếu có thể.
- Không tạo trùng document khi chạy lại.
- Sau migration phải có báo cáo đối chiếu.

## 16. Quy Tắc Mã Phiếu

Định dạng:

```text
YC-YYYY-000001   Phiếu yêu cầu
PNK-YYYY-000001  Phiếu nhập kho
PXK-YYYY-000001  Phiếu xuất kho
PKK-YYYY-000001  Phiếu kiểm kê
PDC-YYYY-000001  Phiếu điều chỉnh
PTH-YYYY-000001  Phiếu trả hàng
PSC-YYYY-000001  Phiếu sửa chữa
PTL-YYYY-000001  Phiếu thanh lý
```

Triển khai:

- Tạo bảng `document_sequences` hoặc RPC sinh mã theo năm/loại.
- Sinh mã trong transaction.
- Không sinh mã chỉ bằng frontend.

## 17. Definition Of Done Toàn Dự Án

Hệ thống được coi là hoàn chỉnh khi:

- Tất cả nhập/xuất/trả/sửa/kiểm kê đều ghi vào `stock_movements`.
- `stock_balances` khớp sổ kho.
- Phiếu yêu cầu mobile dùng tốt.
- Quản kho duyệt/xuất/nhận rõ ràng.
- Vật tư hỏng/sửa không lẫn tồn khả dụng.
- Kiểm kê sinh điều chỉnh tồn.
- Báo cáo xuất nhập tồn đúng theo kỳ.
- Có in/xuất file cho phiếu chính.
- Quyền user được kiểm soát cả UI và database.
- Code service được tách đủ rõ, không tiếp tục phình một file lớn.
- `npm run build` pass.
- Không introduce secret hoặc dependency không cần thiết.

## 18. Checklist Cho Mỗi PR/Task Agent

Mỗi agent khi triển khai một task phải báo:

```text
Implemented:
- ...

Changed:
- ...

Validation:
- npm run build: passed/failed/not run
- Other checks: ...

Notes:
- Data migration/RLS/mobile/report implications
```

Trước khi sửa:

- Chạy `git status --short`.
- Đọc file liên quan.
- Không revert thay đổi không phải của mình.

Sau khi sửa:

- Chạy `npm run build` nếu có code/schema/type ảnh hưởng app.
- Chạy `git diff --check` trước khi commit nếu có commit.
- Kiểm tra mobile layout nếu task đụng UI.

## 19. Rủi Ro Cần Tránh

- Vừa dùng `variants.stock`, vừa dùng `stock_balances` làm nguồn chính mà không có sync rõ.
- Update tồn kho trong component React.
- Tạo phiếu xong nhưng movement lỗi, hoặc movement thành công nhưng balance lỗi.
- Xóa bảng legacy quá sớm.
- Status tiếng Việt/tiếng Anh trộn lẫn không có mapping.
- Dùng `any` để né lỗi type trong service mới.
- Mở RLS quá rộng.
- Tạo UI desktop trước rồi vá mobile sau.
- Báo cáo tính từ phiếu thay vì từ sổ kho, dẫn tới lệch số.

## 20. Hướng Triển Khai Khuyến Nghị Ngay Sau Plan

Task đầu tiên nên giao cho agent:

```text
Audit current inventory-related schema/services/components and create a legacy-to-new-system mapping for the warehouse rebuild plan. Do not change runtime behavior yet. Focus on requisitions, receipts, audits, defective items, repair batches, delivery notes, variants.stock, and existing reports. Return a concise implementation-ready mapping and risks before Phase 1.
```

Task code đầu tiên sau audit:

```text
Implement Phase 1 inventory core schema in a new Supabase migration. Add suppliers, warehouses, inventory_documents, inventory_document_items, stock_movements, stock_balances, document_events, document code sequence support, indexes, triggers, and minimal RLS. Do not remove legacy tables or update UI yet. Validate that the migration is syntactically consistent with the existing migrations.
```

## 21. Tiến Độ Triển Khai

Đã triển khai bước nền:

- Thêm migration `supabase/migrations/015_inventory_core.sql`.
- Thêm core tables: `suppliers`, `warehouses`, `document_sequences`, `inventory_documents`, `inventory_document_items`, `stock_movements`, `stock_balances`, `document_events`.
- Thêm cấu hình vật tư trên `variants`: `sku`, `min_stock`, `max_stock`, `item_type`.
- Thêm functions/RPC: `next_inventory_document_code`, `create_inventory_document`, `post_stock_movement`, `create_stock_receipt`, `rebuild_stock_balances`.
- Thêm reporting views: `inventory_stock_on_hand`, `low_stock_items`.
- Thêm `types/inventory.ts`.
- Thêm `services/inventoryCoreService.ts`.
- Nối song song phiếu nhập legacy sang `create_stock_receipt`.
- Nối song song phiếu yêu cầu legacy sang `inventory_documents(document_type='requisition')`.
- Nối song song fulfill phiếu yêu cầu legacy sang phiếu xuất core và movement `OUT`.
- Nối song song hoàn thành kiểm kê legacy sang phiếu điều chỉnh core và movement `ADJUST`.
- Thêm migration `supabase/migrations/016_inventory_legacy_backfill.sql` để backfill dữ liệu legacy sang document/ledger mới.
- Thêm migration `supabase/migrations/017_inventory_stock_issue_rpc.sql` với RPC `create_stock_issue` để tạo phiếu xuất và movement `OUT` trong cùng transaction.
- Thêm migration `supabase/migrations/018_inventory_stock_adjustment_rpc.sql` với RPC `create_stock_adjustment` để ghi điều chỉnh kiểm kê trong cùng transaction.
- Thêm view `inventory_legacy_stock_reconciliation` để đối chiếu `variants.stock` với `stock_balances.available`.
- Thêm panel `WarehouseCoreStatus` trong tab dashboard admin để xem tồn thấp và chênh lệch legacy/core.
- Mở rộng `WarehouseCoreStatus` để xem nhanh các dòng tồn khả dụng từ `stock_balances`.
- Thêm tab admin `Sổ kho mới` với màn `InventoryCoreWorkspace` để xem tồn khả dụng, phiếu kho và phát sinh gần nhất từ core ledger.
- Thêm modal chi tiết phiếu kho và chức năng in phiếu từ `InventoryCoreWorkspace`.
- Thêm form tạo phiếu nhập kho trực tiếp trên core ledger qua RPC `create_stock_receipt`.
- Thêm form tạo phiếu xuất kho trực tiếp trên core ledger qua RPC `create_stock_issue`, có kiểm tra tồn khả dụng trước khi lưu.
- Thêm form tạo phiếu yêu cầu vật tư trực tiếp trên core ledger qua RPC `create_inventory_document`.
- Thêm hành động `Xuất theo phiếu` trong chi tiết phiếu yêu cầu để tạo phiếu xuất core và cập nhật trạng thái yêu cầu.
- Thêm màn mobile riêng `CoreRequisitionPage` tại `/warehouse/request` để các khu gửi yêu cầu vật tư trực tiếp vào core ledger.
- Thêm lối vào `Tạo yêu cầu` trên bottom navigation và desktop navigation.
- Thêm màn `CoreRequisitionListPage` tại `/warehouse/requisitions` để xem, lọc, duyệt, hủy và xác nhận nhận vật tư cho phiếu yêu cầu core.
- Thêm hành động `Xuất kho` trực tiếp trong `CoreRequisitionListPage` cho phiếu đã duyệt, có kiểm tra tồn khả dụng và gọi RPC `create_stock_issue`.
- Thêm chức năng `In phiếu` trong chi tiết phiếu yêu cầu core.
- Chuyển lối vào `Phiếu yêu cầu` trên bottom navigation, desktop navigation và notification header sang danh sách yêu cầu core.
- Thêm `CoreInventoryAuditSection` cho kiểm kê core mobile-first: đọc `stock_balances`, nhập số thực tế, tự tính lệch và ghi `create_stock_adjustment`.
- Chuyển tab admin `Kiểm kê hàng hoá` sang màn kiểm kê core.
- Chuyển sync xuất kho từ legacy `fulfillRequisition` sang RPC atomic `create_stock_issue`, không còn tạo document rồi post từng movement từ frontend.
- Chuyển sync điều chỉnh kiểm kê legacy sang RPC atomic `create_stock_adjustment`.
- Thêm `services/reportsService.ts` đọc trực tiếp từ `stock_movements`, `stock_balances` và view `inventory_stock_on_hand`.
- Thêm màn `InventoryCoreReports` với tab admin `Báo cáo kho`: báo cáo xuất nhập tồn, tồn hiện tại, cảnh báo tồn thấp, thẻ kho vật tư, tiêu hao theo khu + xuất Excel.
- Thêm lịch sử kiểm kê/điều chỉnh trong màn kiểm kê core (`CoreInventoryAuditSection`).
- Thêm liên kết phiếu xuất liên quan trong chi tiết phiếu yêu cầu core (`CoreRequisitionListPage`).
- Thêm migration `supabase/migrations/019_inventory_defect_repair_rpc.sql` với RPC `create_defective_return`, `create_repair_issue`, `create_repair_return`, `create_disposal`.
- Thêm màn `CoreDefectManagement` (tab Sự cố & Sửa chữa) ghi trả hàng hỏng / xuất sửa / nhập sau sửa / thanh lý vào core ledger, kèm tổng hợp tồn theo trạng thái.
- Phase 12: bỏ theo dõi `.env` trong git (chứa Gemini key), cập nhật `env.example` và `AGENTS.md` (core ledger, RLS placeholder, migration 019).

Trạng thái hiện tại:

- App vẫn giữ UI/luồng legacy để không vỡ vận hành.
- Supabase đã apply thành công migration `015`, `016`, `017`, `018`.
- Core ledger mới đã có schema, backfill và RPC atomic cho nhập kho, xuất kho, điều chỉnh kiểm kê.
- Các bước tiếp theo có thể triển khai trực tiếp trên core ledger, không cần chờ apply migration nền nữa.
- `npm run build` đã pass sau các thay đổi nền.
- Dashboard admin có panel theo dõi core ledger.
- Tab admin `Sổ kho mới` đã xem tồn, xem phiếu, xem phát sinh, in phiếu, tạo phiếu nhập và tạo phiếu xuất trực tiếp bằng core ledger.
- Luồng yêu cầu core đã có đường tạo yêu cầu trong màn mobile riêng và đường xuất theo yêu cầu trong `Sổ kho mới`.
- Danh sách yêu cầu core đã xử lý được chuỗi thao tác chính: chờ duyệt -> duyệt -> xuất kho -> xác nhận đã nhận.
- Danh sách yêu cầu core đã in được phiếu yêu cầu.
- Danh sách yêu cầu chính trong navigation đã ưu tiên core ledger.
- Kiểm kê chính trong admin đã ưu tiên core ledger, dùng RPC điều chỉnh thay vì luồng legacy.
- Luồng legacy vẫn còn tồn tại trong app, nhưng nhập/xuất core đã có đường thao tác trực tiếp để thay thế dần.
- Báo cáo kho core (xuất nhập tồn, tồn hiện tại, tồn thấp, thẻ kho, tiêu hao theo khu) đã đọc từ sổ kho mới và có xuất Excel.
- Phase 8 (hàng hỏng/sửa/thanh lý) đã có RPC + UI core; migration `019` cần được apply trên Supabase để dùng được.
- `.env` không còn bị git track (tránh lộ Gemini key về sau); key cũ vẫn nằm trong lịch sử git — nên xoay (rotate) key Gemini.

Việc nên làm tiếp:

- Dùng view `inventory_legacy_stock_reconciliation` để rà lệch `variants.stock` với `stock_balances`.
- Nếu còn lệch lớn sau backfill, viết script xử lý từng case trước khi bỏ legacy stock.
- Bổ sung liên kết phiếu xuất liên quan trong chi tiết phiếu yêu cầu core. (đã xong)
- Bổ sung lịch sử phiếu kiểm kê/điều chỉnh trong màn kiểm kê core. (đã xong)
- Tạo dashboard/report đọc từ `inventory_stock_on_hand`, `low_stock_items`, `stock_movements`. (đã xong - tab Báo cáo kho)
- Triển khai Phase 8: luồng hàng hỏng/đổi mới/sửa chữa/thanh lý trên core ledger (RPC + UI). (đã xong - cần apply migration 019)
- Triển khai Phase 11/12: UX polish, rà RLS và dọn legacy dần.
