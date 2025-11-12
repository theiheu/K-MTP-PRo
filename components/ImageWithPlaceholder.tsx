import React, { useState, useEffect } from "react";

interface ImageWithPlaceholderProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string; // This will be passed to the actual image
  placeholderClassName?: string; // For the placeholder container
}

const PhotoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
    />
  </svg>
);

const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({
  src,
  alt,
  className,
  placeholderClassName,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  const handleLoad = () => setIsLoaded(true);
  const handleError = () => setHasError(true);

  const showPlaceholder = !isLoaded && !hasError;
  const showError = hasError;
  const showImage = isLoaded && !hasError;

  return (
    <div
      className={`relative h-full transition-colors duration-300 ${
        isLoaded ? "bg-transparent" : "bg-gray-200"
      }`}
    >
      {showPlaceholder && (
        <div
          className={`absolute inset-0 flex items-center justify-center text-gray-400 ${placeholderClassName}`}
        >
          <PhotoIcon className="w-1/4 h-1/4 min-w-[24px] min-h-[24px]" />
        </div>
      )}

      {showError && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500 ${placeholderClassName}`}
        >
          <span className="sr-only">Lỗi tải ảnh</span>
          <PhotoIcon className="w-1/4 h-1/4 min-w-[24px] min-h-[24px]" />
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${
          showImage ? "opacity-100" : "opacity-0"
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default ImageWithPlaceholder;
