import React, { useRef, useState } from 'react';
import { Product, Variant } from '../types';
import ProductCard from './ProductCard';

interface PopularProductsSliderProps {
  products: Product[];
  allProducts: Product[];
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
  onImageClick: (images: string[], startIndex: number) => void;
}

const PopularProductsSlider: React.FC<PopularProductsSliderProps> = ({
  products,
  allProducts,
  onAddToCart,
  onImageClick
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  if (products.length === 0) return null;

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
    <div className="mb-8 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">🔥 Yêu cầu thường xuyên</h2>
        <div className="hidden sm:flex space-x-2">
          <button 
            onClick={scrollLeft}
            className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none"
            aria-label="Cuộn trái"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          <button 
            onClick={scrollRight}
            className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none"
            aria-label="Cuộn phải"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        ref={sliderRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar ${isDown ? 'cursor-grabbing select-none' : 'cursor-grab scroll-smooth'}`} 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="snap-start shrink-0 w-[80vw] sm:w-64 md:w-72">
            <ProductCard 
              product={product} 
              allProducts={allProducts} 
              onAddToCart={onAddToCart} 
              onImageClick={onImageClick} 
              disableSwipe={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(PopularProductsSlider);
