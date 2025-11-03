/**
 * Performance monitoring utilities
 */

// Track component render times
export const measureRender = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      if (duration > 16) { // More than one frame (60fps)
        console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {}; // No-op in production
};

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll/resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memoize expensive calculations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

// Lazy load images with Intersection Observer
export function lazyLoadImage(img: HTMLImageElement, src: string): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback for browsers without Intersection Observer
    img.src = src;
  }
}

// Report Web Vitals
export function reportWebVitals(onPerfEntry?: (metric: any) => void): void {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    }).catch(() => {
      // web-vitals not installed, silently fail
    });
  }
}

// Measure function execution time
export function measureExecutionTime<T>(
  fn: () => T,
  label: string
): T {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`[Performance] ${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

// Check if device is low-end
export function isLowEndDevice(): boolean {
  // Check for navigator.deviceMemory (Chrome only)
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) {
    return true;
  }

  // Check for navigator.hardwareConcurrency
  const cores = navigator.hardwareConcurrency;
  if (cores && cores < 4) {
    return true;
  }

  return false;
}

// Prefetch resources
export function prefetchResource(url: string, as: 'script' | 'style' | 'image' = 'script'): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
}

// Preload critical resources
export function preloadResource(url: string, as: 'script' | 'style' | 'image' = 'script'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;
  document.head.appendChild(link);
}

