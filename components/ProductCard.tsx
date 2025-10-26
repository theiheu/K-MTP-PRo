import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelectVariant: (product: Product) => void;
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

const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectVariant }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const touchStartX = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);

  const handleActionClick = () => {
    onSelectVariant(product);
  };

  const goToPrevious = () => {
    const isFirstImage = currentImageIndex === 0;
    const newIndex = isFirstImage ? product.images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };

  const goToNext = () => {
    const isLastImage = currentImageIndex === product.images.length - 1;
    const newIndex = isLastImage ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
  };
  
  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    goToPrevious();
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    goToNext();
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (product.images.length <= 1) return;
    setIsDragging(true);
    touchStartX.current = e.targetTouches[0].clientX;
    setDragOffset(0); 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || product.images.length <= 1) return;
    e.preventDefault(); 
    const currentX = e.targetTouches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || product.images.length <= 1) return;
    const swipeThreshold = imageContainerRef.current ? imageContainerRef.current.offsetWidth / 4 : 50;
    if (dragOffset < -swipeThreshold) {
      goToNext();
    } else if (dragOffset > swipeThreshold) {
      goToPrevious();
    }
    setIsDragging(false);
    setDragOffset(0);
    touchStartX.current = 0;
  };

  return (
    <div className="group relative flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div 
        ref={imageContainerRef}
        className="relative aspect-w-1 aspect-h-1 bg-gray-200 overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
            className="flex h-full will-change-transform"
            style={{ 
              transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
             }}
        >
            {product.images.map((image, index) => (
                <img
                    key={index}
                    src={image}
                    alt={`${product.name} ảnh ${index + 1}`}
                    className="w-full h-full object-center object-cover flex-shrink-0"
                    loading={index === 0 ? "eager" : "lazy"}
                    draggable="false"
                />
            ))}
        </div>

        {product.images.length > 1 && (
          <>
            <button onClick={handlePrevClick} aria-label="Ảnh trước" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 sm:bg-opacity-30 text-white rounded-full p-1.5 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10 block sm:opacity-0 group-hover:opacity-100">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={handleNextClick} aria-label="Ảnh sau" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 sm:bg-opacity-30 text-white rounded-full p-1.5 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10 block sm:opacity-0 group-hover:opacity-100">
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
        {product.options.length > 0 && (
          <p className="mt-2 text-xs text-gray-400">Có các tùy chọn: {product.options.join(', ')}</p>
        )}
        <div className="flex-grow"></div>
        <div className="flex justify-between items-center mt-4">
           <p className="text-sm font-medium text-gray-700">
            Tồn kho: <span className={`font-bold ${totalStock > 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {totalStock.toLocaleString('vi-VN')}
            </span>
          </p>
          <div className="relative">
            <button
              onClick={handleActionClick}
              disabled={totalStock === 0}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              {product.options.length > 0 ? 'Chọn tùy chọn' : 'Thêm vào phiếu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;