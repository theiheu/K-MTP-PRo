import React from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  onSelectVariant: (product: Product) => void;
  totalProducts: number;
}

const ProductList: React.FC<ProductListProps> = ({ products, onSelectVariant, totalProducts }) => {
  if (totalProducts === 0) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-700">Không tìm thấy vật tư</h2>
        <p className="mt-2 text-gray-500">Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onSelectVariant={onSelectVariant} />
      ))}
    </div>
  );
};

export default ProductList;
