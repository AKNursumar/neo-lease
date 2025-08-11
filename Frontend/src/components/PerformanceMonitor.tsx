import { useEffect } from 'react';
import { config } from '@/lib/config';

export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    if (!config.debug.enabled) return;

    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Only log components that take more than 100ms
        console.log(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

export const measureAsync = async <T,>(name: string, fn: () => Promise<T>): Promise<T> => {
  if (!config.debug.enabled) {
    return fn();
  }

  const startTime = performance.now();
  try {
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (duration > 50) { // Only log operations that take more than 50ms
      console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
};

export const PerformanceMonitor = () => {
  useEffect(() => {
    if (!config.debug.enabled) return;

    // Monitor overall page load performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('[Performance] Page Load Metrics:', {
            'DOM Content Loaded': `${navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart}ms`,
            'Load Complete': `${navEntry.loadEventEnd - navEntry.loadEventStart}ms`,
            'Total Load Time': `${navEntry.loadEventEnd - navEntry.fetchStart}ms`,
          });
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          console.log(`[Performance] Largest Contentful Paint: ${entry.startTime.toFixed(2)}ms`);
        }
        
        if (entry.entryType === 'first-input') {
          const fidEntry = entry as PerformanceEventTiming;
          console.log(`[Performance] First Input Delay: ${fidEntry.processingStart - fidEntry.startTime}ms`);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      observer.observe({ entryTypes: ['navigation'] });
    }

    return () => observer.disconnect();
  }, []);

  return null;
};

export default PerformanceMonitor;
