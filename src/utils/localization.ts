/**
 * מערכת לוקליזציה בעברית למערכת ניהול חובות
 */

// טקסטים בעברית
export const hebrew_texts = {
  // כותרות ראשיות
  app_title: 'מערכת ניהול חובות',
  welcome: 'ברוכים הבאים למערכת ניהול החובות',
  dashboard: 'לוח בקרה',
  customers: 'לקוחות',
  reports: 'דוחות',
  settings: 'הגדרות',
  
  // KPI ומדדים
  total_debt: 'סה"כ חוב',
  collected_amount: 'סכום נגבה',
  collection_rate: 'אחוז גביה',
  total_customers: 'סה"כ לקוחות',
  active_debts: 'חובות פעילים',
  outstanding_amount: 'סכום חוב פתוח',
  
  // סטטוסים
  status: 'סטטוס',
  active: 'פעיל',
  closed: 'סגור',
  in_process: 'בטיפול',
  suspended: 'מושהה',
  
  // שדות לקוח
  customer_id: 'מזהה לקוח',
  customer_name: 'שם לקוח',
  id_number: 'מספר תעודת זהות',
  phone: 'טלפון',
  debt_amount: 'סכום חוב',
  paid_amount: 'סכום ששולם',
  remaining_debt: 'חוב נותר',
  due_date: 'תאריך פירעון',
  last_payment_date: 'תאריך תשלום אחרון',
  collection_agent: 'נציג גביה',
  notes: 'הערות',
  
  // פעולות
  add: 'הוסף',
  edit: 'ערוך',
  delete: 'מחק',
  save: 'שמור',
  cancel: 'בטל',
  search: 'חפש',
  filter: 'סנן',
  export: 'ייצא',
  import: 'יבא',
  refresh: 'רענן',
  print: 'הדפס',
  
  // חיפוש וסינון
  search_placeholder: 'חפש לפי שם, ת.ז. או מזהה לקוח...',
  filter_by_status: 'סנן לפי סטטוס',
  filter_by_agent: 'סנן לפי נציג גביה',
  filter_by_date: 'סנן לפי תאריך',
  filter_by_amount: 'סנן לפי סכום',
  clear_filters: 'נקה מסננים',
  
  // תאריכים וזמן
  today: 'היום',
  yesterday: 'אתמול',
  this_week: 'השבוע',
  this_month: 'החודש',
  last_month: 'החודש שעבר',
  last_quarter: 'הרבעון שעבר',
  date_range: 'טווח תאריכים',
  from_date: 'מתאריך',
  to_date: 'עד תאריך',
  
  // טבלה ורשימות
  no_data: 'אין נתונים להצגה',
  loading: 'טוען...',
  page: 'עמוד',
  of: 'מתוך',
  rows_per_page: 'שורות לעמוד',
  showing: 'מציג',
  to: 'עד',
  entries: 'רשומות',
  
  // מיון
  sort_by: 'מיין לפי',
  ascending: 'עולה',
  descending: 'יורד',
  
  // העלאת קבצים
  upload_file: 'העלה קובץ',
  drag_drop_file: 'גרור קובץ לכאן או לחץ להעלאה',
  supported_formats: 'פורמטים נתמכים: Excel (.xlsx, .xls), CSV',
  file_uploaded: 'קובץ הועלה בהצלחה',
  processing_file: 'מעבד קובץ...',
  
  // הודעות שגיאה
  error: 'שגיאה',
  warning: 'אזהרה',
  success: 'הצלחה',
  info: 'מידע',
  invalid_id_number: 'מספר תעודת זהות לא תקין',
  invalid_phone_number: 'מספר טלפון לא תקין',
  required_field: 'שדה חובה',
  invalid_amount: 'סכום לא תקין',
  invalid_date: 'תאריך לא תקין',
  
  // הודעות מערכת
  data_saved: 'הנתונים נשמרו בהצלחה',
  data_deleted: 'הנתונים נמחקו בהצלחה',
  operation_failed: 'הפעולה נכשלה',
  no_changes_made: 'לא בוצעו שינויים',
  confirm_delete: 'האם אתה בטוח שברצונך למחוק את הרשומה?',
  
  // דוחות וגרפים
  aging_report: 'דוח התיישנות חובות',
  collection_performance: 'ביצועי גביה',
  top_debtors: 'חייבים גדולים',
  agent_performance: 'ביצועי נציגים',
  monthly_trends: 'מגמות חודשיות',
  
  // קטגוריות גיל חוב
  current_debt: 'חוב שוטף (0-30 ימים)',
  debt_30_60: 'חוב 31-60 ימים',
  debt_60_90: 'חוב 61-90 ימים',
  debt_over_90: 'חוב מעל 90 ימים',
  
  // התראות
  urgent_debt: 'חוב דחוף',
  due_payment: 'תשלום לפירעון',
  collection_target: 'יעד גביה',
  new_alert: 'התראה חדשה',
  alerts: 'התראות',
  no_alerts: 'אין התראות',
  
  // המלצות
  recommendations: 'המלצות',
  call_customer: 'התקשר ללקוח',
  send_email: 'שלח אימייל',
  schedule_meeting: 'קבע פגישה',
  legal_action: 'פעולה משפטית',
  high_priority: 'עדיפות גבוהה',
  medium_priority: 'עדיפות בינונית',
  low_priority: 'עדיפות נמוכה',
  
  // הגדרות
  language: 'שפה',
  theme: 'נושא',
  light_theme: 'נושא בהיר',
  dark_theme: 'נושא כהה',
  notifications: 'הודעות',
  enable_notifications: 'הפעל הודעות',
  default_filters: 'מסננים ברירת מחדל',
  
  // ניווט
  home: 'בית',
  back: 'חזור',
  next: 'הבא',
  previous: 'קודם',
  close: 'סגור',
  menu: 'תפריט',
  
  // הודעות תקשורת
  call_log: 'יומן שיחות',
  email_sent: 'אימייל נשלח',
  sms_sent: 'SMS נשלח',
  meeting_scheduled: 'פגישה נקבעה',
  follow_up_required: 'נדרש מעקב',
  
  // ייצוא ודוחות
  export_excel: 'ייצא לאקסל',
  export_pdf: 'ייצא ל-PDF',
  export_csv: 'ייצא ל-CSV',
  generate_report: 'צור דוח',
  report_generated: 'דוח נוצר בהצלחה',
  
  // פורמטים וכמויות
  items: 'פריטים',
  shekels: 'שקלים',
  percent: 'אחוז',
  days: 'ימים',
  months: 'חודשים',
  years: 'שנים',
  
  // בדיקות ואימותים
  data_validation: 'אימות נתונים',
  validation_passed: 'אימות עבר בהצלחה',
  validation_failed: 'אימות נכשל',
  check_data: 'בדוק נתונים',
  
  // סיכומים
  summary: 'סיכום',
  total: 'סה"כ',
  average: 'ממוצע',
  minimum: 'מינימום',
  maximum: 'מקסימום',
  count: 'כמות'
};

// פונקציה לקבלת טקסט
export const get_text = (key: keyof typeof hebrew_texts): string => {
  return hebrew_texts[key] || key;
};

// פונקציה לקבלת טקסט עם פרמטרים
export const get_text_with_params = (key: keyof typeof hebrew_texts, params: Record<string, string | number>): string => {
  let text = hebrew_texts[key] || key;
  
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, String(params[param]));
  });
  
  return text;
};

// פונקציה לקבלת צורת רבים בעברית
export const get_plural_form = (count: number, singular: string, plural: string): string => {
  if (count === 1) return `${singular} אחד`;
  if (count === 2) return `שני ${plural}`;
  if (count <= 10) return `${count} ${plural}`;
  return `${count} ${plural}`;
};

// פונקציה לבדיקת כיוון טקסט
export const is_rtl_text = (text: string): boolean => {
  const rtl_chars = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F]/;
  return rtl_chars.test(text);
};

// פונקציה לעיצוב הודעות טעות בעברית
export const format_error_message = (field: string, error_type: string): string => {
  const field_name = get_text(field as keyof typeof hebrew_texts);
  
  switch (error_type) {
    case 'required':
      return `${field_name} הוא שדה חובה`;
    case 'invalid':
      return `${field_name} לא תקין`;
    case 'too_short':
      return `${field_name} קצר מדי`;
    case 'too_long':
      return `${field_name} ארוך מדי`;
    default:
      return `שגיאה בשדה ${field_name}`;
  }
};