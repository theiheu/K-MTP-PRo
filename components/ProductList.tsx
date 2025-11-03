import React from 'react';
import { Product, Variant } from '../types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  allProducts: Product[];
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  totalProducts: number;
}

const ProductList: React.FC<ProductListProps> = ({ products, allProducts, onAddToCart, totalProducts }) => {
  if (totalProducts === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">Không tìm thấy vật tư</h2>
        <p className="mt-2 text-gray-500">Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn.</p>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-x-6 xl:gap-x-8" role="list" aria-label="Danh sách vật tư">
      {products.map((product) => (
        <li key={product.id} className="contents">
          <ProductCard product={product} allProducts={allProducts} onAddToCart={onAddToCart} />
        </li>
      ))}
    </ul>
  );
};

export default React.memo(ProductList);
