import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { get_text } from '../utils/localization';
import { FileUploadResult, ImportedData } from '../types';

interface FileUploadProps {
  on_file_uploaded: (data: ImportedData) => void;
  on_upload_result: (result: FileUploadResult) => void;
  accepted_formats?: string[];
  max_file_size?: number; // in MB
}

const FileUpload: React.FC<FileUploadProps> = ({
  on_file_uploaded,
  on_upload_result,
  accepted_formats = ['.xlsx', '.xls', '.csv'],
  max_file_size = 10
}) => {
  const [is_dragging, set_is_dragging] = useState(false);
  const [is_processing, set_is_processing] = useState(false);
  const [upload_progress, set_upload_progress] = useState(0);
  const file_input_ref = useRef<HTMLInputElement>(null);

  const handle_drag_over = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(true);
  };

  const handle_drag_leave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(false);
  };

  const handle_drop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    set_is_dragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handle_file_upload(files[0]);
    }
  };

  const handle_file_select = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handle_file_upload(files[0]);
    }
  };

  const validate_file = (file: File): string[] => {
    const errors: string[] = [];
    
    // בדיקת גודל קובץ
    const file_size_mb = file.size / (1024 * 1024);
    if (file_size_mb > max_file_size) {
      errors.push(`קובץ גדול מדי. גודל מקסימלי מותר: ${max_file_size}MB`);
    }

    // בדיקת פורמט קובץ
    const file_extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!accepted_formats.includes(file_extension)) {
      errors.push(`פורמט קובץ לא נתמך. פורמטים מותרים: ${accepted_formats.join(', ')}`);
    }

    return errors;
  };

  const handle_file_upload = async (file: File) => {
    set_is_processing(true);
    set_upload_progress(0);

    try {
      // אימות קובץ
      const validation_errors = validate_file(file);
      if (validation_errors.length > 0) {
        on_upload_result({
          success: false,
          records_count: 0,
          errors: validation_errors,
          warnings: []
        });
        return;
      }

      set_upload_progress(25);

      // קריאת הקובץ
      const file_data = await read_file(file);
      set_upload_progress(75);

      // עיבוד הנתונים
      const imported_data: ImportedData = {
        headers: file_data.headers,
        rows: file_data.rows,
        file_name: file.name,
        file_size: file.size
      };

      set_upload_progress(100);
      
      on_file_uploaded(imported_data);
      on_upload_result({
        success: true,
        records_count: file_data.rows.length,
        errors: [],
        warnings: []
      });

    } catch (error) {
      on_upload_result({
        success: false,
        records_count: 0,
        errors: [`שגיאה בקריאת הקובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`],
        warnings: []
      });
    } finally {
      set_is_processing(false);
      set_upload_progress(0);
      if (file_input_ref.current) {
        file_input_ref.current.value = '';
      }
    }
  };

  const read_file = (file: File): Promise<{ headers: string[], rows: any[][] }> => {
    return new Promise((resolve, reject) => {
      if (file.name.toLowerCase().endsWith('.csv')) {
        // עיבוד קובץ CSV עם Papa Parse
        Papa.parse(file, {
          header: false,
          complete: (results) => {
            try {
              if (results.errors.length > 0) {
                reject(new Error(`שגיאות בקובץ CSV: ${results.errors.map(e => e.message).join(', ')}`));
                return;
              }
              
              const data = results.data as string[][];
              if (data.length === 0) {
                reject(new Error('הקובץ ריק'));
                return;
              }
              
              const headers = data[0].map(h => h.trim());
              const rows = data.slice(1).filter(row => row.some(cell => cell && cell.trim()));
              
              resolve({ headers, rows });
            } catch (error) {
              reject(error);
            }
          },
          error: (error: any) => {
            reject(new Error(`שגיאה בקריאת קובץ CSV: ${error.message}`));
          }
        });
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        // עיבוד קובץ Excel עם Papa Parse
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            
            Papa.parse(content, {
              header: false,
              complete: (results) => {
                try {
                  if (results.errors.length > 0) {
                    reject(new Error(`שגיאות בקובץ Excel: ${results.errors.map(e => e.message).join(', ')}`));
                    return;
                  }
                  
                  const data = results.data as string[][];
                  if (data.length === 0) {
                    reject(new Error('הקובץ ריק'));
                    return;
                  }
                  
                  const headers = data[0].map(h => h.trim());
                  const rows = data.slice(1).filter(row => row.some(cell => cell && cell.trim()));
                  
                  resolve({ headers, rows });
                } catch (error) {
                  reject(error);
                }
              },
              error: (error: any) => {
                reject(new Error(`שגיאה בקריאת קובץ Excel: ${error.message}`));
              }
            });
          } catch (error) {
            reject(error);
          }
        };
        
        reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
        reader.readAsText(file, 'utf-8');
      } else {
        reject(new Error('פורמט קובץ לא נתמך'));
      }
    });
  };

  const open_file_dialog = () => {
    file_input_ref.current?.click();
  };

  return (
    <div className="w-full">
      {/* אזור העלאה */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${is_dragging 
            ? 'border-israeli-blue bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${is_processing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={handle_drag_over}
        onDragLeave={handle_drag_leave}
        onDrop={handle_drop}
        onClick={open_file_dialog}
      >
        {is_processing ? (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="w-12 h-12 mx-auto mb-4 bg-israeli-blue rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600">{get_text('processing_file')}</p>
            {upload_progress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-israeli-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${upload_progress}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {get_text('drag_drop_file')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {get_text('supported_formats')}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                גודל מקסימלי: {max_file_size}MB
              </p>
            </div>
          </div>
        )}

        {/* Input מוסתר */}
        <input
          ref={file_input_ref}
          type="file"
          className="hidden"
          accept={accepted_formats.join(',')}
          onChange={handle_file_select}
        />
      </div>

      {/* מידע נוסף */}
      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-medium mb-2">דרישות קובץ:</h4>
        <ul className="space-y-1 text-xs">
          <li>• הקובץ חייב לכלול כותרות בשורה הראשונה</li>
          <li>• עמודות נדרשות: שם לקוח, מזהה לקוח, סכום חוב</li>
          <li>• מספרי תעודת זהות חייבים להיות תקינים (9 ספרות)</li>
          <li>• תאריכים בפורמט DD/MM/YYYY</li>
          <li>• סכומים במספרים בלבד (ללא סמלי מטבע)</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;