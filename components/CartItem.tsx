import React, { useMemo } from 'react';
import { CartItem as CartItemType, Product } from '../types';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import { calculateVariantStock } from '../utils/stockCalculator';

interface CartItemProps {
  item: CartItemType;
  allProducts: Product[];
  onRemove: (variantId: number) => void;
  onUpdateItem: (variantId: number, quantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, allProducts, onRemove, onUpdateItem }) => {
  
  const calculatedStock = useMemo(() => {
    return calculateVariantStock(item.variant, allProducts);
  }, [item.variant, allProducts]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let quantity = parseInt(e.target.value, 10);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }
    if (quantity > calculatedStock) {
        quantity = calculatedStock;
    }
    onUpdateItem(item.variant.id, quantity);
  };
  
  const increment = () => {
    if(item.quantity < calculatedStock) {
        onUpdateItem(item.variant.id, item.quantity + 1);
    }
  };

  const decrement = () => {
    if (item.quantity > 1) {
        onUpdateItem(item.variant.id, item.quantity - 1);
    }
  };

  const variantAttributes = Object.entries(item.variant.attributes)
    .map(([, value]) => value)
    .join(', ');

  const isComposite = item.variant.components && item.variant.components.length > 0;

  return (
    <li className="flex py-6">
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        <ImageWithPlaceholder src={item.variant.images?.[0] || item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover object-center" />
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>{item.product.name}</h3>
          </div>
          {variantAttributes && <p className="mt-1 text-sm text-gray-500">{variantAttributes}</p>}
          <p className="mt-1 text-sm text-gray-500">Tồn kho: {calculatedStock} {item.variant.unit}</p>

          {isComposite && (
            <div className="mt-2 text-xs text-gray-600 border-l-2 border-yellow-300 pl-2">
              <p className="font-medium">Bao gồm:</p>
              <ul className="list-disc list-inside">
                {item.variant.components!.map(comp => {
                    const componentVariant = item.product.variants.find(v => v.id === comp.variantId);
                    const variantName = componentVariant ? Object.values(componentVariant.attributes).join(' / ') : `ID ${comp.variantId}`;
                    return componentVariant ? (
                        <li key={comp.variantId}>{comp.quantity} x {variantName}</li>
                    ) : null;
                })}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-md">
                <button type="button" onClick={decrement} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md" disabled={item.quantity <= 1}>-</button>
                <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={handleQuantityChange} 
                    className="w-12 text-center border-l border-r border-gray-300 focus:outline-none py-1"
                    min="1"
                    max={calculatedStock}
                    aria-label={`Số lượng cho ${item.product.name}`}
                />
                <button type="button" onClick={increment} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md" disabled={item.quantity >= calculatedStock}>+</button>
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
