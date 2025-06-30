/**
 * פונקציות עזר לעיצוב ואימות נתונים ישראליים
 */

// עיצוב מטבע ישראלי
export const format_israeli_currency = (amount: number): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// עיצוב מספר ישראלי
export const format_israeli_number = (num: number): string => {
  return new Intl.NumberFormat('he-IL').format(num);
};

// עיצוב תאריך ישראלי
export const format_israeli_date = (date: Date): string => {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

// עיצוב תאריך ושעה ישראלי
export const format_israeli_datetime = (date: Date): string => {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// אימות מספר תעודת זהות ישראלית
export const validate_israeli_id = (id: string): boolean => {
  if (!id || id.length !== 9) return false;
  
  // בדיקת ספרות בלבד
  if (!/^\d{9}$/.test(id)) return false;
  
  // אלגוריתם בדיקת ת.ז.
  const digits = id.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit = Math.floor(digit / 10) + (digit % 10);
      }
    }
    sum += digit;
  }
  
  return sum % 10 === 0;
};

// עיצוב מספר טלפון ישראלי
export const format_israeli_phone = (phone: string): string => {
  // הסרת כל התווים שאינם ספרות
  const cleaned = phone.replace(/\D/g, '');
  
  // טיפול במספרים עם קידומת בינלאומית
  if (cleaned.startsWith('972')) {
    const number = cleaned.substring(3);
    if (number.length === 9) {
      return `+972-${number.substring(0, 2)}-${number.substring(2, 5)}-${number.substring(5)}`;
    }
  }
  
  // טיפול במספרים מקומיים
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone; // החזרת המספר המקורי אם לא ניתן לעצב
};

// אימות מספר טלפון ישראלי
export const validate_israeli_phone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // מספר עם קידומת בינלאומית
  if (cleaned.startsWith('972')) {
    return cleaned.length === 12;
  }
  
  // מספר מקומי
  if (cleaned.startsWith('0')) {
    return cleaned.length === 10;
  }
  
  return false;
};

// חישוב גיל חוב בימים
export const calculate_debt_age = (due_date: Date): number => {
  const today = new Date();
  const diff = today.getTime() - due_date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// קבלת קטגוריית גיל חוב
export const get_debt_age_category = (age: number): string => {
  if (age <= 30) return 'עד 30 ימים';
  if (age <= 60) return '31-60 ימים';
  if (age <= 90) return '61-90 ימים';
  return 'מעל 90 ימים';
};

// חישוב אחוז גביה
export const calculate_collection_rate = (total_debt: number, collected: number): number => {
  if (total_debt === 0) return 0;
  return (collected / total_debt) * 100;
};

// עיצוב אחוזים
export const format_percentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// קיצור שם לקוח עבור תצוגה במובייל
export const truncate_customer_name = (name: string, max_length: number = 20): string => {
  if (name.length <= max_length) return name;
  return `${name.substring(0, max_length)}...`;
};

// המרת סטטוס לצבע
export const get_status_color = (status: string): string => {
  switch (status) {
    case 'פעיל':
      return 'text-red-600 bg-red-50';
    case 'בטיפול':
      return 'text-yellow-600 bg-yellow-50';
    case 'סגור':
      return 'text-green-600 bg-green-50';
    case 'מושהה':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

// בדיקה אם התאריך הוא חג או שבת
export const is_israeli_holiday_or_weekend = (date: Date): boolean => {
  const day = date.getDay();
  // שבת (יום 6) או יום שישי אחה"צ
  if (day === 6 || (day === 5 && date.getHours() >= 14)) {
    return true;
  }
  
  // כאן ניתן להוסיף בדיקת חגים ישראליים
  // לשם הדוגמה, נחזיר false
  return false;
};

// חישוב יום עסקים הבא
export const get_next_business_day = (date: Date): Date => {
  const next_day = new Date(date);
  next_day.setDate(next_day.getDate() + 1);
  
  while (is_israeli_holiday_or_weekend(next_day)) {
    next_day.setDate(next_day.getDate() + 1);
  }
  
  return next_day;
};

// עיצוב מספר רשומות
export const format_records_count = (count: number): string => {
  if (count === 1) return 'רשומה אחת';
  if (count === 2) return 'שתי רשומות';
  if (count <= 10) return `${count} רשומות`;
  return `${format_israeli_number(count)} רשומות`;
};