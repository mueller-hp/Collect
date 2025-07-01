/**
 * Custom hook לגלילה וירטואלית
 * Virtual scrolling hook for large datasets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { calculate_virtual_scroll, VirtualScrollParams, VirtualScrollResult } from '../utils/performance';

interface UseVirtualScrollProps {
  items: any[];
  item_height: number;
  container_height: number;
  buffer_size?: number;
}

interface UseVirtualScrollReturn {
  visible_items: any[];
  start_index: number;
  end_index: number;
  total_height: number;
  offset_y: number;
  scroll_element_props: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  container_props: {
    style: React.CSSProperties;
  };
}

/**
 * Hook לטיפול בגלילה וירטואלית של רשימות גדולות
 */
export const use_virtual_scroll = ({
  items,
  item_height,
  container_height,
  buffer_size = 10
}: UseVirtualScrollProps): UseVirtualScrollReturn => {
  
  const [scroll_top, set_scroll_top] = useState(0);
  
  // חישוב פרמטרי הגלילה הוירטואלית
  const scroll_params = useMemo((): VirtualScrollResult => {
    return calculate_virtual_scroll({
      container_height,
      item_height,
      total_items: items.length,
      scroll_top,
      buffer_size
    });
  }, [container_height, item_height, items.length, scroll_top, buffer_size]);
  
  // קבלת הפריטים הנראים
  const visible_items = useMemo(() => {
    return items.slice(scroll_params.start_index, scroll_params.end_index + 1);
  }, [items, scroll_params.start_index, scroll_params.end_index]);
  
  // טיפול באירוע גלילה
  const handle_scroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const new_scroll_top = event.currentTarget.scrollTop;
    set_scroll_top(new_scroll_top);
  }, []);
  
  // props לאלמנט הגלילה
  const scroll_element_props = useMemo(() => ({
    style: {
      height: container_height,
      overflow: 'auto' as const,
      direction: 'rtl' as const
    },
    onScroll: handle_scroll
  }), [container_height, handle_scroll]);
  
  // props למכל הפנימי
  const container_props = useMemo(() => ({
    style: {
      height: scroll_params.total_height,
      position: 'relative' as const,
      paddingTop: scroll_params.offset_y
    }
  }), [scroll_params.total_height, scroll_params.offset_y]);
  
  return {
    visible_items,
    start_index: scroll_params.start_index,
    end_index: scroll_params.end_index,
    total_height: scroll_params.total_height,
    offset_y: scroll_params.offset_y,
    scroll_element_props,
    container_props
  };
};