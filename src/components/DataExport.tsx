import React, { useState } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { DebtRecord } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_date } from '../utils/formatting';

interface DataExportProps {
  selected_records?: DebtRecord[];
  export_all?: boolean;
  on_export_complete?: (success: boolean, message: string) => void;
}

type ExportFormat = 'csv' | 'excel' | 'json';

const DataExport: React.FC<DataExportProps> = ({
  selected_records,
  export_all = false,
  on_export_complete
}) => {
  const { state } = use_debt_context();
  const { add_message } = use_debt_actions();
  
  const [export_format, set_export_format] = useState<ExportFormat>('csv');
  const [selected_fields, set_selected_fields] = useState<(keyof DebtRecord)[]>([
    'customer_name',
    'id_number',
    'debt_amount',
    'paid_amount',
    'remaining_debt',
    'due_date',
    'status',
    'collection_agent'
  ]);
  const [include_headers, set_include_headers] = useState(true);
  const [is_exporting, set_is_exporting] = useState(false);

  // שדות זמינים לייצוא
  const available_fields: { key: keyof DebtRecord; label: string }[] = [
    { key: 'customer_id', label: get_text('customer_id') },
    { key: 'customer_name', label: get_text('customer_name') },
    { key: 'id_number', label: get_text('id_number') },
    { key: 'debt_amount', label: get_text('debt_amount') },
    { key: 'paid_amount', label: get_text('paid_amount') },
    { key: 'remaining_debt', label: get_text('remaining_debt') },
    { key: 'due_date', label: get_text('due_date') },
    { key: 'status', label: get_text('status') },
    { key: 'collection_agent', label: get_text('collection_agent') },
    { key: 'phone', label: get_text('phone') },
    { key: 'notes', label: get_text('notes') },
    { key: 'last_payment_date', label: get_text('last_payment_date') },
    { key: 'created_at', label: 'תאריך יצירה' },
    { key: 'updated_at', label: 'תאריך עדכון' }
  ];

  // קבלת הנתונים לייצוא
  const get_export_data = (): DebtRecord[] => {
    if (selected_records && selected_records.length > 0) {
      return selected_records;
    }
    return export_all ? state.debts : state.filtered_debts;
  };

  // עיצוב ערך לייצוא
  const format_value_for_export = (value: any, field: keyof DebtRecord): string => {
    if (value === null || value === undefined) return '';
    
    switch (field) {
      case 'debt_amount':
      case 'paid_amount':
      case 'remaining_debt':
        return typeof value === 'number' ? value.toString() : value;
      
      case 'due_date':
      case 'last_payment_date':
      case 'created_at':
      case 'updated_at':
        return value instanceof Date ? format_israeli_date(value) : value;
      
      default:
        return value.toString();
    }
  };

  // יצירת CSV
  const create_csv = (data: DebtRecord[]): string => {
    const headers = include_headers 
      ? selected_fields.map(field => 
          available_fields.find(f => f.key === field)?.label || field
        ).join(',')
      : '';
    
    const rows = data.map(record => 
      selected_fields.map(field => {
        const value = format_value_for_export(record[field], field);
        // עטיפה במירכאות אם יש פסיקים או מירכאות
        return value.includes(',') || value.includes('"') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    );

    return include_headers ? [headers, ...rows].join('\n') : rows.join('\n');
  };

  // יצירת JSON
  const create_json = (data: DebtRecord[]): string => {
    const filtered_data = data.map(record => {
      const filtered_record: any = {};
      selected_fields.forEach(field => {
        const field_info = available_fields.find(f => f.key === field);
        const field_name = field_info?.label || field;
        filtered_record[field_name] = format_value_for_export(record[field], field);
      });
      return filtered_record;
    });

    return JSON.stringify(filtered_data, null, 2);
  };

  // הורדת קובץ
  const download_file = (content: string, filename: string, mime_type: string) => {
    const blob = new Blob([content], { type: mime_type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // פונקציה לביצוע הייצוא
  const handle_export = async () => {
    set_is_exporting(true);
    
    try {
      const data = get_export_data();
      
      if (data.length === 0) {
        add_message({
          id: `export_${Date.now()}`,
          type: 'warning',
          title: get_text('warning'),
          message: 'אין נתונים לייצוא',
          timestamp: new Date(),
          auto_dismiss: true
        });
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      let content: string;
      let filename: string;
      let mime_type: string;

      switch (export_format) {
        case 'csv':
          content = create_csv(data);
          filename = `חובות_${timestamp}.csv`;
          mime_type = 'text/csv;charset=utf-8';
          // הוספת BOM עבור תמיכה בעברית באקסל
          content = '\ufeff' + content;
          break;
        
        case 'json':
          content = create_json(data);
          filename = `חובות_${timestamp}.json`;
          mime_type = 'application/json;charset=utf-8';
          break;
        
        case 'excel':
          // עבור Excel, נשתמש ב-CSV עם BOM
          content = '\ufeff' + create_csv(data);
          filename = `חובות_${timestamp}.csv`;
          mime_type = 'text/csv;charset=utf-8';
          break;
        
        default:
          throw new Error('פורמט ייצוא לא נתמך');
      }

      download_file(content, filename, mime_type);

      add_message({
        id: `export_${Date.now()}`,
        type: 'success',
        title: get_text('success'),
        message: `הקובץ יוצא בהצלחה (${data.length} רשומות)`,
        timestamp: new Date(),
        auto_dismiss: true
      });

      if (on_export_complete) {
        on_export_complete(true, `הקובץ יוצא בהצלחה (${data.length} רשומות)`);
      }

    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'שגיאה בייצוא הנתונים';
      
      add_message({
        id: `export_error_${Date.now()}`,
        type: 'error',
        title: get_text('error'),
        message: error_message,
        timestamp: new Date(),
        auto_dismiss: true
      });

      if (on_export_complete) {
        on_export_complete(false, error_message);
      }
    } finally {
      set_is_exporting(false);
    }
  };

  // פונקציה לטיפול בשינוי בחירת שדות
  const handle_field_toggle = (field: keyof DebtRecord, checked: boolean) => {
    if (checked) {
      set_selected_fields([...selected_fields, field]);
    } else {
      set_selected_fields(selected_fields.filter(f => f !== field));
    }
  };

  // פונקציה לבחירת כל השדות
  const select_all_fields = () => {
    set_selected_fields(available_fields.map(f => f.key));
  };

  // פונקציה לניקוי כל השדות
  const clear_all_fields = () => {
    set_selected_fields([]);
  };

  const export_data = get_export_data();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">ייצוא נתונים</h3>
        <div className="text-sm text-gray-600">
          {export_data.length} רשומות לייצוא
        </div>
      </div>

      <div className="space-y-6">
        {/* בחירת פורמט */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            פורמט הייצוא
          </label>
          <div className="flex space-x-4 space-x-reverse">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="radio"
                value="csv"
                checked={export_format === 'csv'}
                onChange={(e) => set_export_format(e.target.value as ExportFormat)}
                className="text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">CSV</span>
            </label>
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="radio"
                value="excel"
                checked={export_format === 'excel'}
                onChange={(e) => set_export_format(e.target.value as ExportFormat)}
                className="text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">Excel</span>
            </label>
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="radio"
                value="json"
                checked={export_format === 'json'}
                onChange={(e) => set_export_format(e.target.value as ExportFormat)}
                className="text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">JSON</span>
            </label>
          </div>
        </div>

        {/* בחירת שדות */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              שדות לייצוא
            </label>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={select_all_fields}
                className="text-sm text-israeli-blue hover:text-israeli-blue/80"
              >
                בחר הכל
              </button>
              <button
                onClick={clear_all_fields}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                נקה הכל
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
            {available_fields.map(field => (
              <label key={field.key} className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={selected_fields.includes(field.key)}
                  onChange={(e) => handle_field_toggle(field.key, e.target.checked)}
                  className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
                />
                <span className="text-sm text-gray-700">{field.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* הגדרות נוספות */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            הגדרות נוספות
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={include_headers}
                onChange={(e) => set_include_headers(e.target.checked)}
                className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">כלול כותרות עמודות</span>
            </label>
          </div>
        </div>

        {/* כפתור ייצוא */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handle_export}
            disabled={is_exporting || selected_fields.length === 0 || export_data.length === 0}
            className="px-6 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
          >
            {is_exporting && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {is_exporting ? 'מייצא...' : `${get_text('export')} (${export_data.length} רשומות)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataExport;