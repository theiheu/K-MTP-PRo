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

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto" onClick={onClose}>
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-8">

          {/* Image container that shrinks to fit the content */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <ImageWithPlaceholder
              src={images[currentIndex]}
              alt={`Xem ảnh ${currentIndex + 1}`}
              className="block max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-lg"
              placeholderClassName="rounded-lg"
            />
            {/* Counter below the image */}
            {images.length > 1 && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center text-sm text-white bg-black/50 rounded-full px-2 py-0.5">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Navigation buttons outside the image container */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                aria-label="Ảnh trước"
                className="fixed top-1/2 left-4 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white z-20"
              >
                <ChevronLeftIcon className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                aria-label="Ảnh sau"
                className="fixed top-1/2 right-4 -translate-y-1/2 bg-black bg-opacity-40 text-white rounded-full p-2 hover:bg-opacity-60 focus:outline-none focus:ring-2 focus:ring-white z-20"
              >
                <ChevronRightIcon className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Close button at top right of viewport */}
          <button
            onClick={onClose}
            aria-label="Đóng thư viện"
            className="fixed top-4 right-4 text-white hover:text-gray-300 z-20 bg-black bg-opacity-40 rounded-full p-2"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;