/**
 * כלי ביצועים לטיפול במערכי נתונים גדולים
 * Performance utilities for handling large datasets
 */

import { DebtRecord } from '../types';

// הגדרות ביצועים
export const PERFORMANCE_CONFIG = {
  CHUNK_SIZE: 1000,           // גודל נתח עיבוד
  VIRTUAL_SCROLL_BUFFER: 10,  // מספר רשומות באפר גלילה וירטואלית
  DEBOUNCE_DELAY: 300,        // השהיית debounce למיליסניות
  MAX_RENDER_ITEMS: 50,       // מקסימום פריטים לרינדור בו זמנית
  PAGINATION_SIZE: 100        // גודל עמוד ברירת מחדל
};

/**
 * חיתוך מערך לנתחים קטנים לעיבוד
 */
export const chunk_array = <T>(array: T[], chunk_size: number = PERFORMANCE_CONFIG.CHUNK_SIZE): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunk_size) {
    chunks.push(array.slice(i, i + chunk_size));
  }
  return chunks;
};

/**
 * עיבוד אסינכרוני של מערך גדול
 */
export const process_large_array = async <T, R>(
  array: T[],
  processor: (item: T) => R,
  chunk_size: number = PERFORMANCE_CONFIG.CHUNK_SIZE,
  on_progress?: (processed: number, total: number) => void
): Promise<R[]> => {
  const results: R[] = [];
  const chunks = chunk_array(array, chunk_size);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // עיבוד נתח באופן סינכרוני
    const chunk_results = chunk.map(processor);
    results.push(...chunk_results);
    
    // עדכון התקדמות
    if (on_progress) {
      on_progress(results.length, array.length);
    }
    
    // מתן זמן לדפדפן לטפל באירועים אחרים
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return results;
};

/**
 * סינון מהיר עם זיכרון מטמון
 */
export class FastFilter<T> {
  private cache = new Map<string, T[]>();
  private data: T[];
  
  constructor(data: T[]) {
    this.data = data;
  }
  
  filter(predicate: (item: T) => boolean, cache_key?: string): T[] {
    if (cache_key && this.cache.has(cache_key)) {
      return this.cache.get(cache_key)!;
    }
    
    const result = this.data.filter(predicate);
    
    if (cache_key) {
      this.cache.set(cache_key, result);
    }
    
    return result;
  }
  
  update_data(new_data: T[]) {
    this.data = new_data;
    this.cache.clear();
  }
  
  clear_cache() {
    this.cache.clear();
  }
}

/**
 * דחיית קריאות פונקציה (debounce)
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = PERFORMANCE_CONFIG.DEBOUNCE_DELAY
): ((...args: Parameters<T>) => void) => {
  let timeout_id: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout_id);
    timeout_id = setTimeout(() => func(...args), delay);
  };
};

/**
 * גלילה וירטואלית - חישוב פריטים נראים
 */
export interface VirtualScrollParams {
  container_height: number;
  item_height: number;
  total_items: number;
  scroll_top: number;
  buffer_size?: number;
}

export interface VirtualScrollResult {
  start_index: number;
  end_index: number;
  visible_items: number;
  offset_y: number;
  total_height: number;
}

export const calculate_virtual_scroll = ({
  container_height,
  item_height,
  total_items,
  scroll_top,
  buffer_size = PERFORMANCE_CONFIG.VIRTUAL_SCROLL_BUFFER
}: VirtualScrollParams): VirtualScrollResult => {
  const visible_items = Math.ceil(container_height / item_height);
  const start_index = Math.max(0, Math.floor(scroll_top / item_height) - buffer_size);
  const end_index = Math.min(total_items - 1, start_index + visible_items + (buffer_size * 2));
  
  return {
    start_index,
    end_index,
    visible_items: end_index - start_index + 1,
    offset_y: start_index * item_height,
    total_height: total_items * item_height
  };
};

/**
 * מטמון חכם עם תפוגה זמנית
 */
export class SmartCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private ttl: number; // Time to live במיליסניות
  
  constructor(ttl: number = 5 * 60 * 1000) { // 5 דקות ברירת מחדל
    this.ttl = ttl;
  }
  
  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // בדיקת תוקף
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  size(): number {
    this.cleanup();
    return this.cache.size;
  }
}

/**
 * מדידת ביצועים
 */
export class PerformanceMonitor {
  private measurements = new Map<string, number[]>();
  
  start(operation: string): () => void {
    const start_time = performance.now();
    
    return () => {
      const duration = performance.now() - start_time;
      
      if (!this.measurements.has(operation)) {
        this.measurements.set(operation, []);
      }
      
      this.measurements.get(operation)!.push(duration);
    };
  }
  
  get_stats(operation: string) {
    const times = this.measurements.get(operation);
    
    if (!times || times.length === 0) {
      return null;
    }
    
    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    
    return {
      count: times.length,
      avg: sum / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)]
    };
  }
  
  get_all_stats() {
    const stats: Record<string, any> = {};
    
    for (const operation of this.measurements.keys()) {
      stats[operation] = this.get_stats(operation);
    }
    
    return stats;
  }
  
  clear(operation?: string) {
    if (operation) {
      this.measurements.delete(operation);
    } else {
      this.measurements.clear();
    }
  }
}

/**
 * אינסטנס גלובלי למוניטור ביצועים
 */
export const performance_monitor = new PerformanceMonitor();

/**
 * מאגר אובייקטים לחיסכון בזיכרון
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private create_fn: () => T;
  private reset_fn: (item: T) => void;
  
  constructor(create_fn: () => T, reset_fn: (item: T) => void, initial_size: number = 10) {
    this.create_fn = create_fn;
    this.reset_fn = reset_fn;
    
    // אתחול המאגר
    for (let i = 0; i < initial_size; i++) {
      this.pool.push(create_fn());
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    
    return this.create_fn();
  }
  
  release(item: T): void {
    this.reset_fn(item);
    this.pool.push(item);
  }
  
  get_pool_size(): number {
    return this.pool.length;
  }
}

/**
 * פונקציות עזר לחיובי עבודה עם רשומות חוב
 */
export const debt_performance_utils = {
  
  /**
   * סינון מהיר של רשומות חוב
   */
  fast_filter_debts: (
    debts: DebtRecord[],
    filters: {
      status?: string;
      min_amount?: number;
      max_amount?: number;
      customer_name?: string;
    }
  ): DebtRecord[] => {
    return debts.filter(debt => {
      if (filters.status && debt.status !== filters.status) return false;
      if (filters.min_amount && debt.remaining_debt < filters.min_amount) return false;
      if (filters.max_amount && debt.remaining_debt > filters.max_amount) return false;
      if (filters.customer_name && !debt.customer_name.includes(filters.customer_name)) return false;
      return true;
    });
  },
  
  /**
   * מיון מהיר של רשומות חוב
   */
  fast_sort_debts: (
    debts: DebtRecord[],
    field: keyof DebtRecord,
    direction: 'asc' | 'desc' = 'asc'
  ): DebtRecord[] => {
    return debts.sort((a, b) => {
      const a_val = a[field];
      const b_val = b[field];
      
      if (typeof a_val === 'string' && typeof b_val === 'string') {
        return direction === 'asc' 
          ? a_val.localeCompare(b_val, 'he')
          : b_val.localeCompare(a_val, 'he');
      }
      
      if (typeof a_val === 'number' && typeof b_val === 'number') {
        return direction === 'asc' ? a_val - b_val : b_val - a_val;
      }
      
      if (a_val instanceof Date && b_val instanceof Date) {
        return direction === 'asc' 
          ? a_val.getTime() - b_val.getTime()
          : b_val.getTime() - a_val.getTime();
      }
      
      return 0;
    });
  },
  
  /**
   * חישוב מהיר של KPI לרשומות חוב
   */
  calculate_debt_kpis: (debts: DebtRecord[]) => {
    let total_amount = 0;
    let active_count = 0;
    let overdue_count = 0;
    
    const now = new Date();
    
    for (const debt of debts) {
      total_amount += debt.remaining_debt;
      
      if (debt.status === 'פעיל') {
        active_count++;
      }
      
      if (debt.due_date && debt.due_date < now && debt.status === 'פעיל') {
        overdue_count++;
      }
    }
    
    return {
      total_amount,
      total_count: debts.length,
      active_count,
      overdue_count,
      average_amount: debts.length > 0 ? total_amount / debts.length : 0
    };
  }
};