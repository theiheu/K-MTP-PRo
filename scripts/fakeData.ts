import { supabase } from '../lib/supabase';
import {
  productsService,
  categoriesService,
  zonesService,
  requisitionsService,
  receiptsService,
  usersService
} from '../services/supabaseService';

export async function generateFakeData() {
  console.log('Bắt đầu tạo dữ liệu mẫu...');

  try {
    // 1. Tạo Danh Mục
    console.log('1. Đang tạo danh mục...');
    const categories = [
      { name: 'Thức ăn', icon: '🌽' },
      { name: 'Thuốc thú y', icon: '💊' },
      { name: 'Dụng cụ', icon: '🔧' }
    ];
    for (const cat of categories) {
      try { await categoriesService.create(cat as any); } catch (e) { /* ignore duplicate */ }
    }

    // 2. Tạo Khu Vực
    console.log('2. Đang tạo khu vực...');
    const zones = ['Khu A', 'Khu B', 'Khu Úm'];
    for (const zone of zones) {
      try { await zonesService.create({ name: zone, description: '' }); } catch (e) {}
    }

    // 3. Tạo User
    console.log('3. Đang tạo người dùng...');
    try { await usersService.create({ name: 'admin123', role: 'manager' } as any); } catch (e) {}
    try { await usersService.create({ name: 'nhanvienA', role: 'requester', zone: 'Khu A' } as any); } catch (e) {}

    // 4. Tạo Sản Phẩm & Biến thể
    console.log('4. Đang tạo sản phẩm...');
    let p1, p2, p3;
    try {
      p1 = await productsService.create({
        name: 'Cám Gà Con',
        description: 'Cám hỗn hợp cho gà từ 1-21 ngày tuổi',
        images: ['https://placehold.co/400?text=Cam+Ga+Con'],
        category: 'Thức ăn',
        options: ['Trọng lượng'],
        variants: [
          { attributes: { 'Trọng lượng': '25kg' }, stock: 50, price: 300000, unit: 'Bao', images: [] },
          { attributes: { 'Trọng lượng': '50kg' }, stock: 10, price: 580000, unit: 'Bao', images: [] }
        ]
      } as any);
    } catch(e: any) { console.error('Lỗi tạo SP 1', e); }

    try {
      p2 = await productsService.create({
        name: 'Vắc xin H5N1',
        description: 'Vắc xin phòng cúm gia cầm',
        images: ['https://placehold.co/400?text=Vac+xin'],
        category: 'Thuốc thú y',
        options: ['Dung tích'],
        variants: [
          { attributes: { 'Dung tích': '500 liều' }, stock: 5, price: 150000, unit: 'Lọ', images: [] } // Tồn kho thấp để kích hoạt cảnh báo
        ]
      } as any);
    } catch(e: any) { console.error('Lỗi tạo SP 2', e); }

    try {
      p3 = await productsService.create({
        name: 'Máng ăn nhựa',
        description: 'Máng ăn chống bới',
        images: ['https://placehold.co/400?text=Mang+an'],
        category: 'Dụng cụ',
        options: ['Màu sắc'],
        variants: [
          { attributes: { 'Màu sắc': 'Đỏ' }, stock: 100, price: 20000, unit: 'Cái', images: [] },
          { attributes: { 'Màu sắc': 'Vàng' }, stock: 150, price: 20000, unit: 'Cái', images: [] }
        ]
      } as any);
    } catch(e: any) { console.error('Lỗi tạo SP 3', e); }

    // 5. Tạo Phiếu Nhập Kho
    console.log('5. Đang tạo phiếu nhập kho...');
    if (p1 && p1.variants && p1.variants.length > 0) {
      await receiptsService.create({
        supplier: 'Công ty Cám CP',
        notes: 'Nhập hàng đầu tháng',
        createdBy: 'admin123',
        items: [
          { productId: p1.id, variantId: p1.variants[0].id, quantity: 100 },
          { productId: p1.id, variantId: p1.variants[1].id, quantity: 50 }
        ]
      });
    }

    // 6. Tạo Phiếu Xuất Kho (Requisitions)
    console.log('6. Đang tạo phiếu xuất kho...');
    if (p1 && p2 && p3) {
      // Phiếu đã hoàn thành
      await requisitionsService.create({
        requesterName: 'nhanvienA',
        zone: 'Khu A',
        purpose: 'Cho gà ăn sáng',
        status: 'Đã hoàn thành',
        fulfilledBy: 'admin123',
        fulfilledAt: new Date().toISOString(),
        items: [
          { 
            product: p1 as any, 
            variant: p1.variants[0] as any, 
            quantity: 5 
          }
        ]
      });

      // Phiếu đang chờ xử lý
      await requisitionsService.create({
        requesterName: 'nhanvienA',
        zone: 'Khu A',
        purpose: 'Thay máng vỡ và tiêm vắc xin',
        status: 'Đang chờ xử lý',
        items: [
          { 
            product: p2 as any, 
            variant: p2.variants[0] as any, 
            quantity: 2 
          },
          { 
            product: p3 as any, 
            variant: p3.variants[0] as any, 
            quantity: 10 
          }
        ]
      });
    }

    console.log('✅ Hoàn tất tạo dữ liệu mẫu! Hãy tải lại trang để xem kết quả.');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  }
}

// Gắn vào window để gọi từ Console
if (typeof window !== 'undefined') {
  (window as any).generateFakeData = generateFakeData;
}
