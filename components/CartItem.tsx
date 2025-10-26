import React from 'react';
import { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onRemove: (variantId: number) => void;
  onUpdateItem: (variantId: number, quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateItem }) => {
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = parseInt(e.target.value, 10);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }
    onUpdateItem(item.variant.id, quantity);
  };
  
  const increment = () => {
    onUpdateItem(item.variant.id, item.quantity + 1);
  };

  const decrement = () => {
    if (item.quantity > 1) {
        onUpdateItem(item.variant.id, item.quantity - 1);
    }
  };

  const variantAttributes = Object.entries(item.variant.attributes)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return (
    <li className="flex py-6">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <img src={item.variant.images?.[0] || item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover object-center" />
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.product.name}</h3>
          </div>
          {variantAttributes && <p className="mt-1 text-sm text-gray-500">{variantAttributes}</p>}
          <p className="mt-1 text-sm text-gray-500">Tồn kho (biến thể này): {item.variant.stock}</p>
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-md">
                <button type="button" onClick={decrement} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md">-</button>
                <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={handleQuantityChange} 
                    className="w-12 text-center border-l border-r border-gray-300 focus:outline-none"
                    min="1"
                    aria-label={`Số lượng cho ${item.product.name}`}
                />
                <button type="button" onClick={increment} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md">+</button>
            </div>
          </div>

          <div className="flex">
            <button
              type="button"
              onClick={() => onRemove(item.variant.id)}
              className="font-medium text-yellow-600 hover:text-yellow-500"
            >
              Xóa
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default CartItem;
