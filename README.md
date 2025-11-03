# K-MTP-Pro - Hệ thống Quản lý Vật tư Trại Gà

Ứng dụng quản lý vật tư toàn diện cho trại gà, hỗ trợ quản lý sản phẩm, phiếu yêu cầu, phiếu nhập kho và phiếu giao nhận.

> **🚀 Mới setup Supabase?** → [BẮT ĐẦU TỪ ĐÂY!](START_HERE.md)

## 🚀 Tính năng

- ✅ Quản lý sản phẩm và biến thể
- ✅ Quản lý danh mục và khu vực
- ✅ Tạo và quản lý phiếu yêu cầu vật tư
- ✅ Quản lý phiếu nhập kho
- ✅ Quản lý phiếu giao nhận
- ✅ Chatbot AI hỗ trợ (Gemini)
- ✅ Responsive design (Mobile & Desktop)
- ✅ **Supabase Database Integration** (Mới!)

## 📋 Yêu cầu

- **Node.js** (v18 trở lên) hoặc **Bun**
- **Supabase Account** (miễn phí)

## 🛠️ Cài đặt

### 1. Clone repository

```bash
git clone <repository-url>
cd K-MTP-Pro
```

### 2. Cài đặt dependencies

Sử dụng Bun (khuyến nghị):

```bash
bun install
```

Hoặc sử dụng npm:

```bash
npm install
```

### 3. Setup Supabase

Xem hướng dẫn chi tiết tại: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

**Tóm tắt:**

1. Tạo project trên [Supabase](https://app.supabase.com)
2. Copy file `env.example` thành `.env`
3. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` vào `.env`
4. Chạy migration SQL trong Supabase Dashboard

### 4. Chạy ứng dụng

```bash
bun run dev
```

hoặc

```bash
npm run dev
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

## 📦 Build Production

```bash
bun run build
```

hoặc

```bash
npm run build
```

## 🗄️ Database Schema

Ứng dụng sử dụng Supabase PostgreSQL với các bảng chính:

- `users` - Quản lý người dùng
- `categories` - Danh mục sản phẩm
- `zones` - Khu vực trại
- `products` - Sản phẩm
- `variants` - Biến thể sản phẩm
- `requisition_forms` - Phiếu yêu cầu
- `goods_receipt_notes` - Phiếu nhập kho
- `delivery_notes` - Phiếu giao nhận

Xem chi tiết schema tại: `supabase/migrations/001_initial_schema.sql`

## 🔄 Migration từ localStorage

Nếu bạn đang sử dụng phiên bản cũ với localStorage:

1. Backup dữ liệu hiện tại:

```javascript
// Chạy trong Console của trình duyệt
backupLocalStorage();
```

2. Migrate sang Supabase:

```javascript
// Chạy trong Console của trình duyệt
await migrateToSupabase();
```

## 🔧 Cấu trúc thư mục

```
K-MTP-Pro/
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Library configurations
│   └── supabase.ts    # Supabase client
├── services/           # API services
│   ├── geminiService.ts
│   └── supabaseService.ts
├── supabase/
│   └── migrations/    # Database migrations
├── types/             # TypeScript types
├── utils/             # Utility functions
├── App.tsx            # Main app component
└── .env               # Environment variables (create from env.example)
```

## 🌐 Environment Variables

Tạo file `.env` với nội dung:

```env
# Gemini AI (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key

# Supabase (Required)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Sử dụng

### Đăng nhập

- Chọn vai trò: **Người yêu cầu** hoặc **Quản lý**
- Nhập tên và khu vực (nếu là người yêu cầu)

### Quản lý sản phẩm

- Vào trang **Quản lý** (dành cho Manager)
- Thêm/sửa/xóa sản phẩm, danh mục, khu vực

### Tạo phiếu yêu cầu

- Thêm sản phẩm vào giỏ hàng
- Click "Tạo phiếu yêu cầu"
- Điền thông tin và gửi

### Nhập kho

- Vào trang **Phiếu nhập kho**
- Tạo phiếu nhập mới
- Hệ thống tự động cấp phát cho các phiếu yêu cầu đang chờ

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📄 License

MIT License

## 🆘 Hỗ trợ

Nếu gặp vấn đề, vui lòng:

1. Kiểm tra [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. Xem phần Troubleshooting
3. Tạo issue trên GitHub
