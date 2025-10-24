
import React from 'react';
import { CartItem as CartItemType } from '../types';

interface CartItemProps {
  item: CartItemType;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onRemove, onUpdateQuantity }) => {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value, 10);
    if (!isNaN(quantity) && quantity >= 1) {
      onUpdateQuantity(item.product.id, quantity);
    }
  };
  
  const increment = () => onUpdateQuantity(item.product.id, item.quantity + 1);
  const decrement = () => {
    if (item.quantity > 1) {
        onUpdateQuantity(item.product.id, item.quantity - 1);
    }
  };

  return (
    <li className="flex py-6">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover object-center" />
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.product.name}</h3>
            <p className="ml-4">${(item.product.price * item.quantity).toFixed(2)}</p>
          </div>
          <p className="mt-1 text-sm text-gray-500">${item.product.price.toFixed(2)} each</p>
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center border border-gray-300 rounded-md">
            <button onClick={decrement} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md">-</button>
            <input type="number" value={item.quantity} onChange={handleQuantityChange} className="w-12 text-center border-l border-r border-gray-300 focus:outline-none"/>
            <button onClick={increment} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md">+</button>
          </div>

          <div className="flex">
            <button
              type="button"
              onClick={() => onRemove(item.product.id)}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

export default CartItem;
