import { Product, Category } from './types';

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

export const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Điện tử', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAxNy4yNXYxLjAwN2EzIDMgMCAwIDEtLjg3OSAyLjEyMkw3LjUgMjFoOWwtLjYyMS0uNjIxQTMgMyAwIDAgMSAxNSAxOC4yNTdWMTcuMjVtNi0xMlYxNWEyLjI1IDIuMjUgMCAwIDEtMi4yNSAyLjI1SDUuMjVBMi4yNSAyLjI1IDAgMCAxIDMgMTVWNS4yNUEyLjI1IDIuMjUgMCAwIDEgNS4yNSAzbDEzLjVBMS4yNSAyLjI1IDAgMCAxIDIxIDUuMjVaIiAvPjwvc3ZnPg==' },
    { name: 'Trang phục', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOS41NjggM0g1LjI1QTIuMjUgMi4yNSAwIDAwMyA1LjI1djQuMzE4YzAgLjU5Ny4yMzcgMS4xNy42NTkgMS41OTFsOS41ODEgOS41ODFjLjY5OS42OTkgMS43OC44NzIgMi42MDcuMzNhMTguMDk1IDE4LjA5NSAwIDAwNS4yMjMtNS4yMjNjLjU0Mi0uODI3LjM2OS0xLjkwOC0uMzMtMi42MDdMMTEuMTYgMy42NkEyLjI1IDIuMjUgMCAwMDkuNTY4IDNaIiAvPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTYgNmguMDA4djAuMDA4SDZWNloiIC8+PC9zdmc+' },
    { name: 'Sách', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgNi4wNDJBOC45NjcgOC45NjcgMCAwIDAgNiAzLjc1Yy0xLjA1MiAwLTIuMDYyLjE4LTMgLjUxMnYxNC4yNUE4Ljk4NyA4Ljk4NyAwIDAgMSA2IDE4YzIuMzA1IDAgNC40MDguODY3IDYgMi4yOTJtMC0xNC4yNWE4Ljk2NiA4Ljk2NiAwIDAgMSA2LTIuMjkyYzEuMDUyIDAgMi4wNjIuMTggMyAuNTEydjE0LjI1QOC45ODcgOC45ODcgMCAwIDAgMTggMThhOC45NjcgOC45NjcgMCAwIDAtNiAyLjI5Mm0wLTE0LjI1djE0LjI1IiAvPjwvc3ZnPg==' },
    { name: 'Đồ gia dụng', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJtMi4yNSAxMiA4Ljk1NC04Ljk1NWMuNDQtLjQzOSAxLjE1Mi0uNDM5IDEuNTkxIDBMMjEuNzUgMTJNNC41IDkuNzV2MTAuMTI1YzAgLjYyMS41MDQgMS4xMjUgMS4xMjUgMS4xMjVIO lofty5djEuODc1YzAtLjYyMS41MDQtMS4xMjUgMS4xMjUtMS4xMjVoMi4yNWMuNjIxIDAgMS4xMjUuNTA0IDEuMTI1IDEuMTI1VjIx'+'aDQuMTI1Yy42MjEgMCAxLjEyNS0uNTA0IDEuMTI1LTEuMTI1VjkuNzVNOC4yNSAyMWg3LjUiIC8+PC9zdmc+' }
];
