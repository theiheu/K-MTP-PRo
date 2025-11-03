# Hướng dẫn Setup Supabase cho K-MTP-Pro

## Bước 1: Cài đặt Dependencies

Chạy lệnh sau để cài đặt Supabase client:

```bash
bun add @supabase/supabase-js
```

hoặc nếu dùng npm:

```bash
npm install @supabase/supabase-js
```

## Bước 2: Tạo Project trên Supabase

1. Truy cập [https://app.supabase.com](https://app.supabase.com)
2. Đăng nhập hoặc tạo tài khoản mới
3. Click "New Project"
4. Điền thông tin:
   - **Name**: K-MTP-Pro (hoặc tên bạn muốn)
   - **Database Password**: Tạo mật khẩu mạnh (lưu lại để sử dụng sau)
   - **Region**: Chọn region gần nhất (ví dụ: Southeast Asia - Singapore)
5. Click "Create new project" và đợi vài phút để Supabase khởi tạo

## Bước 3: Lấy API Keys

1. Sau khi project được tạo, vào **Settings** > **API**
2. Bạn sẽ thấy:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Bước 4: Tạo file .env

1. Tạo file `.env` trong thư mục gốc của project
2. Copy nội dung từ file `env.example`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Thay thế `xxxxxxxxxxxxx` bằng URL và key thực tế từ Supabase

## Bước 5: Chạy Database Migrations

1. Vào Supabase Dashboard > **SQL Editor**
2. Click "New query"
3. Copy toàn bộ nội dung từ file `supabase/migrations/001_initial_schema.sql`
4. Paste vào SQL Editor
5. Click "Run" để tạo tất cả các bảng

## Bước 6: Seed Data (Tùy chọn)

Nếu bạn muốn import dữ liệu từ localStorage hiện tại:

1. Mở DevTools trong trình duyệt (F12)
2. Vào tab **Console**
3. Chạy script sau để export dữ liệu:

```javascript
const data = {
  products: JSON.parse(localStorage.getItem("chicken_farm_products") || "[]"),
  categories: JSON.parse(
    localStorage.getItem("chicken_farm_categories") || "[]"
  ),
  zones: JSON.parse(localStorage.getItem("chicken_farm_zones") || "[]"),
  requisitions: JSON.parse(
    localStorage.getItem("chicken_farm_requisitions") || "[]"
  ),
  receipts: JSON.parse(localStorage.getItem("chicken_farm_receipts") || "[]"),
  deliveryNotes: JSON.parse(
    localStorage.getItem("chicken_farm_delivery_notes") || "[]"
  ),
};
console.log(JSON.stringify(data, null, 2));
```

4. Copy kết quả và lưu vào file `data-export.json`
5. Sau đó bạn có thể tạo script để import vào Supabase

## Bước 7: Test Connection

1. Khởi động dev server:

```bash
bun run dev
```

2. Mở trình duyệt và kiểm tra Console
3. Nếu không có lỗi về Supabase, connection đã thành công!

## Bước 8: Migration từ localStorage sang Supabase

Để migrate dữ liệu, bạn cần:

1. **Tạo migration script** để chuyển đổi dữ liệu từ localStorage format sang Supabase format
2. **Update App.tsx** để sử dụng Supabase services thay vì localStorage
3. **Test kỹ** trước khi deploy production

### Ví dụ sử dụng Supabase Service:

```typescript
import { productsService } from "./services/supabaseService";

// Lấy tất cả sản phẩm
const products = await productsService.getAll();

// Tạo sản phẩm mới
const newProduct = await productsService.create({
  name: "Sản phẩm mới",
  description: "Mô tả",
  images: [],
  category: "Danh mục",
  options: [],
  variants: [],
});

// Cập nhật sản phẩm
await productsService.update(updatedProduct);

// Xóa sản phẩm
await productsService.delete(productId);
```

## Bước 9: Enable Row Level Security (RLS) - Tùy chọn

Nếu bạn muốn bảo mật dữ liệu:

1. Vào **Authentication** > **Policies**
2. Enable RLS cho từng bảng
3. Tạo policies phù hợp với yêu cầu của bạn

Ví dụ policy cho bảng `products`:

```sql
-- Allow all users to read products
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);

-- Only authenticated users can insert/update/delete
CREATE POLICY "Allow authenticated users to modify" ON products
  FOR ALL USING (auth.role() = 'authenticated');
```

## Troubleshooting

### Lỗi: "Missing Supabase environment variables"

- Kiểm tra file `.env` đã được tạo và có đúng format
- Restart dev server sau khi tạo `.env`

### Lỗi: "relation does not exist"

- Chạy lại migration script trong SQL Editor
- Kiểm tra xem tất cả bảng đã được tạo chưa

### Lỗi: "Invalid API key"

- Kiểm tra lại API key trong file `.env`
- Đảm bảo sử dụng **anon key**, không phải service_role key

## Tài liệu tham khảo

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
