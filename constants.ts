
import { Product } from './types';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Quantum Laptop Pro',
    description: 'The next generation of high-performance laptops, with a sleek design and blazing-fast processor.',
    price: 1499.99,
    images: [
        'https://picsum.photos/seed/laptop1/400/400',
        'https://picsum.photos/seed/laptop2/400/400',
        'https://picsum.photos/seed/laptop3/400/400'
    ],
    category: 'Electronics',
  },
  {
    id: 2,
    name: 'Acoustic Bliss Headphones',
    description: 'Noise-cancelling over-ear headphones for an immersive audio experience.',
    price: 199.99,
    images: [
        'https://picsum.photos/seed/headphones1/400/400',
        'https://picsum.photos/seed/headphones2/400/400',
        'https://picsum.photos/seed/headphones3/400/400'
    ],
    category: 'Electronics',
  },
  {
    id: 3,
    name: 'SmartHome Hub 360',
    description: 'Control all your smart devices from one central, voice-activated hub.',
    price: 129.50,
    images: [
        'https://picsum.photos/seed/smarthome1/400/400',
        'https://picsum.photos/seed/smarthome2/400/400',
        'https://picsum.photos/seed/smarthome3/400/400'
    ],
    category: 'Electronics',
  },
  {
    id: 4,
    name: 'Urban Explorer Jacket',
    description: 'A stylish and waterproof jacket, perfect for any city adventure. Available in multiple colors.',
    price: 149.99,
    images: [
        'https://picsum.photos/seed/jacket1/400/400',
        'https://picsum.photos/seed/jacket2/400/400',
        'https://picsum.photos/seed/jacket3/400/400'
    ],
    category: 'Apparel',
  },
  {
    id: 5,
    name: 'Classic Leather Sneakers',
    description: 'Timeless sneakers made with premium leather for ultimate comfort and style.',
    price: 89.99,
    images: [
        'https://picsum.photos/seed/sneakers1/400/400',
        'https://picsum.photos/seed/sneakers2/400/400',
        'https://picsum.photos/seed/sneakers3/400/400'
    ],
    category: 'Apparel',
  },
  {
    id: 6,
    name: 'Denim Voyager Jeans',
    description: 'Durable and comfortable slim-fit jeans for everyday wear.',
    price: 75.00,
    images: [
        'https://picsum.photos/seed/jeans1/400/400',
        'https://picsum.photos/seed/jeans2/400/400',
        'https://picsum.photos/seed/jeans3/400/400'
    ],
    category: 'Apparel',
  },
  {
    id: 7,
    name: 'The Cosmic Labyrinth',
    description: 'A mind-bending science fiction novel by acclaimed author J.X. Sterling.',
    price: 15.99,
    images: [
        'https://picsum.photos/seed/book1a/400/400',
        'https://picsum.photos/seed/book1b/400/400',
        'https://picsum.photos/seed/book1c/400/400'
    ],
    category: 'Books',
  },
  {
    id: 8,
    name: 'History of Everything',
    description: 'A comprehensive and beautifully illustrated guide to the history of our world.',
    price: 29.99,
    images: [
        'https://picsum.photos/seed/book2a/400/400',
        'https://picsum.photos/seed/book2b/400/400',
        'https://picsum.photos/seed/book2c/400/400'
    ],
    category: 'Books',
  },
  {
    id: 9,
    name: 'Gourmet Chef Cookbook',
    description: 'Over 100 recipes from world-renowned chefs to elevate your home cooking.',
    price: 24.95,
    images: [
        'https://picsum.photos/seed/cookbook1/400/400',
        'https://picsum.photos/seed/cookbook2/400/400',
        'https://picsum.photos/seed/cookbook3/400/400'
    ],
    category: 'Books',
  },
  {
    id: 10,
    name: 'AeroPress Coffee Maker',
    description: 'A revolutionary coffee press that brews smooth, rich coffee without bitterness.',
    price: 39.99,
    images: [
        'https://picsum.photos/seed/coffee1/400/400',
        'https://picsum.photos/seed/coffee2/400/400',
        'https://picsum.photos/seed/coffee3/400/400'
    ],
    category: 'Home Goods',
  },
  {
    id: 11,
    name: 'Minimalist Desk Lamp',
    description: 'An elegant LED desk lamp with adjustable brightness and color temperature.',
    price: 59.99,
    images: [
        'https://picsum.photos/seed/lamp1/400/400',
        'https://picsum.photos/seed/lamp2/400/400',
        'https://picsum.photos/seed/lamp3/400/400'
    ],
    category: 'Home Goods',
  },
  {
    id: 12,
    name: 'Evergreen Scented Candle',
    description: 'A hand-poured soy wax candle with a refreshing scent of pine and cedar.',
    price: 19.99,
    images: [
        'https://picsum.photos/seed/candle1/400/400',
        'https://picsum.photos/seed/candle2/400/400',
        'https://picsum.photos/seed/candle3/400/400'
    ],
    category: 'Home Goods',
  },
];

export const CATEGORIES = ['All', ...new Set(PRODUCTS.map((p) => p.category))];
