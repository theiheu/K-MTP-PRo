import React, { useState } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
  </svg>
);

const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isFirstImage = currentImageIndex === 0;
    const newIndex = isFirstImage ? product.images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const isLastImage = currentImageIndex === product.images.length - 1;
    const newIndex = isLastImage ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
  };

  return (
    <div className="group relative flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden">
        {/* Image Carousel Container */}
        <div
            className="flex h-full transition-transform duration-500 ease-in-out will-change-transform"
            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
        >
            {product.images.map((image, index) => (
                <img
                    key={index}
                    src={image}
                    alt={`${product.name} ảnh ${index + 1}`}
                    className="w-full h-full object-center object-cover flex-shrink-0"
                    loading={index === 0 ? "eager" : "lazy"} // Eager load first image, lazy load others
                />
            ))}
        </div>

        {product.images.length > 1 && (
          <>
            <button onClick={goToPrevious} aria-label="Ảnh trước" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={goToNext} aria-label="Ảnh sau" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Chuyển đến ảnh ${index + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${currentImageIndex === index ? 'bg-white scale-125' : 'bg-white bg-opacity-50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-gray-700">
            {product.name}
        </h3>
        <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        <div className="flex-grow"></div>
        <div className="flex justify-between items-center mt-4">
          <p className="text-md font-medium text-gray-700">
            Tồn kho: <span className={`font-bold ${product.stock > 0 ? 'text-gray-900' : 'text-red-600'}`}>{product.stock}</span>
          </p>
          <button
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5 mr-1" />
            Thêm vào phiếu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
