import React, { useState, useEffect, useMemo } from 'react';
import { Product, Variant } from '../types';
import ImageWithPlaceholder from './ImageWithPlaceholder';

interface VariantSelectorModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, variant: Variant, quantity: number) => void;
}

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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


const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({ product, onClose, onAddToCart }) => {
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
      setCurrentImageIndex(0);
    }
  }, [product]);

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
  };

  const currentVariant = useMemo(() => {
    if (!product) return null;
    if (product.options.length === 0) return product.variants[0];
    
    return product.variants.find(variant => 
      product.options.every(optName => variant.attributes[optName] === selectedOptions[optName])
    ) || null;
  }, [product, selectedOptions]);

  const imagesToShow = useMemo(() => {
    if (!product) return [];
    const variantImages = currentVariant?.images;
    // Prioritize variant-specific images, fall back to general product images
    return (variantImages && variantImages.length > 0) ? variantImages : product.images;
  }, [product, currentVariant]);
  
  // Reset the image carousel to the first image whenever the variant changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [imagesToShow]);


  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value, 10);
    if (isNaN(newQuantity) || newQuantity < 1) {
      newQuantity = 1;
    }
    if (currentVariant && newQuantity > currentVariant.stock) {
      newQuantity = currentVariant.stock;
    }
    setQuantity(newQuantity);
  };

  const increment = () => setQuantity(q => {
    const newQuantity = q + 1;
    return (currentVariant && newQuantity > currentVariant.stock) ? q : newQuantity;
  });
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    if (product && currentVariant && quantity > 0) {
      onAddToCart(product, currentVariant, quantity);
    }
  };

  const goToPrevious = () => {
    const isFirstImage = currentImageIndex === 0;
    // FIX: Changed `currentIndex` to `currentImageIndex` to match state variable.
    const newIndex = isFirstImage ? imagesToShow.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
  };
  const goToNext = () => {
    const isLastImage = currentImageIndex === imagesToShow.length - 1;
    const newIndex = isLastImage ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(newIndex);
  };

  if (!product) return null;
  
  const renderOptions = () => {
    return product.options.map(optionName => {
      const availableValues = [...new Set(product.variants.map(v => v.attributes[optionName]).filter(Boolean))] as string[];
      
      return (
        <div key={optionName}>
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">{optionName}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {availableValues.map(value => (
              <button
                key={value}
                type="button"
                onClick={() => handleOptionSelect(optionName, value)}
                className={`flex items-center justify-center rounded-md border py-2 px-3 text-sm font-medium uppercase focus:outline-none sm:flex-1 transition-colors ${
                  selectedOptions[optionName] === value 
                  ? 'bg-yellow-500 text-white border-transparent shadow-sm' 
                  : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      );
    });
  };
  
  return (
    <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-0 text-center sm:items-center sm:p-4">
          <div className="relative transform overflow-hidden rounded-t-lg sm:rounded-lg bg-white text-left shadow-xl transition-all w-full sm:my-8 sm:w-full sm:max-w-lg">
            <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                <button type="button" className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2" onClick={onClose}>
                    <span className="sr-only">Đóng</span>
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            
            {/* Image Carousel */}
            <div className="w-full bg-gray-200 overflow-hidden">
                {imagesToShow.length > 0 ? (
                    <div className="relative group h-[35vh] sm:h-auto sm:aspect-square">
                        <ImageWithPlaceholder src={imagesToShow[currentImageIndex]} alt={`${product.name} ảnh ${currentImageIndex + 1}`} className="h-full w-full object-cover object-center" />
                        {imagesToShow.length > 1 && (
                            <>
                                <button onClick={goToPrevious} aria-label="Ảnh trước" className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <ChevronLeftIcon className="w-5 h-5" />
                                </button>
                                <button onClick={goToNext} aria-label="Ảnh sau" className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <ChevronRightIcon className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                                    {imagesToShow.map((_, index) => (
                                        <button key={index} onClick={() => setCurrentImageIndex(index)} className={`w-2 h-2 rounded-full ${
currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-[35vh] sm:h-auto sm:aspect-square text-gray-500">
                        <span>Không có ảnh</span>
                    </div>
                )}
            </div>
            
            {/* Form */}
            <div className="px-4 pt-5 pb-6 sm:px-6">
                <h3 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">{product.name}</h3>
                <div className="mt-3">
                    {currentVariant ? (
                        <p className={`text-sm ${currentVariant.stock > 0 ? 'text-gray-700' : 'text-red-600'}`}>
                            Tồn kho: <span className="font-bold">{currentVariant.stock.toLocaleString('vi-VN')}</span>
                        </p>
                    ) : (
                        <p className="mt-1 text-sm text-red-600">Biến thể không hợp lệ</p>
                    )}
                </div>

                <div className="mt-6 space-y-5">
                    {renderOptions()}
                    
                    {/* Quantity Selector */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Số lượng</h4>
                        <div className="mt-2 flex items-center border border-gray-300 rounded-md w-fit">
                            <button type="button" onClick={decrement} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-l-md">-</button>
                            <input 
                                type="number" 
                                value={quantity} 
                                onChange={handleQuantityChange} 
                                className="w-16 text-center border-l border-r border-gray-300 focus:outline-none py-2"
                                min="1"
                                max={currentVariant?.stock || 1}
                                aria-label="Số lượng"
                                readOnly
                            />
                            <button type="button" onClick={increment} className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-r-md">+</button>
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!currentVariant || currentVariant.stock === 0}
                    className="mt-6 flex w-full items-center justify-center rounded-md border border-transparent bg-yellow-500 py-3 px-8 text-base font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {currentVariant?.stock === 0 ? 'Hết hàng' : 'Thêm vào Phiếu yêu cầu'}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectorModal;