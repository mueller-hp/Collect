// ממשקים עבור רשומות חוב
export interface DebtRecord {
  customer_id: string; // מזהה לקוח
  customer_name: string; // שם לקוח
  id_number: string; // מספר תעודת זהות
  debt_amount: number; // סכום חוב
  paid_amount: number; // סכום ששולם
  remaining_debt: number; // חוב נותר
  due_date: Date; // תאריך פירעון
  status: DebtStatus; // סטטוס החוב
  collection_agent: string; // נציג גביה
  last_payment_date?: Date; // תאריך תשלום אחרון
  phone?: string; // טלפון
  notes?: string; // הערות
  created_at: Date; // תאריך יצירה
  updated_at: Date; // תאריך עדכון
}

// סטטוסי חוב
export type DebtStatus = 'פעיל' | 'סגור' | 'בטיפול' | 'מושהה';

// קטגוריות גיל חוב
export interface DebtAging {
  current: number; // 0-30 ימים
  thirty_to_sixty: number; // 31-60 ימים
  sixty_to_ninety: number; // 61-90 ימים
  over_ninety: number; // מעל 90 ימים
}

// דוח ביצועים
export interface PerformanceReport {
  total_debt: number; // סה"כ חוב
  collected_amount: number; // סכום נגבה
  collection_rate: number; // אחוז גביה
  total_customers: number; // סה"כ לקוחות
  active_debts: number; // חובות פעילים
  aging_analysis: DebtAging; // ניתוח גיל חובות
}

// ממשק עבור נתוני KPI
export interface KPIData {
  title: string; // כותרת
  value: number | string; // ערך
  change?: number; // שינוי באחוזים
  trend?: 'up' | 'down' | 'stable'; // מגמה
  format?: 'currency' | 'percentage' | 'number'; // פורמט תצוגה
}

// ממשק עבור נתוני גרף
export interface ChartData {
  name: string; // שם
  value: number; // ערך
  color?: string; // צבע
}

// ממשק עבור מסננים
export interface FilterOptions {
  status?: DebtStatus[]; // סטטוסים
  date_range?: {
    start: Date;
    end: Date;
  }; // טווח תאריכים
  amount_range?: {
    min: number;
    max: number;
  }; // טווח סכומים
  collection_agent?: string[]; // נציגי גביה
  search_term?: string; // מילת חיפוש
}

// ממשק עבור הגדרות מיון
export interface SortOptions {
  field: keyof DebtRecord; // שדה למיון
  direction: 'asc' | 'desc'; // כיוון מיון
}

// ממשק עבור הגדרות דף
export interface PaginationOptions {
  page: number; // מספר עמוד
  per_page: number; // רשומות לעמוד
  total: number; // סה"כ רשומות
}

// ממשק עבור תוצאות חיפוש
export interface SearchResults {
  records: DebtRecord[]; // רשומות
  total: number; // סה"כ תוצאות
  pagination: PaginationOptions; // הגדרות דף
}

// ממשק עבור העלאת קובץ
export interface FileUploadResult {
  success: boolean; // הצלחה
  records_count: number; // מספר רשומות
  errors: string[]; // שגיאות
  warnings: string[]; // אזהרות
}

// ממשק עבור נתוני אקסל/CSV
export interface ImportedData {
  headers: string[]; // כותרות
  rows: any[][]; // שורות
  file_name: string; // שם קובץ
  file_size: number; // גודל קובץ
}

// ממשק עבור הגדרות מיפוי עמודות
export interface ColumnMapping {
  [key: string]: keyof DebtRecord; // מיפוי עמודות
}

// ממשק עבור הודעות מערכת
export interface SystemMessage {
  id: string; // מזהה
  type: 'success' | 'error' | 'warning' | 'info'; // סוג הודעה
  title: string; // כותרת
  message: string; // תוכן הודעה
  timestamp: Date; // זמן
  auto_dismiss?: boolean; // סגירה אוטומטית
}

// ממשק עבור הגדרות משתמש
export interface UserSettings {
  language: 'he' | 'en'; // שפה
  theme: 'light' | 'dark'; // נושא
  items_per_page: number; // פריטים לעמוד
  default_filters: FilterOptions; // מסננים ברירת מחדל
  notifications_enabled: boolean; // הודעות מופעלות
}

// ממשק עבור דוח PDF
export interface PDFReportData {
  title: string; // כותרת
  generated_at: Date; // תאריך יצירה
  filters: FilterOptions; // מסננים שהוחלו
  summary: PerformanceReport; // סיכום
  records: DebtRecord[]; // רשומות
}

// ממשק עבור התראות
export interface Alert {
  id: string; // מזהה
  type: 'urgent_debt' | 'due_payment' | 'collection_target'; // סוג התראה
  title: string; // כותרת
  description: string; // תיאור
  related_customer_id?: string; // מזהה לקוח קשור
  priority: 'high' | 'medium' | 'low'; // עדיפות
  created_at: Date; // תאריך יצירה
  is_read: boolean; // נקרא
}

// ממשק עבור המלצות
export interface Recommendation {
  customer_id: string; // מזהה לקוח
  action: 'call' | 'email' | 'meeting' | 'legal'; // פעולה מומלצת
  priority: number; // עדיפות (1-10)
  reason: string; // סיבה
  estimated_success: number; // הצלחה מוערכת באחוזים
}