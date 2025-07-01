/**
 * Custom hook למוניטורינג ביצועים
 * Performance monitoring hook
 */

import { useCallback, useEffect, useState } from 'react';
import { performance_monitor, PerformanceMonitor } from '../utils/performance';

interface PerformanceStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  median: number;
}

interface UsePerformanceMonitorReturn {
  measure: <T>(operation: string, fn: () => T) => T;
  measure_async: <T>(operation: string, fn: () => Promise<T>) => Promise<T>;
  get_stats: (operation: string) => PerformanceStats | null;
  get_all_stats: () => Record<string, PerformanceStats>;
  clear_stats: (operation?: string) => void;
  is_slow_operation: (operation: string, threshold?: number) => boolean;
}

/**
 * Hook למוניטורינג ביצועים של פעולות
 */
export const use_performance_monitor = (): UsePerformanceMonitorReturn => {
  
  // מדידת פעולה סינכרונית
  const measure = useCallback(<T>(operation: string, fn: () => T): T => {
    const end_measurement = performance_monitor.start(operation);
    try {
      const result = fn();
      return result;
    } finally {
      end_measurement();
    }
  }, []);
  
  // מדידת פעולה אסינכרונית
  const measure_async = useCallback(async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
    const end_measurement = performance_monitor.start(operation);
    try {
      const result = await fn();
      return result;
    } finally {
      end_measurement();
    }
  }, []);
  
  // קבלת סטטיסטיקות פעולה
  const get_stats = useCallback((operation: string): PerformanceStats | null => {
    return performance_monitor.get_stats(operation);
  }, []);
  
  // קבלת כל הסטטיסטיקות
  const get_all_stats = useCallback((): Record<string, PerformanceStats> => {
    return performance_monitor.get_all_stats();
  }, []);
  
  // ניקוי סטטיסטיקות
  const clear_stats = useCallback((operation?: string): void => {
    performance_monitor.clear(operation);
  }, []);
  
  // בדיקה אם פעולה איטית
  const is_slow_operation = useCallback((operation: string, threshold: number = 100): boolean => {
    const stats = get_stats(operation);
    return stats ? stats.avg > threshold : false;
  }, [get_stats]);
  
  return {
    measure,
    measure_async,
    get_stats,
    get_all_stats,
    clear_stats,
    is_slow_operation
  };
};

/**
 * Hook לניטור ביצועי רינדור רכיב
 */
export const use_render_performance = (component_name: string) => {
  const { measure } = use_performance_monitor();
  const [render_count, set_render_count] = useState(0);
  
  useEffect(() => {
    measure(`${component_name}_render`, () => {
      set_render_count(prev => prev + 1);
    });
  });
  
  return { render_count };
};

/**
 * Hook לאזהרות ביצועים
 */
export const use_performance_warnings = () => {
  const { get_all_stats } = use_performance_monitor();
  const [warnings, set_warnings] = useState<string[]>([]);
  
  useEffect(() => {
    const check_performance = () => {
      const stats = get_all_stats();
      const new_warnings: string[] = [];
      
      Object.entries(stats).forEach(([operation, stat]) => {
        if (stat.avg > 500) { // איטי מ-500ms
          new_warnings.push(`פעולה איטית: ${operation} (ממוצע: ${stat.avg.toFixed(2)}ms)`);
        }
        
        if (stat.count > 100 && stat.avg > 100) { // הרבה קריאות איטיות
          new_warnings.push(`פעולה נקראת הרבה: ${operation} (${stat.count} פעמים, ממוצע: ${stat.avg.toFixed(2)}ms)`);
        }
      });
      
      set_warnings(new_warnings);
    };
    
    const interval = setInterval(check_performance, 5000); // בדיקה כל 5 שניות
    return () => clearInterval(interval);
  }, [get_all_stats]);
  
  return warnings;
};

/**
 * Hook למדידת זמן טעינת נתונים
 */
export const use_data_loading_performance = () => {
  const { measure_async } = use_performance_monitor();
  const [loading_stats, set_loading_stats] = useState<{
    operation: string;
    duration: number;
    timestamp: number;
  }[]>([]);
  
  const measure_data_loading = useCallback(async <T>(
    operation: string,
    data_loader: () => Promise<T>
  ): Promise<T> => {
    const start_time = Date.now();
    
    const result = await measure_async(operation, data_loader);
    
    const duration = Date.now() - start_time;
    set_loading_stats(prev => [
      ...prev.slice(-9), // שמירת 10 מדידות אחרונות
      { operation, duration, timestamp: start_time }
    ]);
    
    return result;
  }, [measure_async]);
  
  return {
    measure_data_loading,
    loading_stats,
    clear_loading_stats: () => set_loading_stats([])
  };
};