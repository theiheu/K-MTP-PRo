import { Product, Category } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Laptop Lượng Tử Pro',
    description: 'Thế hệ laptop hiệu năng cao tiếp theo, với thiết kế đẹp mắt và bộ xử lý cực nhanh.',
    images: [
        'https://picsum.photos/seed/laptop-main/400/400',
        'https://picsum.photos/seed/laptop-silver/400/400',
        'https://picsum.photos/seed/laptop-black/400/400'
    ],
    category: 'Điện tử',
    options: ["Màu sắc", "RAM"],
    variants: [
        { id: 101, attributes: { "Màu sắc": "Bạc", "RAM": "16GB" }, stock: 15, price: 2500 },
        { id: 102, attributes: { "Màu sắc": "Bạc", "RAM": "32GB" }, stock: 5, price: 3000 },
        { id: 103, attributes: { "Màu sắc": "Xám Không Gian", "RAM": "16GB" }, stock: 10, price: 2500 },
        { id: 104, attributes: { "Màu sắc": "Xám Không Gian", "RAM": "32GB" }, stock: 0, price: 3000 }
    ]
  },
  {
    id: 2,
    name: 'Tai nghe Acoustic Bliss',
    description: 'Tai nghe chống ồn trùm tai cho trải nghiệm âm thanh đắm chìm.',
    images: [
        'https://picsum.photos/seed/headphones1/400/400',
        'https://picsum.photos/seed/headphones2/400/400',
        'https://picsum.photos/seed/headphones3/400/400'
    ],
    category: 'Điện tử',
    options: [],
    variants: [
        { id: 201, attributes: {}, stock: 75, price: 199 }
    ]
  },
  {
    id: 3,
    name: 'Bộ điều khiển SmartHome 360',
    description: 'Điều khiển tất cả các thiết bị thông minh của bạn từ một trung tâm điều khiển bằng giọng nói.',
    images: [
        'https://picsum.photos/seed/smarthome1/400/400',
        'https://picsum.photos/seed/smarthome2/400/400',
        'https://picsum.photos/seed/smarthome3/400/400'
    ],
    category: 'Điện tử',
    options: [],
    variants: [
      { id: 301, attributes: {}, stock: 40, price: 129 }
    ]
  },
  {
    id: 4,
    name: 'Áo khoác Urban Explorer',
    description: 'Một chiếc áo khoác thời trang và không thấm nước, hoàn hảo cho mọi cuộc phiêu lưu trong thành phố. Có nhiều màu sắc.',
    images: [
        'https://picsum.photos/seed/jacket-main/400/400',
        'https://picsum.photos/seed/jacket-black/400/400',
        'https://picsum.photos/seed/jacket-blue/400/400'
    ],
    category: 'Trang phục',
    options: ["Màu sắc", "Kích cỡ"],
    variants: [
        { id: 401, attributes: { "Màu sắc": "Đen", "Kích cỡ": "M" }, stock: 30, price: 89 },
        { id: 402, attributes: { "Màu sắc": "Đen", "Kích cỡ": "L" }, stock: 25, price: 89 },
        { id: 403, attributes: { "Màu sắc": "Xanh Navy", "Kích cỡ": "M" }, stock: 35, price: 89 },
        { id: 404, attributes: { "Màu sắc": "Xanh Navy", "Kích cỡ": "L" }, stock: 20, price: 89 },
        { id: 405, attributes: { "Màu sắc": "Xanh Navy", "Kích cỡ": "XL" }, stock: 10, price: 95 }
    ]
  },
  {
    id: 5,
    name: 'Giày Sneaker Da Cổ Điển',
    description: 'Giày sneaker vượt thời gian được làm bằng da cao cấp cho sự thoải mái và phong cách tối đa.',
    images: [
        'https://picsum.photos/seed/sneakers1/400/400',
        'https://picsum.photos/seed/sneakers2/400/400',
        'https://picsum.photos/seed/sneakers3/400/400'
    ],
    category: 'Trang phục',
    options: [],
    variants: [
      { id: 501, attributes: {}, stock: 200, price: 120 }
    ]
  },
  {
    id: 6,
    name: 'Quần Jean Denim Voyager',
    description: 'Quần jean slim-fit bền và thoải mái để mặc hàng ngày.',
    images: [
        'https://picsum.photos/seed/jeans1/400/400',
        'https://picsum.photos/seed/jeans2/400/400',
        'https://picsum.photos/seed/jeans3/400/400'
    ],
    category: 'Trang phục',
    options: [],
    variants: [
      { id: 601, attributes: {}, stock: 120, price: 75 }
    ]
  },
  {
    id: 7,
    name: 'Mê Cung Vũ Trụ',
    description: 'Một cuốn tiểu thuyết khoa học viễn tưởng hấp dẫn của tác giả nổi tiếng J.X. Sterling.',
    images: [
        'https://picsum.photos/seed/book1a/400/400',
        'https://picsum.photos/seed/book1b/400/400',
        'https://picsum.photos/seed/book1c/400/400'
    ],
    category: 'Sách',
    options: [],
    variants: [
      { id: 701, attributes: {}, stock: 85, price: 15 }
    ]
  },
  {
    id: 8,
    name: 'Lược Sử Vạn Vật',
    description: 'Một hướng dẫn toàn diện và được minh họa đẹp mắt về lịch sử thế giới của chúng ta.',
    images: [
        'https://picsum.photos/seed/book2a/400/400',
        'https://picsum.photos/seed/book2b/400/400',
        'https://picsum.photos/seed/book2c/400/400'
    ],
    category: 'Sách',
    options: [],
    variants: [
      { id: 801, attributes: {}, stock: 95, price: 22 }
    ]
  },
  {
    id: 9,
    name: 'Sách Nấu Ăn Gourmet Chef',
    description: 'Hơn 100 công thức nấu ăn từ các đầu bếp nổi tiếng thế giới để nâng tầm tài nấu nướng tại nhà của bạn.',
    images: [
        'https://picsum.photos/seed/cookbook1/400/400',
        'https://picsum.photos/seed/cookbook2/400/400',
        'https://picsum.photos/seed/cookbook3/400/400'
    ],
    category: 'Sách',
    options: [],
    variants: [
      { id: 901, attributes: {}, stock: 0, price: 30 }
    ]
  },
  {
    id: 10,
    name: 'Dụng cụ pha cà phê AeroPress',
    description: 'Một dụng cụ pha cà phê đột phá giúp pha cà phê đậm đà, mượt mà không bị đắng.',
    images: [
        'https://picsum.photos/seed/coffee1/400/400',
        'https://picsum.photos/seed/coffee2/400/400',
        'https://picsum.photos/seed/coffee3/400/400'
    ],
    category: 'Đồ gia dụng',
    options: [],
    variants: [
      { id: 1001, attributes: {}, stock: 60, price: 35 }
    ]
  },
  {
    id: 11,
    name: 'Đèn bàn tối giản',
    description: 'Một chiếc đèn bàn LED trang nhã với độ sáng và nhiệt độ màu có thể điều chỉnh.',
    images: [
        'https://picsum.photos/seed/lamp1/400/400',
        'https://picsum.photos/seed/lamp2/400/400',
        'https://picsum.photos/seed/lamp3/400/400'
    ],
    category: 'Đồ gia dụng',
    options: [],
    variants: [
      { id: 1101, attributes: {}, stock: 35, price: 45 }
    ]
  },
  {
    id: 12,
    name: 'Nến thơm Evergreen',
    description: 'Một ngọn nến sáp đậu nành được làm thủ công với hương thơm tươi mát của gỗ thông và tuyết tùng.',
    images: [
        'https://picsum.photos/seed/candle1/400/400',
        'https://picsum.photos/seed/candle2/400/400',
        'https://picsum.photos/seed/candle3/400/400'
    ],
    category: 'Đồ gia dụng',
    options: [],
    variants: [
      { id: 1201, attributes: {}, stock: 250, price: 18 }
    ]
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Điện tử', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAxNy4yNXYxLjAwN2EzIDMgMCAwIDEtLjg3OSAyLjEyMkw3LjUgMjFoOWwtLjYyMS0uNjIxQTMgMyAwIDAgMSAxNSAxOC4yNTdWMTcuMjVtNi0xMlYxNWEyLjI1IDIuMjUgMCAwIDEtMi4yNSAyLjI1SDUuMjVBMi4yNSAyLjI1IDAgMCAxIDMgMTVWNS4yNUEyLjI1IDIuMjUgMCAwIDEgNS4yNSAzbDEzLjVBMS4yNSAyLjI1IDAgMCAxIDIxIDUuMjVaIiAvPjwvc3ZnPg==' },
    { name: 'Trang phục', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOS41NjggM0g1LjI1QTIuMjUgMi4yNSAwIDAwMyA1LjI1djQuMzE4YzAgLjU5Ny4yMzcgMS4xNy42NTkgMS41OTFsOS41ODEgOS41ODFjLjY5OS42OTkgMS43OC44NzIgMi42MDcuMzNhMTguMDk1IDE4LjA5NSAwIDAwNS4yMjMtNS4yMjNjLjU0Mi0uODI3LjM2OS0xLjkwOC0uMzMtMi42MDdMMTExLjE2IDMuNjZBMi4yNSAyLjI1IDAgMDA5LjU2OCAzWiIgLz48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik02IDZoLjAwOHYwLjAwOEg2VjZaIiAvPjwvc3ZnPg==' },
    { name: 'Sách', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgNi4wNDJBOC45NjcgOC45NjcgMCAwIDAgNiAzLjc1Yy0xLjA1MiAwLTIuMDYyLjE4LTMgLjUxMnYxNC4yNUE4Ljk4NyA4Ljk4NyAwIDAgMSA2IDE4YzIuMzA1IDAgNC40MDguODY3IDYgMi4yOTJtMC0xNC4yNWE4Ljk2NiA4Ljk2NiAwIDAgMSA2LTIuMjkyYzEuMDUyIDAgMi4wNjIuMTggMyAuNTEydjE4LjI1QOC45ODcgOC45ODcgMCAwIDAgMTggMThhOC45NjcgOC45NjcgMCAwIDAtNiAyLjI5Mm0wLTE0LjI1djE0LjI1IiAvPjwvc3ZnPg==' },
    { name: 'Đồ gia dụng', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBhcmlhLWhpZGRlbj0idHJ1ZSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJtMi4yNSAxMiA4Ljk1NC04Ljk1NWMuNDQtLjQzOSAxLjE1Mi0uNDM5IDEuNTkxIDBMMjEuNzUgMTJNNC41IDkuNzV2MTAuMTI1YzAgLjYyMS41MDQgMS4xMjUgMS4xMjUgMS4xMjVIO lofty5djEuODc1YzAtLjYyMS41MDQtMS4xMjUgMS4xMjUtMS4xMjVoMi4yNWMuNjIxIDAgMS4xMjUuNTA0IDEuMTI1IDEuMTI1VjIx'+'aDQuMTI1Yy42MjEgMCAxLjEyNS0uNTA0IDEuMTI1LTEuMTI1VjkuNzVNOC4yNSAyMWg3LjUiIC8+PC9zdmc+' }
];
