import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Product, Variant } from '../types';
import ImageWithPlaceholder from './ImageWithPlaceholder';
import { calculateVariantStock } from '../utils/stockCalculator';

interface ProductCardProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
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

const ProductCard: React.FC<ProductCardProps> = ({ product, allProducts, onAddToCart }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState<number | ''>(1);
  
  const touchStartX = useRef<number>(0);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
      const initialSelection: { [key: string]: string } = {};
      product.options.forEach(optionName => {
        const firstValue = ([...new Set(product.variants.map(v => v.attributes[optionName]))].filter(Boolean) as string[])[0];
        if (firstValue) {
          initialSelection[optionName] = firstValue;
        }
      });
      setSelectedOptions(initialSelection);
      setQuantity(1);
    }
  }, [product]);

  const currentVariant = useMemo(() => {
    if (!product) return null;
    if (product.options.length === 0) return product.variants[0];
    
    return product.variants.find(variant => 
      product.options.every(optName => variant.attributes[optName] === selectedOptions[optName])
    ) || null;
  }, [product, selectedOptions]);
  
  const calculatedStock = useMemo(() => {
    if (!currentVariant) return 0;
    return calculateVariantStock(currentVariant, allProducts);
  }, [currentVariant, allProducts]);


  const imagesToShow = useMemo(() => {
    if (!product) return [];
    const variantImages = currentVariant?.images;
    return (variantImages && variantImages.length > 0) ? variantImages : product.images;
  }, [product, currentVariant]);
  
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [imagesToShow]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
    setQuantity(1);
  };

  const increment = () => setQuantity(q => {
    const currentVal = typeof q === 'number' ? q : 0;
    const newVal = currentVal + 1;
    return (newVal > calculatedStock) ? q : newVal;
  });
  const decrement = () => setQuantity(q => {
    const currentVal = typeof q === 'number' ? q : 1;
    return (currentVal > 1 ? currentVal - 1 : 1);
  });

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
      return;
    }
    let num = parseInt(value, 10);
    if (isNaN(num)) {
      return; // Do nothing if not a number
    }
    
    if (num < 0) { // prevent negative
        num = 0;
    }

    if (calculatedStock > 0) {
        if (num > calculatedStock) {
            num = calculatedStock;
        }
    } else {
        // If no stock, quantity should be 0, but input is disabled anyway
        num = 0;
    }
    setQuantity(num);
  };

  const handleQuantityBlur = () => {
      // If the field is empty or 0 on blur, reset to 1 (if there is stock).
      if ((quantity === '' || (typeof quantity === 'number' && quantity < 1)) && calculatedStock > 0) {
          setQuantity(1);
      } else if (calculatedStock === 0) {
          // If no stock, ensure quantity is not set to a number.
          // Since it's disabled, an empty string is fine.
          setQuantity('');
      }
  };

  const handleAddToCartClick = () => {
    if (currentVariant) {
      const finalQuantity = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
      onAddToCart(product, currentVariant, finalQuantity);
    }
  };

  const goToPrevious = () => {
    const isFirstImage = currentImageIndex === 0;
    const newIndex = isFirstImage ? imagesToShow.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };

  const goToNext = () => {
    const isLastImage = currentImageIndex === imagesToShow.length - 1;
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
    if (imagesToShow.length <= 1) return;
    setIsDragging(true);
    touchStartX.current = e.targetTouches[0].clientX;
    setDragOffset(0); 
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || imagesToShow.length <= 1) return;
    e.preventDefault(); 
    const currentX = e.targetTouches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    setDragOffset(deltaX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || imagesToShow.length <= 1) return;
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
        className="relative aspect-[4/3] bg-gray-200 overflow-hidden cursor-grab active:cursor-grabbing"
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
            {imagesToShow.map((image, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                    <ImageWithPlaceholder
                        src={image}
                        alt={`${product.name} - view ${index + 1}`}
                        className="w-full h-full object-center object-cover"
                        loading={index === 0 ? "eager" : "lazy"}
                        draggable="false"
                    />
                </div>
            ))}
        </div>

        {imagesToShow.length > 1 && (
          <>
            <button onClick={handlePrevClick} aria-label="Ảnh trước" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 sm:bg-opacity-30 text-white rounded-full p-1.5 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10 block sm:opacity-0 group-hover:opacity-100">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <button onClick={handleNextClick} aria-label="Ảnh sau" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 sm:bg-opacity-30 text-white rounded-full p-1.5 transition-opacity duration-300 focus:outline-none focus:ring-2 focus:ring-white z-10 block sm:opacity-0 group-hover:opacity-100">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
              {imagesToShow.map((_, index) => (
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
          <div className="mt-3 space-y-2">
            {product.options.map(optionName => {
              const availableValues = [...new Set(product.variants.map(v => v.attributes[optionName]).filter(Boolean))] as string[];
              return (
                <div key={optionName}>
                  <h4 className="text-xs font-medium text-gray-600">{optionName}</h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {availableValues.map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleOptionSelect(optionName, value)}
                        className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                          selectedOptions[optionName] === value 
                          ? 'bg-yellow-500 text-white border-transparent' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex-grow"></div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-700">
              Tồn kho: <span className={`font-bold ${calculatedStock > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {calculatedStock.toLocaleString('vi-VN')} {currentVariant?.unit}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-md">
                {/* FIX: Coerce quantity to a number before comparison to avoid TypeScript error when it's an empty string. */}
                <button type="button" onClick={decrement} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md disabled:opacity-50" disabled={Number(quantity) <= 1 || calculatedStock === 0}>-</button>
                <input 
                    type="number" 
                    value={quantity}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    disabled={calculatedStock === 0}
                    className="w-12 text-center border-l border-r border-gray-300 focus:outline-none py-1 disabled:bg-gray-100"
                    aria-label={`Số lượng cho ${product.name}`}
                />
                <button type="button" onClick={increment} className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md disabled:opacity-50" disabled={!currentVariant || (typeof quantity === 'number' && quantity >= calculatedStock)}>+</button>
            </div>
            <button
              onClick={handleAddToCartClick}
              disabled={!currentVariant || calculatedStock === 0}
              className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              Thêm
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductCard;