import { Product, Category, User } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Cám gà con',
    description: 'Thức ăn hỗn hợp dạng viên, cung cấp đầy đủ dinh dưỡng cho gà con từ 1 đến 21 ngày tuổi.',
    images: [
        'https://picsum.photos/seed/chick-feed1/400/400',
        'https://picsum.photos/seed/chick-feed2/400/400',
        'https://picsum.photos/seed/chick-feed3/400/400'
    ],
    category: 'Thức ăn chăn nuôi',
    options: ["Trọng lượng"],
    variants: [
        { id: 101, attributes: { "Trọng lượng": "Bao 10kg" }, stock: 150, price: 180000, unit: 'Bao' },
        { id: 102, attributes: { "Trọng lượng": "Bao 25kg" }, stock: 80, price: 420000, unit: 'Bao' },
    ]
  },
  {
    id: 2,
    name: 'Vắc-xin Newcastle',
    description: 'Vắc-xin đông khô phòng bệnh Newcastle (dịch tả gà) cho gà mọi lứa tuổi.',
    images: [
        'https://picsum.photos/seed/vaccine1/400/400',
        'https://picsum.photos/seed/vaccine2/400/400',
    ],
    category: 'Thuốc & Vắc-xin',
    options: ["Liều"],
    variants: [
        { id: 201, attributes: { "Liều": "Lọ 100 liều" }, stock: 200, price: 15000, unit: 'Lọ' },
        { id: 202, attributes: { "Liều": "Lọ 500 liều" }, stock: 50, price: 60000, unit: 'Lọ' },
    ]
  },
  {
    id: 3,
    name: 'Máng ăn dài cho gà',
    description: 'Máng ăn bằng nhựa PP bền, chống mổ, dễ dàng vệ sinh. Thích hợp cho nhiều gà ăn cùng lúc.',
    images: [
        'https://picsum.photos/seed/feeder1/400/400',
        'https://picsum.photos/seed/feeder2/400/400',
    ],
    category: 'Dụng cụ chăn nuôi',
    options: ["Chiều dài"],
    variants: [
      { id: 301, attributes: { "Chiều dài": "50 cm" }, stock: 75, price: 25000, unit: 'Cái' },
      { id: 302, attributes: { "Chiều dài": "75 cm" }, stock: 60, price: 32000, unit: 'Cái' },
      { id: 303, attributes: { "Chiều dài": "100 cm" }, stock: 0, price: 40000, unit: 'Cái' },
    ]
  },
  {
    id: 4,
    name: 'Quạt thông gió công nghiệp',
    description: 'Quạt thông gió vuông, lưu lượng gió lớn, chuyên dùng cho chuồng trại chăn nuôi.',
    images: [
        'https://picsum.photos/seed/fan1/400/400',
        'https://picsum.photos/seed/fan2/400/400',
    ],
    category: 'Hệ thống chuồng trại',
    options: [],
    variants: [
        { id: 401, attributes: {}, stock: 12, price: 1250000, unit: 'Cái' }
    ]
  },
  {
    id: 5,
    name: 'Thuốc sát trùng Vimekon',
    description: 'Thuốc sát trùng phổ rộng, an toàn cho vật nuôi, tiêu diệt vi khuẩn, virus, nấm mốc.',
    images: [
        'https://picsum.photos/seed/disinfect1/400/400',
    ],
    category: 'Vệ sinh & Sát trùng',
    options: ["Dung tích"],
    variants: [
      { id: 501, attributes: { "Dung tích": "Chai 1 lít" }, stock: 45, price: 220000, unit: 'Chai' }
    ]
  },
  {
    id: 6,
    name: 'Ủng bảo hộ cao su',
    description: 'Ủng cao su cổ cao, chống thấm nước, chống trơn trượt, bảo vệ chân khi làm việc trong chuồng trại.',
    images: [
        'https://picsum.photos/seed/boots1/400/400',
        'https://picsum.photos/seed/boots2/400/400',
    ],
    category: 'Bảo hộ lao động',
    options: ["Kích cỡ"],
    variants: [
      { id: 601, attributes: { "Kích cỡ": "39" }, stock: 20, price: 85000, unit: 'Đôi' },
      { id: 602, attributes: { "Kích cỡ": "40" }, stock: 35, price: 85000, unit: 'Đôi' },
      { id: 603, attributes: { "Kích cỡ": "41" }, stock: 40, price: 85000, unit: 'Đôi' },
      { id: 604, attributes: { "Kích cỡ": "42" }, stock: 25, price: 85000, unit: 'Đôi' },
    ]
  },
  {
    id: 7,
    name: 'Bóng đèn úm hồng ngoại',
    description: 'Bóng đèn sưởi ấm cho gà con, gia cầm non, giúp giữ nhiệt và tăng tỷ lệ sống.',
    images: [
        'https://picsum.photos/seed/heatlamp1/400/400',
    ],
    category: 'Phụ tùng & Sửa chữa',
    options: ["Công suất"],
    variants: [
      { id: 701, attributes: { "Công suất": "100W" }, stock: 95, price: 45000, unit: 'Cái' },
      { id: 702, attributes: { "Công suất": "150W" }, stock: 110, price: 55000, unit: 'Cái' },
      { id: 703, attributes: { "Công suất": "250W" }, stock: 60, price: 70000, unit: 'Cái' },
    ]
  },
  {
    id: 8,
    name: 'Men tiêu hóa cho gia cầm',
    description: 'Bổ sung lợi khuẩn, giúp gia cầm tiêu hóa tốt, hấp thu tối đa dinh dưỡng, giảm mùi hôi chuồng trại.',
    images: [
        'https://picsum.photos/seed/probiotic1/400/400',
    ],
    category: 'Thuốc & Vắc-xin',
    options: [],
    variants: [
      { id: 801, attributes: {}, stock: 88, price: 95000, unit: 'Gói' }
    ]
  },
  {
    id: 9,
    name: 'Tấm lót chuồng trấu',
    description: 'Trấu khô, sạch, dùng làm đệm lót sinh học cho chuồng gà, giúp chuồng khô ráo, sạch sẽ.',
    images: [
        'https://picsum.photos/seed/bedding1/400/400',
    ],
    category: 'Hệ thống chuồng trại',
    options: [],
    variants: [
      { id: 901, attributes: {}, stock: 0, price: 30000, unit: 'Bao' }
    ]
  },
  {
    id: 10,
    name: 'Xẻng xúc cám',
    description: 'Xẻng chuyên dụng để xúc thức ăn chăn nuôi, có 2 loại nhựa và inox.',
    images: [
        'https://picsum.photos/seed/shovel1/400/400',
        'https://picsum.photos/seed/shovel2/400/400',
    ],
    category: 'Dụng cụ chăn nuôi',
    options: ["Loại"],
    variants: [
      { id: 1001, attributes: { "Loại": "Nhựa" }, stock: 120, price: 20000, unit: 'Cái' },
      { id: 1002, attributes: { "Loại": "Inox" }, stock: 50, price: 65000, unit: 'Cái' },
    ]
  },
  {
    id: 11,
    name: 'Bộ máng uống núm tự động',
    description: 'Hệ thống cung cấp nước uống sạch tự động cho gà, bao gồm các bộ phận có thể yêu cầu riêng lẻ.',
    images: [
        'https://picsum.photos/seed/drinker-set/400/400',
        'https://picsum.photos/seed/drinker-nipple/400/400',
        'https://picsum.photos/seed/drinker-cup/400/400',
    ],
    category: 'Dụng cụ chăn nuôi',
    options: ["Loại"],
    variants: [
      { 
        id: 1101, 
        attributes: { "Loại": "Bộ Hoàn chỉnh" }, 
        stock: 0, // Stock is calculated from components
        price: 7500,
        unit: 'Bộ',
        components: [
            { variantId: 1102, quantity: 1 },
            { variantId: 1103, quantity: 1 },
        ]
      },
      { 
        id: 1102, 
        attributes: { "Loại": "Núm uống" }, 
        stock: 500,
        price: 5000,
        unit: 'Cái'
      },
      { 
        id: 1103, 
        attributes: { "Loại": "Cốc hứng" }, 
        stock: 450,
        price: 2500,
        unit: 'Cái'
      }
    ]
  },
  {
    id: 12,
    name: 'Vôi bột khử trùng',
    description: 'Vôi bột dùng để rắc chuồng trại, khử trùng, diệt mầm bệnh và cân bằng pH nền chuồng.',
    images: [
        'https://picsum.photos/seed/limepowder/400/400',
    ],
    category: 'Vệ sinh & Sát trùng',
    options: [],
    variants: [
      { id: 1201, attributes: {}, stock: 200, price: 50000, unit: 'Bao' }
    ]
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Thức ăn chăn nuôi', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik04LjI1IDcuNSY4LjI1IDcuNWExLjUgMS41IDAgMCAxIDIuMTIyLjcwN2wzIDQuNUMxMy44IDExLjgzMyAxMiA3LjUgMTIgNy41cy0xLjggNC4zMzMtMS4xMjggNS43MDdsMy00LjVDMTQuNTMyIDcuOTU3IDE1LjY4MiA4LjI1IDE2LjE3IDkuMDYyYy40ODcgLjgxMi4yMDQgMS44NTYtLjYwOCAyLjM0M2wtNi43NSAzLjc1YTIuMjUgMi4yNSAwIDAgMS0yLjYxNi0uNTIxbC0zLjQ0LTMuNDRhMi4yNSAyLjI1IDAgMCAxIC41MjEtMi42MTZsNi43NS0zLjc1WiIgLz48L3N2Zz4=' },
    { name: 'Thuốc & Vắc-xin', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xMy41IDEwLjVTMTIgMTAuNSA5IDEzLjVNMTAuODc5IDEyLjEyMS41LjVhLjUuNSAwIDAgMC0uNzA3LjcwN2wzLjg5IDMuODg5YS41LjUgMCAwIDAgLjcwNy0uNzA3bC0zLjg5LTMuODg5Wk0yMS4xODIgMTMuMTgybC02LjE4MS02LjE4MWEuNS41IDAgMCAwLS43MDcgMCAuNS41IDAgMCAwIDAgLjcwN2w2LjE4MSA2LjE4MWEuNS41IDAgMCAwIC43MDcgMCAuNS41IDAgMCAwIDAtLjcwN1oiIC8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTggNC41bDIuNSAyLjVtLTYuNSA2LjUgNCA0bS0zLjUgNWgyLjVNMjEuMTg3IDExLjA4NmwtLjQyNC40MjMtOS4xOTEgOS4xOTFhMS41IDEuNSAwIDAgMS0yLjEyMSAwTDMuMjcxIDE0LjVhMS41IDEuNSAwIDAgMSAwLTIuMTIxbDkuMTkxLTkuMTkxYTEuNSAxLjUgMCAwIDEgMi4xMjEgMGw2LjU5NyA2LjU5N2ExLjUgMS41IDAgMCAxIDAgMi4xMjFaIiAvPjwvc3ZnPg==' },
    { name: 'Dụng cụ chăn nuôi', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0yLjI1IDEzLjVDMi4yNSAxMi41NjcgMy4wMTcgMTEuOCA0LjEyNSAxMS44SDguNU0yLjI1IDguNzVIMTQuMjVDMTUuMjMzIDguNzUgMTYgOS40MzMgMTYgMTAuMzc1VjEzLjVDMTYgMTQuNDMzIDE1LjIzMyAxNS4xMjUgMTQuMjUgMTUuMTI1SDguNU04LjUgMTUuMTI1SDQuMTI1QzMuMDE3IDE1LjEyNSAyLjI1IDE0LjQzMyAyLjI1IDEzLjVNNy41IDIxVjE1LjEyNU0xOC43NSAxMS44SDIwLjI1QzIxLjIzMyAxMS44IDIyIDEyLjU2NyAyMiAxMy41TTIyIDEzLjVWMTguNzVDMjIgMTkuNjk4IDIxLjI3NyAyMC41IDIwLjM4NiAyMC41SDIwLjI1QzE5LjI2NyAyMC41IDE4LjUgMTkuNzMzIDE4LjUgMTguNzVWMTMuNU0xMiAzVjYuNzUiIC8+PC9zdmc+' },
    { name: 'Hệ thống chuồng trại', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xMiA2bC00LjUtMy43NVY4LjI1TDQgMTAuNVYxOEgyMHYtNy41bC0zLjc1LTIuMjVWMi4yNUwxMiA2Wk0xMiA2bC0xLjUgMS41TTIgOGw3LjUtNS4yNUwxNyA4bS01IDEwLjV2LTEuNU00IDE4bDEuNS0xLjUiIC8+PC9zdmc+' },
    { name: 'Vệ sinh & Sát trùng', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik0xOC4zNjQgMTguMzY0Yy0yLjMxOCAyLjMxOC01LjQyNCAzLjU0LTYuODYzIDMuNjMtMS40NC4wOS0yLjgzMy0uMjY4LTQuMDQ1LS45OTVhOS4wMSA5LjAxIDAgMCAxLTUuNDg1LTguMzQ1Yy4wMS0yLjMxOC43NDgtNC40MjQgMi4wMDctNi4yMDVhOS4wMTEgOS4wMTEgMCAwIDEgNi4yMDUtMi4wMDdjNC41OTktLjM0MiA4LjU1MSAzLjMxNyA4LjE4NiA3LjkyNy0uMjIgMy4wOTUtMi4yMyA1LjY1My00LjY4OCA3LjM1MVoiIC8+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOS43NSA1LjI1YTMgMyAwIDAgMSAzLTIuNU0zLjM3NSAxOC4zNzVhMyAzIDAgMCAwIDIuMjUgMi4yNU0xMi43NSA2LjI1bDIuMjUtMi4yNU04LjI1IDEyLjI1bDQuNSA0LjVNNTYgMTNsMSAxbS0xMC41LThMMiA3LjVNNiAxOC41bC0yLjUgMi41TTIwLjI1IDguNzVsMS41LTEuNU0xNS43NSA4LjI1YzAgNS4xMjEtNC42NDQgNy41LTguMjUgNy41SDQuNW0xMC41IDBjMCAuNDU1LS4wMi45MDYtLjA1OCAxLjM1MyIgLz48L3N2Zz4=' },
    { name: 'Bảo hộ lao động', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik05IDEyLjc1IDExLjI1IDE1IDE1IDkuNzVtLTMtNy4wMzZBMS45NTkgMTEuOTU5IDAgMCAxIDMuNTk4IDYgMTEuOTkgMTEuOTkgMCAwIDAgMyA5Ljc0OWMwIDUuNTkyIDMuODI0IDEwLjI5IDkgMTEuNjIyIDUuMTc2LTEuMzMyIDktNi4wMyA5LTExLjYyMiAwLTEuMzEtLjIxLTIuNTcxLS41OTgtMy43NTFoLS4xNTJjLTMuMTk2IDAtNi4xLTEuMjQ4LTguMjUtMy4yODZaIiAvPjwvc3ZnPg==' },
    { name: 'Phụ tùng & Sửa chữa', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik05LjU5NCAzLjk0Yy4wOS0uNTQyLjU2LTEuMDA3IDEuMTEtMS4yMjYuNTUtLjIyIDEuMTU2LS4yMiAxLjcwNiAwIC41NS4yMiAxLjAyLjY4NCAxLjExIDEuMjI2bC4wNDMuMjY4Yz40MzMuMjcuODUuNTk2IDEuMjM0Ljk2Ni4zODMuMzcuNzE3Ljc4NCAxLjAxOCAxLjIyOC4zMDIuNDQ1LjU0NS45MjIuNzI3IDEuNDI4bC4wNDMuMjdjLjEzNC41NDIuMTM0IDEuMTEgMCAxLjY1MmwtLjA0My4yN2MtLjE4Mi41MDYtLjQyNS45ODMtLjcyNyAxLjQyOGE5LjAwOSA5LjAwOSAwIDAgMS0xLjAxOCAxLjIyOGMtLjM4My4zNy0uOC42OTctMS4yMzQuOTY2bC0uMDQzLjI2OGMtLjA5LjU0Mi0uNTYgMS4wMDctMS4xMSAxLjIyNi0uNTUtLjIyLTEuMTU2LS4yMi0xLjcwNiAwLS41NS0uMjItMS4wMi0uNjg0LTEuMTEtMS4yMjZsLS4wNDMtLjI2OGE5LjAwOSA5LjAwOSAwIDAgMS0xLjIzNC0uOTY2Yy0uMzgzLS4zNy0uNzE3LS43ODQtMS4wMTgtMS4yMjhhOS4wMSA5LjAxIDAgMCAxLS43MjctMS40MjhsLS4wNDMtLjI3Yy0uMTM0LS41NDItLjEzNC0xLjExIDAtMS42NTJsLjA0My0uMjdhOS4wMSA5LjAxIDAgMCAxIC43MjctMS40MjhjLjMwMi0uNDQ1LjYzNi0uODU4IDEuMDE4LTEuMjI4LjM4NC0uMzcuODAxLS42OTYgMS4yMzQtLjk2NmwuMDQzLS4yNjhaTTEyIDE1Ljc1YTMuNzUgMy43NSAwIDEgMCAwLTcuNSAzLjc1IDMuNzUgMCAwIDAgMCA3LjVaIiAvPjwvc3ZnPg==' },
    { name: 'Khác', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iY3VycmVudENvbG9yIj48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGQ9Ik02Ljc1IDEyYS43NS43NSAwIDEgMS0xLjUgMCAuNzUuNzUgMCAwIDEgMS41IDBNMTIuNzUgMTJhLjc1Ljc1IDAgMSAxLTEuNSAwIC43NS43NSAwIDAgMSAxLjUgME0xOC43NSAxMmEuNzUuNzUgMCAxIDEtMS41IDAgLjc1Ljc1IDAgMCAxIDEuNSAwWiIgLz48L3N2Zz4=' }
];

export const USERS: User[] = [
  { id: 'requester-1', name: 'Nguyễn Văn An', role: 'requester', zone: 'Khu 1' },
  { id: 'requester-2', name: 'Trần Thị Bình', role: 'requester', zone: 'Khu 2' },
  { id: 'requester-3', name: 'Lê Văn Cường', role: 'requester', zone: 'Khu 3' },
  { id: 'requester-4', name: 'Phạm Thị Dung', role: 'requester', zone: 'Khu 4' },
  { id: 'manager-1', name: 'Quản lý Kho', role: 'manager' },
];
