import Papa from 'papaparse';
import { DebtRecord, ImportedData, FileUploadResult, ColumnMapping } from '../types';
import { validate_israeli_id, format_israeli_phone } from './formatting';

/**
 * מעבד נתוני CSV/Excel ומחזיר רשומות חוב תקינות
 */
export const process_imported_data = (
  imported_data: ImportedData,
  column_mapping: ColumnMapping
): FileUploadResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const valid_records: DebtRecord[] = [];

  // בדיקה שכל העמודות הנחוצות קיימות
  const required_columns = ['customer_name', 'customer_id', 'debt_amount'];
  const missing_columns = required_columns.filter(col => 
    !Object.values(column_mapping).includes(col as keyof DebtRecord)
  );

  if (missing_columns.length > 0) {
    errors.push(`עמודות חסרות: ${missing_columns.join(', ')}`);
    return {
      success: false,
      records_count: 0,
      errors,
      warnings: []
    };
  }

  // עיבוד כל שורה
  imported_data.rows.forEach((row, index) => {
    try {
      const record = process_single_row(row, imported_data.headers, column_mapping);
      if (record) {
        valid_records.push(record);
      }
    } catch (error) {
      const error_message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      warnings.push(`שורה ${index + 2}: ${error_message}`);
    }
  });

  return {
    success: valid_records.length > 0,
    records_count: valid_records.length,
    errors: errors,
    warnings: warnings
  };
};

/**
 * מעבד שורה בודדת ומחזיר רשומת חוב
 */
const process_single_row = (
  row: any[],
  headers: string[],
  column_mapping: ColumnMapping
): DebtRecord | null => {
  const row_data: any = {};
  
  // יצירת אובייקט מהשורה לפי הכותרות
  headers.forEach((header, index) => {
    if (column_mapping[header]) {
      row_data[column_mapping[header]] = row[index];
    }
  });

  // בדיקת שדות חובה
  if (!row_data.customer_name || !row_data.customer_id || !row_data.debt_amount) {
    throw new Error('שדות חובה חסרים: שם לקוח, מזהה לקוח, או סכום חוב');
  }

  // אימות ועיצוב הנתונים
  const debt_amount = parse_number(row_data.debt_amount);
  if (isNaN(debt_amount) || debt_amount <= 0) {
    throw new Error('סכום חוב לא תקין');
  }

  const paid_amount = parse_number(row_data.paid_amount) || 0;
  const remaining_debt = debt_amount - paid_amount;

  // אימות תעודת זהות אם קיימת
  if (row_data.id_number && !validate_israeli_id(row_data.id_number)) {
    throw new Error('מספר תעודת זהות לא תקין');
  }

  // עיצוב טלפון אם קיים
  let formatted_phone = row_data.phone;
  if (formatted_phone) {
    formatted_phone = format_israeli_phone(formatted_phone);
    if (!formatted_phone) {
      throw new Error('מספר טלפון לא תקין');
    }
  }

  // יצירת רשומת החוב
  const current_date = new Date();
  const debt_record: DebtRecord = {
    customer_id: String(row_data.customer_id).trim(),
    customer_name: String(row_data.customer_name).trim(),
    id_number: row_data.id_number ? String(row_data.id_number).trim() : '',
    debt_amount,
    paid_amount,
    remaining_debt,
    due_date: parse_date(row_data.due_date) || new Date(),
    status: validate_status(row_data.status) || 'פעיל',
    collection_agent: row_data.collection_agent ? String(row_data.collection_agent).trim() : '',
    last_payment_date: parse_date(row_data.last_payment_date),
    phone: formatted_phone,
    notes: row_data.notes ? String(row_data.notes).trim() : '',
    created_at: current_date,
    updated_at: current_date
  };

  return debt_record;
};

/**
 * מזהה אוטומטית מיפוי עמודות על בסיס שמות נפוצים
 */
export const auto_detect_column_mapping = (headers: string[]): ColumnMapping => {
  const mapping: ColumnMapping = {};
  
  // מילון מיפוי עמודות נפוצות
  const common_mappings: Record<string, keyof DebtRecord> = {
    // שמות עמודות בעברית
    'שם לקוח': 'customer_name',
    'שם': 'customer_name',
    'לקוח': 'customer_name',
    'מזהה לקוח': 'customer_id',
    'מזהה': 'customer_id',
    'מספר לקוח': 'customer_id',
    'תעודת זהות': 'id_number',
    'ת.ז': 'id_number',
    'תז': 'id_number',
    'מספר זהות': 'id_number',
    'סכום חוב': 'debt_amount',
    'חוב': 'debt_amount',
    'סכום': 'debt_amount',
    'יתרת חוב': 'remaining_debt',
    'יתרה': 'remaining_debt',
    'סכום ששולם': 'paid_amount',
    'תשלום': 'paid_amount',
    'שולם': 'paid_amount',
    'תאריך פירעון': 'due_date',
    'פירעון': 'due_date',
    'תאריך יעד': 'due_date',
    'סטטוס': 'status',
    'מצב': 'status',
    'נציג גביה': 'collection_agent',
    'נציג': 'collection_agent',
    'גביה': 'collection_agent',
    'טלפון': 'phone',
    'נייד': 'phone',
    'הערות': 'notes',
    'הערה': 'notes',
    'תאריך תשלום אחרון': 'last_payment_date',
    
    // שמות עמודות באנגלית
    'customer_name': 'customer_name',
    'name': 'customer_name',
    'customer': 'customer_name',
    'customer_id': 'customer_id',
    'id': 'customer_id',
    'client_id': 'customer_id',
    'id_number': 'id_number',
    'identity': 'id_number',
    'debt_amount': 'debt_amount',
    'amount': 'debt_amount',
    'debt': 'debt_amount',
    'paid_amount': 'paid_amount',
    'paid': 'paid_amount',
    'payment': 'paid_amount',
    'remaining_debt': 'remaining_debt',
    'remaining': 'remaining_debt',
    'balance': 'remaining_debt',
    'due_date': 'due_date',
    'date': 'due_date',
    'status': 'status',
    'state': 'status',
    'collection_agent': 'collection_agent',
    'agent': 'collection_agent',
    'phone': 'phone',
    'mobile': 'phone',
    'notes': 'notes',
    'comments': 'notes',
    'last_payment_date': 'last_payment_date'
  };

  // מיפוי אוטומטי
  headers.forEach(header => {
    const normalized_header = header.trim().toLowerCase();
    const mapped_field = common_mappings[normalized_header] || common_mappings[header.trim()];
    
    if (mapped_field) {
      mapping[header] = mapped_field;
    }
  });

  return mapping;
};

/**
 * מעבד קובץ CSV באמצעות Papa Parse
 */
export const process_csv_file = (file: File): Promise<ImportedData> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`שגיאות בקריאת קובץ CSV: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }

        const data = results.data as string[][];
        if (data.length === 0) {
          reject(new Error('קובץ CSV ריק'));
          return;
        }

        const headers = data[0];
        const rows = data.slice(1);

        resolve({
          headers,
          rows,
          file_name: file.name,
          file_size: file.size
        });
      },
      error: (error) => {
        reject(new Error(`שגיאה בקריאת קובץ CSV: ${error.message}`));
      }
    });
  });
};

/**
 * פונקציות עזר לעיבוד נתונים
 */

// המרת מחרוזת למספר
const parse_number = (value: any): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  // הסרת תווים לא רלוונטיים
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
};

// המרת מחרוזת לתאריך
const parse_date = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  
  const date_string = String(value).trim();
  
  // ניסיון פרסור תאריכים בפורמטים שונים
  const date_patterns = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
  ];

  for (const pattern of date_patterns) {
    const match = date_string.match(pattern);
    if (match) {
      let day, month, year;
      
      if (pattern === date_patterns[1]) { // YYYY-MM-DD
        [, year, month, day] = match;
      } else { // DD/MM/YYYY or DD-MM-YYYY
        [, day, month, year] = match;
      }
      
      const parsed_date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (!isNaN(parsed_date.getTime())) {
        return parsed_date;
      }
    }
  }
  
  // נסיון פרסור כללי
  const general_date = new Date(date_string);
  return isNaN(general_date.getTime()) ? undefined : general_date;
};

// אימות סטטוס חוב
const validate_status = (value: any): 'פעיל' | 'סגור' | 'בטיפול' | 'מושהה' | undefined => {
  if (!value) return undefined;
  
  const status_string = String(value).trim();
  const valid_statuses: Array<'פעיל' | 'סגור' | 'בטיפול' | 'מושהה'> = ['פעיל', 'סגור', 'בטיפול', 'מושהה'];
  
  // חיפוש ישיר
  if (valid_statuses.includes(status_string as any)) {
    return status_string as any;
  }
  
  // מיפוי סטטוסים נפוצים
  const status_mappings: Record<string, 'פעיל' | 'סגור' | 'בטיפול' | 'מושהה'> = {
    'active': 'פעיל',
    'open': 'פעיל',
    'closed': 'סגור',
    'close': 'סגור',
    'processing': 'בטיפול',
    'in_process': 'בטיפול',
    'suspended': 'מושהה',
    'suspend': 'מושהה',
    'hold': 'מושהה'
  };
  
  const mapped_status = status_mappings[status_string.toLowerCase()];
  return mapped_status;
};

/**
 * יצוא נתונים לפורמטים שונים
 */
export const export_to_csv = (records: DebtRecord[], filename: string = 'debt_records.csv'): void => {
  const headers = [
    'מזהה לקוח',
    'שם לקוח', 
    'תעודת זהות',
    'סכום חוב',
    'סכום ששולם',
    'חוב נותר',
    'תאריך פירעון',
    'סטטוס',
    'נציג גביה',
    'טלפון',
    'הערות'
  ];
  
  const csv_data = records.map(record => [
    record.customer_id,
    record.customer_name,
    record.id_number,
    record.debt_amount,
    record.paid_amount,
    record.remaining_debt,
    record.due_date.toLocaleDateString('he-IL'),
    record.status,
    record.collection_agent,
    record.phone || '',
    record.notes || ''
  ]);
  
  const csv_content = Papa.unparse({
    fields: headers,
    data: csv_data
  });
  
  // הורדת הקובץ
  const blob = new Blob([csv_content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * בדיקת תקינות נתונים מיובאים
 */
export const validate_imported_records = (records: DebtRecord[]): { valid: DebtRecord[], invalid: Array<{ record: any, errors: string[] }> } => {
  const valid: DebtRecord[] = [];
  const invalid: Array<{ record: any, errors: string[] }> = [];
  
  records.forEach(record => {
    const errors: string[] = [];
    
    // בדיקות חובה
    if (!record.customer_name?.trim()) errors.push('שם לקוח חסר');
    if (!record.customer_id?.trim()) errors.push('מזהה לקוח חסר');
    if (!record.debt_amount || record.debt_amount <= 0) errors.push('סכום חוב לא תקין');
    
    // בדיקות אופציונליות
    if (record.id_number && !validate_israeli_id(record.id_number)) {
      errors.push('תעודת זהות לא תקינה');
    }
    
    if (errors.length === 0) {
      valid.push(record);
    } else {
      invalid.push({ record, errors });
    }
  });
  
  return { valid, invalid };
};