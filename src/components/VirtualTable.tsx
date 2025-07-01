/**
 * טבלה וירטואלית לטיפול במערכי נתונים גדולים
 * Virtual table component for large datasets
 */

import React, { useMemo } from 'react';
import { use_virtual_scroll } from '../hooks/useVirtualScroll';
import { DebtRecord } from '../types';
import { format_israeli_currency, format_israeli_date } from '../utils/formatting';

interface VirtualTableProps {
  data: DebtRecord[];
  container_height?: number;
  item_height?: number;
  on_row_click?: (record: DebtRecord) => void;
  selected_ids?: string[];
  show_pagination?: boolean;
}

interface TableColumn {
  key: keyof DebtRecord;
  title: string;
  width: string;
  render?: (value: any, record: DebtRecord) => React.ReactNode;
}

const VirtualTable: React.FC<VirtualTableProps> = ({
  data,
  container_height = 400,
  item_height = 60,
  on_row_click,
  selected_ids = [],
  show_pagination = false
}) => {
  
  // הגדרת עמודות הטבלה
  const columns: TableColumn[] = useMemo(() => [
    {
      key: 'customer_name',
      title: 'שם לקוח',
      width: '20%'
    },
    {
      key: 'id_number',
      title: 'מס\' זהות',
      width: '15%'
    },
    {
      key: 'remaining_debt',
      title: 'סכום',
      width: '15%',
      render: (value: number) => format_israeli_currency(value)
    },
    {
      key: 'due_date',
      title: 'תאריך יעד',
      width: '15%',
      render: (value: Date) => value ? format_israeli_date(value) : '-'
    },
    {
      key: 'status',
      title: 'סטטוס',
      width: '15%',
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value === 'פעיל' ? 'bg-green-100 text-green-800' :
          value === 'סגור' ? 'bg-gray-100 text-gray-800' :
          value === 'בטיפול' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'phone',
      title: 'טלפון',
      width: '20%'
    }
  ], []);
  
  // שימוש בגלילה וירטואלית
  const {
    visible_items,
    start_index,
    end_index,
    scroll_element_props,
    container_props
  } = use_virtual_scroll({
    items: data,
    item_height,
    container_height,
    buffer_size: 5
  });
  
  // רינדור שורת כותרת
  const render_header = () => (
    <div 
      className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10"
      style={{ height: item_height }}
    >
      <div className="flex items-center h-full px-4 text-right">
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="font-medium text-gray-900 text-sm"
            style={{ width: column.width }}
          >
            {column.title}
          </div>
        ))}
      </div>
    </div>
  );
  
  // רינדור שורת נתונים
  const render_row = (record: DebtRecord, index: number) => {
    const is_selected = selected_ids.includes(record.customer_id);
    const global_index = start_index + index;
    
    return (
      <div
        key={record.customer_id}
        className={`flex items-center h-full px-4 border-b border-gray-100 cursor-pointer transition-colors ${
          is_selected ? 'bg-blue-50' : 'hover:bg-gray-50'
        } ${global_index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
        style={{ height: item_height }}
        onClick={() => on_row_click?.(record)}
        dir="rtl"
      >
        {columns.map((column) => (
          <div
            key={String(column.key)}
            className="text-sm text-gray-900 truncate text-right"
            style={{ width: column.width }}
            title={String(record[column.key])}
          >
            {column.render ? 
              column.render(record[column.key], record) : 
              String(record[column.key] || '-')
            }
          </div>
        ))}
      </div>
    );
  };
  
  // מידע על הטבלה
  const table_info = useMemo(() => ({
    total_records: data.length,
    visible_start: start_index + 1,
    visible_end: Math.min(end_index + 1, data.length),
    selected_count: selected_ids.length
  }), [data.length, start_index, end_index, selected_ids.length]);
  
  return (
    <div className="bg-white rounded-lg shadow" dir="rtl">
      
      {/* כותרת הטבלה */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            רשומות חוב ({table_info.total_records.toLocaleString()})
          </h3>
          <div className="text-sm text-gray-500">
            מציג {table_info.visible_start}-{table_info.visible_end} מתוך {table_info.total_records}
            {table_info.selected_count > 0 && (
              <span className="mr-2 text-blue-600">
                ({table_info.selected_count} נבחרו)
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* הטבלה הוירטואלית */}
      <div {...scroll_element_props}>
        {render_header()}
        <div {...container_props}>
          {visible_items.map((record, index) => render_row(record, index))}
        </div>
      </div>
      
      {/* מידע נוסף */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          לא נמצאו רשומות
        </div>
      )}
      
      {/* פסיפס ביצועים */}
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t">
        טבלה וירטואלית - מציגה {visible_items.length} מתוך {data.length} רשומות
        {data.length > 1000 && (
          <span className="text-green-600 mr-2">
            (אופטימיזציה לביצועים פעילה)
          </span>
        )}
      </div>
    </div>
  );
};

export default VirtualTable;