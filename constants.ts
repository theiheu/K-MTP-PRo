import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Laptop Lượng Tử Pro',
    description: 'Thế hệ laptop hiệu năng cao tiếp theo, với thiết kế đẹp mắt và bộ xử lý cực nhanh.',
    price: 1499.99,
    stock: 25,
    images: [
        'https://picsum.photos/seed/laptop1/400/400',
        'https://picsum.photos/seed/laptop2/400/400',
        'https://picsum.photos/seed/laptop3/400/400'
    ],
    category: 'Điện tử',
  },
  {
    id: 2,
    name: 'Tai nghe Acoustic Bliss',
    description: 'Tai nghe chống ồn trùm tai cho trải nghiệm âm thanh đắm chìm.',
    price: 199.99,
    stock: 75,
    images: [
        'https://picsum.photos/seed/headphones1/400/400',
        'https://picsum.photos/seed/headphones2/400/400',
        'https://picsum.photos/seed/headphones3/400/400'
    ],
    category: 'Điện tử',
  },
  {
    id: 3,
    name: 'Bộ điều khiển SmartHome 360',
    description: 'Điều khiển tất cả các thiết bị thông minh của bạn từ một trung tâm điều khiển bằng giọng nói.',
    price: 129.50,
    stock: 40,
    images: [
        'https://picsum.photos/seed/smarthome1/400/400',
        'https://picsum.photos/seed/smarthome2/400/400',
        'https://picsum.photos/seed/smarthome3/400/400'
    ],
    category: 'Điện tử',
  },
  {
    id: 4,
    name: 'Áo khoác Urban Explorer',
    description: 'Một chiếc áo khoác thời trang và không thấm nước, hoàn hảo cho mọi cuộc phiêu lưu trong thành phố. Có nhiều màu sắc.',
    price: 149.99,
    stock: 150,
    images: [
        'https://picsum.photos/seed/jacket1/400/400',
        'https://picsum.photos/seed/jacket2/400/400',
        'https://picsum.photos/seed/jacket3/400/400'
    ],
    category: 'Trang phục',
  },
  {
    id: 5,
    name: 'Giày Sneaker Da Cổ Điển',
    description: 'Giày sneaker vượt thời gian được làm bằng da cao cấp cho sự thoải mái và phong cách tối đa.',
    price: 89.99,
    stock: 200,
    images: [
        'https://picsum.photos/seed/sneakers1/400/400',
        'https://picsum.photos/seed/sneakers2/400/400',
        'https://picsum.photos/seed/sneakers3/400/400'
    ],
    category: 'Trang phục',
  },
  {
    id: 6,
    name: 'Quần Jean Denim Voyager',
    description: 'Quần jean slim-fit bền và thoải mái để mặc hàng ngày.',
    price: 75.00,
    stock: 120,
    images: [
        'https://picsum.photos/seed/jeans1/400/400',
        'https://picsum.photos/seed/jeans2/400/400',
        'https://picsum.photos/seed/jeans3/400/400'
    ],
    category: 'Trang phục',
  },
  {
    id: 7,
    name: 'Mê Cung Vũ Trụ',
    description: 'Một cuốn tiểu thuyết khoa học viễn tưởng hấp dẫn của tác giả nổi tiếng J.X. Sterling.',
    price: 15.99,
    stock: 85,
    images: [
        'https://picsum.photos/seed/book1a/400/400',
        'https://picsum.photos/seed/book1b/400/400',
        'https://picsum.photos/seed/book1c/400/400'
    ],
    category: 'Sách',
  },
  {
    id: 8,
    name: 'Lược Sử Vạn Vật',
    description: 'Một hướng dẫn toàn diện và được minh họa đẹp mắt về lịch sử thế giới của chúng ta.',
    price: 29.99,
    stock: 95,
    images: [
        'https://picsum.photos/seed/book2a/400/400',
        'https://picsum.photos/seed/book2b/400/400',
        'https://picsum.photos/seed/book2c/400/400'
    ],
    category: 'Sách',
  },
  {
    id: 9,
    name: 'Sách Nấu Ăn Gourmet Chef',
    description: 'Hơn 100 công thức nấu ăn từ các đầu bếp nổi tiếng thế giới để nâng tầm tài nấu nướng tại nhà của bạn.',
    price: 24.95,
    stock: 0,
    images: [
        'https://picsum.photos/seed/cookbook1/400/400',
        'https://picsum.photos/seed/cookbook2/400/400',
        'https://picsum.photos/seed/cookbook3/400/400'
    ],
    category: 'Sách',
  },
  {
    id: 10,
    name: 'Dụng cụ pha cà phê AeroPress',
    description: 'Một dụng cụ pha cà phê đột phá giúp pha cà phê đậm đà, mượt mà không bị đắng.',
    price: 39.99,
    stock: 60,
    images: [
        'https://picsum.photos/seed/coffee1/400/400',
        'https://picsum.photos/seed/coffee2/400/400',
        'https://picsum.photos/seed/coffee3/400/400'
    ],
    category: 'Đồ gia dụng',
  },
  {
    id: 11,
    name: 'Đèn bàn tối giản',
    description: 'Một chiếc đèn bàn LED trang nhã với độ sáng và nhiệt độ màu có thể điều chỉnh.',
    price: 59.99,
    stock: 35,
    images: [
        'https://picsum.photos/seed/lamp1/400/400',
        'https://picsum.photos/seed/lamp2/400/400',
        'https://picsum.photos/seed/lamp3/400/400'
    ],
    category: 'Đồ gia dụng',
  },
  {
    id: 12,
    name: 'Nến thơm Evergreen',
    description: 'Một ngọn nến sáp đậu nành được làm thủ công với hương thơm tươi mát của gỗ thông và tuyết tùng.',
    price: 19.99,
    stock: 250,
    images: [
        'https://picsum.photos/seed/candle1/400/400',
        'https://picsum.photos/seed/candle2/400/400',
        'https://picsum.photos/seed/candle3/400/400'
    ],
    category: 'Đồ gia dụng',
  },
];

export const CATEGORIES = ['Tất cả', ...new Set(PRODUCTS.map((p) => p.category))];