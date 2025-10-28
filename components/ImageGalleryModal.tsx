import React from 'react';
import { useState, useEffect } from 'react';
import ImageWithPlaceholder from './ImageWithPlaceholder';

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

const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);


interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  startIndex: number;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ isOpen, onClose, images, startIndex }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);
  
  const goToPrevious = () => {
    const isFirstImage = currentIndex === 0;
    const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastImage = currentIndex === images.length - 1;
    const newIndex = isLastImage ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="relative z-[100]" aria-labelledby="modal-title" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="fixed inset-0 bg-black bg-opacity-80 transition-opacity ease-in-out duration-300"></div>
      
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
            
          <div className="relative transform text-left text-white transition-all w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
             {/* Close Button */}
             <button
                onClick={onClose}
                aria-label="Đóng thư viện"
                className="absolute -top-12 right-0 sm:right-2 text-white hover:text-gray-300 z-20"
            >
                <XMarkIcon className="w-8 h-8" />
            </button>
            
            <div className="relative">
                {/* Image Display */}
                <div className="flex items-center justify-center max-h-[80vh] w-full">
                    <ImageWithPlaceholder 
                        src={images[currentIndex]} 
                        alt={`Xem ảnh ${currentIndex + 1}`} 
                        className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl"
                        placeholderClassName="rounded-lg"
                    />
                </div>

                {/* Navigation Buttons */}
                {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                        aria-label="Ảnh trước"
                        className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white z-10"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        aria-label="Ảnh sau"
                        className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white z-10"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
                )}
            </div>

            {/* Counter */}
            {images.length > 1 && (
                <div className="text-center text-sm text-gray-300 mt-4">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;