# Supabase Migrations

Thư mục này chứa database migrations cho K-MTP-Pro.

## 📁 Structure

```
supabase/
└── migrations/
    └── 001_initial_schema.sql    # Initial database schema
```

## 🗄️ Migrations

### 001_initial_schema.sql

**Created**: 2025-11-03
**Status**: ✅ Ready to use

**Tạo các bảng:**
- `users` - Người dùng
- `categories` - Danh mục
- `zones` - Khu vực
- `products` - Sản phẩm
- `variants` - Biến thể
- `variant_components` - Thành phần composite
- `requisition_forms` - Phiếu yêu cầu
- `requisition_items` - Chi tiết phiếu yêu cầu
- `goods_receipt_notes` - Phiếu nhập kho
- `receipt_items` - Chi tiết phiếu nhập
- `delivery_notes` - Phiếu giao nhận
- `delivery_items` - Chi tiết phiếu giao
- `delivery_history` - Lịch sử giao hàng
- `delivery_verification` - Xác nhận giao hàng
- `delivery_quality` - Đánh giá chất lượng

**Features:**
- ✅ Foreign key constraints
- ✅ Indexes cho performance
- ✅ Auto-update triggers
- ✅ Check constraints
- ✅ Ready for Row Level Security

## [object Object]ách sử dụng

### Option 1: Supabase Dashboard (Khuyến nghị)

1. Vào https://app.supabase.com
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Click **"New query"**
5. Copy toàn bộ nội dung từ `001_initial_schema.sql`
6. Paste vào editor
7. Click **"Run"** (hoặc Ctrl+Enter)
8. Thấy "Success" là xong!

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

## ✅ Verification

Sau khi chạy migration, kiểm tra:

1. Vào **Table Editor**
2. Bạn sẽ thấy 15 bảng
3. Click vào từng bảng để xem structure
4. Verify foreign keys và indexes

## 🔄 Rollback

Nếu cần rollback:

```sql
-- Drop all tables (CẢNH BÁO: Sẽ mất dữ liệu!)
DROP TABLE IF EXISTS delivery_quality CASCADE;
DROP TABLE IF EXISTS delivery_verification CASCADE;
DROP TABLE IF EXISTS delivery_history CASCADE;
DROP TABLE IF EXISTS delivery_items CASCADE;
DROP TABLE IF EXISTS delivery_notes CASCADE;
DROP TABLE IF EXISTS receipt_items CASCADE;
DROP TABLE IF EXISTS goods_receipt_notes CASCADE;
DROP TABLE IF EXISTS requisition_items CASCADE;
DROP TABLE IF EXISTS requisition_forms CASCADE;
DROP TABLE IF EXISTS variant_components CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

## 📊 Schema Diagram

```
users

categories ──┐
             │
             ▼
products ──► variants ──┬──► requisition_items ──► requisition_forms
                        │
                        ├──► receipt_items ──────► goods_receipt_notes
                        │
                        └──► delivery_items ─────► delivery_notes
                                                         │
                                                         ├─► delivery_history
                                                         ├─► delivery_verification
                                                         └─► delivery_quality
zones
```

## 🔒 Security

### Row Level Security (RLS)

Schema đã sẵn sàng cho RLS nhưng chưa enable. Để enable:

```sql
-- Enable RLS cho từng bảng
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ... và các bảng khác

-- Tạo policies (ví dụ)
CREATE POLICY "Allow public read" ON products
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to modify" ON products
  FOR ALL USING (auth.role() = 'authenticated');
```

## 📚 Documentation

- [Quick Start](../BAT_DAU_NHANH.md)
- [Setup Guide](../SUPABASE_SETUP.md)
- [Technical Summary](../SETUP_SUMMARY.md)

## 🆘 Troubleshooting

### "relation already exists"

Migration đã chạy rồi. Nếu muốn chạy lại:
1. Drop tất cả tables (xem phần Rollback)
2. Chạy lại migration

### "permission denied"

Đảm bảo bạn đang dùng đúng project và có quyền admin.

### "syntax error"

Copy lại toàn bộ SQL, đảm bảo không bị thiếu ký tự.

## 📝 Notes

- Migration này tạo schema cơ bản
- Chưa có sample data
- Chưa enable RLS
- Indexes đã được tạo sẵn
- Triggers đã được setup

## 🔄 Future Migrations

Khi cần thêm migrations mới:

```
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_add_new_feature.sql      # Future
    └── 003_modify_existing.sql      # Future
```

Đặt tên theo format: `XXX_description.sql`

---

**Last Updated**: 2025-11-03
**Version**: 1.0.0
**Status**: ✅ Ready

