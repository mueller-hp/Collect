/**
 * Custom hook לדחיית קריאות פונקציה
 * Debounce hook for performance optimization
 */

import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../utils/performance';

/**
 * Hook לדחיית ערך (debounced value)
 */
export const use_debounced_value = <T>(value: T, delay: number = 300): T => {
  const [debounced_value, set_debounced_value] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      set_debounced_value(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debounced_value;
};

/**
 * Hook לדחיית קריאה לפונקציה
 */
export const use_debounced_callback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T => {
  return useCallback(
    debounce(callback, delay),
    [callback, delay]
  ) as T;
};

/**
 * Hook משולב לחיפוש עם debounce
 */
export const use_debounced_search = (
  search_function: (query: string) => void,
  delay: number = 300
) => {
  const [search_query, set_search_query] = useState('');
  const [is_searching, set_is_searching] = useState(false);
  
  const debounced_search = use_debounced_callback((query: string) => {
    if (query.trim()) {
      set_is_searching(true);
      search_function(query);
      set_is_searching(false);
    }
  }, delay);
  
  const handle_search_change = useCallback((query: string) => {
    set_search_query(query);
    debounced_search(query);
  }, [debounced_search]);
  
  return {
    search_query,
    is_searching,
    handle_search_change,
    set_search_query
  };
};