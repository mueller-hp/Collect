/**
 * לוח שנה עברי ישראלי
 * Israeli Hebrew calendar with holidays and business days calculations
 */

// ממשק עבור חג ישראלי
export interface IsraeliHoliday {
  name: string;
  hebrew_name: string;
  date: Date;
  type: 'religious' | 'national' | 'memorial';
  is_work_day: boolean;
  description?: string;
}

// ממשק עבור יום עסקים
export interface BusinessDay {
  date: Date;
  is_business_day: boolean;
  holiday?: IsraeliHoliday;
  day_type: 'weekday' | 'friday_short' | 'weekend' | 'holiday' | 'holiday_eve';
}

/**
 * חגים ישראליים קבועים (לוח גרגוריאני)
 * Fixed Israeli holidays by Gregorian calendar
 */
const FIXED_HOLIDAYS_2024: Omit<IsraeliHoliday, 'date'>[] = [
  {
    name: 'New Year',
    hebrew_name: 'ראש השנה הגרגוריאנית',
    type: 'national',
    is_work_day: false,
    description: 'חג אזרחי'
  },
  {
    name: 'Independence Day',
    hebrew_name: 'יום העצמאות',
    type: 'national',
    is_work_day: false,
    description: 'יום העצמאות של מדינת ישראל'
  },
  {
    name: 'Holocaust Remembrance Day',
    hebrew_name: 'יום השואה והגבורה',
    type: 'memorial',
    is_work_day: true, // יום זיכרון אבל עדיין יום עבודה חלקי
    description: 'יום זיכרון לשואה ולגבורה'
  },
  {
    name: 'Memorial Day',
    hebrew_name: 'יום הזיכרון לחללי מערכות ישראל',
    type: 'memorial',
    is_work_day: false,
    description: 'יום הזיכרון לחללי מערכות ישראל ונפגעי פעולות האיבה'
  }
];

/**
 * חגים עבריים נעים (נחושבים לפי לוח העברי)
 * Moving Hebrew holidays - approximated dates for 2024-2025
 */
const HEBREW_HOLIDAYS_2024_2025: { [key: string]: Date[] } = {
  'ראש השנה': [
    new Date(2024, 8, 16), // 16-17 ספטמבר 2024
    new Date(2024, 8, 17),
    new Date(2025, 8, 5),  // 5-6 ספטמבר 2025
    new Date(2025, 8, 6)
  ],
  'יום כיפור': [
    new Date(2024, 8, 25), // 25 ספטמבר 2024
    new Date(2025, 8, 14)  // 14 ספטמבר 2025
  ],
  'סוכות': [
    new Date(2024, 8, 30), // 30 ספטמבר 2024
    new Date(2024, 9, 1),  // 1 אוקטובר 2024
    new Date(2025, 8, 19), // 19 ספטמבר 2025
    new Date(2025, 8, 21)  // 21 ספטמבר 2025
  ],
  'שמחת תורה': [
    new Date(2024, 9, 7),  // 7 אוקטובר 2024
    new Date(2025, 8, 26)  // 26 ספטמבר 2025
  ],
  'חנוכה': [
    new Date(2024, 11, 26), // 26 דצמבר 2024 (תחילת חנוכה)
    new Date(2025, 11, 15)  // 15 דצמבר 2025 (תחילת חנוכה)
  ],
  'ט״ו בשבט': [
    new Date(2024, 1, 25), // 25 פברואר 2024
    new Date(2025, 1, 13)  // 13 פברואר 2025
  ],
  'פורים': [
    new Date(2024, 2, 24), // 24 מרץ 2024
    new Date(2025, 2, 14)  // 14 מרץ 2025
  ],
  'פסח': [
    new Date(2024, 3, 23), // 23 אפריל 2024
    new Date(2024, 3, 24), // 24 אפריל 2024
    new Date(2024, 3, 29), // 29 אפריל 2024
    new Date(2024, 3, 30), // 30 אפריל 2024
    new Date(2025, 3, 13), // 13 אפריל 2025
    new Date(2025, 3, 14), // 14 אפריל 2025
    new Date(2025, 3, 19), // 19 אפריל 2025
    new Date(2025, 3, 20)  // 20 אפריל 2025
  ],
  'יום השואה': [
    new Date(2024, 3, 8),  // 8 אפריל 2024
    new Date(2025, 3, 28)  // 28 אפריל 2025
  ],
  'יום הזיכרון': [
    new Date(2024, 4, 13), // 13 מאי 2024
    new Date(2025, 4, 5)   // 5 מאי 2025
  ],
  'יום העצמאות': [
    new Date(2024, 4, 14), // 14 מאי 2024
    new Date(2025, 4, 6)   // 6 מאי 2025
  ],
  'ל״ג בעומר': [
    new Date(2024, 4, 26), // 26 מאי 2024
    new Date(2025, 4, 16)  // 16 מאי 2025
  ],
  'יום ירושלים': [
    new Date(2024, 5, 5),  // 5 יוני 2024
    new Date(2025, 4, 26)  // 26 מאי 2025
  ],
  'שבועות': [
    new Date(2024, 5, 12), // 12 יוני 2024
    new Date(2025, 5, 2)   // 2 יוני 2025
  ]
};

/**
 * בדיקה אם תאריך הוא חג ישראלי
 */
export const is_israeli_holiday = (date: Date): IsraeliHoliday | null => {
  const date_string = format_date_key(date);
  
  // בדיקת חגים עבריים
  for (const [holiday_name, dates] of Object.entries(HEBREW_HOLIDAYS_2024_2025)) {
    for (const holiday_date of dates) {
      if (format_date_key(holiday_date) === date_string) {
        return {
          name: holiday_name,
          hebrew_name: holiday_name,
          date: holiday_date,
          type: get_holiday_type(holiday_name),
          is_work_day: is_work_day_holiday(holiday_name),
          description: get_holiday_description(holiday_name)
        };
      }
    }
  }
  
  return null;
};

/**
 * בדיקה אם תאריך הוא יום עסקים
 */
export const is_business_day = (date: Date): boolean => {
  const day_of_week = date.getDay();
  
  // שבת (יום 6)
  if (day_of_week === 6) return false;
  
  // יום שישי אחרי 14:00
  if (day_of_week === 5) {
    const hours = date.getHours();
    if (hours >= 14) return false;
  }
  
  // בדיקת חגים
  const holiday = is_israeli_holiday(date);
  if (holiday && !holiday.is_work_day) return false;
  
  return true;
};

/**
 * חישוב היום העסקי הבא
 */
export const get_next_business_day = (start_date: Date): Date => {
  const next_day = new Date(start_date);
  next_day.setDate(next_day.getDate() + 1);
  
  let attempts = 0;
  while (!is_business_day(next_day) && attempts < 14) { // מקסימום שבועיים
    next_day.setDate(next_day.getDate() + 1);
    attempts++;
  }
  
  return next_day;
};

/**
 * חישוב היום העסקי הקודם
 */
export const get_previous_business_day = (start_date: Date): Date => {
  const prev_day = new Date(start_date);
  prev_day.setDate(prev_day.getDate() - 1);
  
  let attempts = 0;
  while (!is_business_day(prev_day) && attempts < 14) { // מקסימום שבועיים
    prev_day.setDate(prev_day.getDate() - 1);
    attempts++;
  }
  
  return prev_day;
};

/**
 * חישוב מספר ימי עסקים בין תאריכים
 */
export const count_business_days = (start_date: Date, end_date: Date): number => {
  if (start_date > end_date) return 0;
  
  let count = 0;
  const current_date = new Date(start_date);
  
  while (current_date <= end_date) {
    if (is_business_day(current_date)) {
      count++;
    }
    current_date.setDate(current_date.getDate() + 1);
  }
  
  return count;
};

/**
 * קבלת רשימת חגים בטווח תאריכים
 */
export const get_holidays_in_range = (start_date: Date, end_date: Date): IsraeliHoliday[] => {
  const holidays: IsraeliHoliday[] = [];
  const current_date = new Date(start_date);
  
  while (current_date <= end_date) {
    const holiday = is_israeli_holiday(current_date);
    if (holiday) {
      holidays.push(holiday);
    }
    current_date.setDate(current_date.getDate() + 1);
  }
  
  return holidays;
};

/**
 * בדיקה אם תאריך הוא ערב חג
 */
export const is_holiday_eve = (date: Date): boolean => {
  const next_day = new Date(date);
  next_day.setDate(next_day.getDate() + 1);
  
  const holiday = is_israeli_holiday(next_day);
  return holiday !== null && !holiday.is_work_day;
};

/**
 * קבלת מידע מפורט על יום
 */
export const get_day_info = (date: Date): BusinessDay => {
  const day_of_week = date.getDay();
  const holiday = is_israeli_holiday(date);
  const is_eve = is_holiday_eve(date);
  
  let day_type: BusinessDay['day_type'];
  
  if (holiday && !holiday.is_work_day) {
    day_type = 'holiday';
  } else if (is_eve) {
    day_type = 'holiday_eve';
  } else if (day_of_week === 6) { // שבת
    day_type = 'weekend';
  } else if (day_of_week === 5) { // יום שישי
    day_type = 'friday_short';
  } else {
    day_type = 'weekday';
  }
  
  return {
    date: new Date(date),
    is_business_day: is_business_day(date),
    holiday: holiday || undefined,
    day_type
  };
};

/**
 * קבלת המלצות לזמני קשר עם לקוחות
 */
export const get_contact_time_recommendations = (date: Date): {
  recommended: boolean;
  reason: string;
  alternative_date?: Date;
} => {
  const day_info = get_day_info(date);
  
  if (!day_info.is_business_day) {
    return {
      recommended: false,
      reason: day_info.holiday ? 
        `היום הוא חג: ${day_info.holiday.hebrew_name}` : 
        'היום הוא לא יום עסקים',
      alternative_date: get_next_business_day(date)
    };
  }
  
  if (day_info.day_type === 'friday_short') {
    const hours = date.getHours();
    if (hours >= 12) {
      return {
        recommended: false,
        reason: 'יום שישי אחר הצהריים - מומלץ להמתין ליום ראשון',
        alternative_date: get_next_business_day(date)
      };
    }
  }
  
  if (day_info.day_type === 'holiday_eve') {
    return {
      recommended: false,
      reason: 'ערב חג - מומלץ להמתין לאחר החג',
      alternative_date: get_next_business_day(date)
    };
  }
  
  return {
    recommended: true,
    reason: 'זמן מתאים ליצירת קשר'
  };
};

/**
 * חישוב תאריך תשלום מומלץ (ביום עסקים)
 */
export const calculate_recommended_payment_date = (
  original_due_date: Date,
  grace_period_days: number = 0
): Date => {
  const target_date = new Date(original_due_date);
  target_date.setDate(target_date.getDate() + grace_period_days);
  
  // אם התאריך הוא יום עסקים, החזר אותו
  if (is_business_day(target_date)) {
    return target_date;
  }
  
  // אחרת, מצא את היום העסקי הבא
  return get_next_business_day(target_date);
};

// פונקציות עזר פנימיות

const format_date_key = (date: Date): string => {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const get_holiday_type = (holiday_name: string): IsraeliHoliday['type'] => {
  const memorial_days = ['יום השואה', 'יום הזיכרון'];
  const national_days = ['יום העצמאות', 'יום ירושלים'];
  
  if (memorial_days.includes(holiday_name)) return 'memorial';
  if (national_days.includes(holiday_name)) return 'national';
  return 'religious';
};

const is_work_day_holiday = (holiday_name: string): boolean => {
  const work_holidays = ['יום השואה', 'ל״ג בעומר', 'ט״ו בשבט'];
  return work_holidays.includes(holiday_name);
};

const get_holiday_description = (holiday_name: string): string => {
  const descriptions: { [key: string]: string } = {
    'ראש השנה': 'ראש השנה העברית - תחילת השנה החדשה',
    'יום כיפור': 'יום הכיפורים - יום צום וסליחה',
    'סוכות': 'חג הסוכות - זמן שמחתנו',
    'שמחת תורה': 'שמחת תורה - חגיגת סיום קריאת התורה',
    'חנוכה': 'חנוכה - חג האורים',
    'ט״ו בשבט': 'ט״ו בשבט - ראש השנה לאילנות',
    'פורים': 'פורים - חג התחפושות והמשלוח מנות',
    'פסח': 'פסח - חג החירות',
    'יום השואה': 'יום השואה והגבורה - יום זיכרון לשואה',
    'יום הזיכרון': 'יום הזיכרון לחללי מערכות ישראל',
    'יום העצמאות': 'יום העצמאות - יום הולדת מדינת ישראל',
    'ל״ג בעומר': 'ל״ג בעומר - יום שמחה בספירת העומר',
    'יום ירושלים': 'יום ירושלים - יום איחוד ירושלים',
    'שבועות': 'שבועות - חג מתן תורה וביכורים'
  };
  
  return descriptions[holiday_name] || 'חג יהודי';
};

/**
 * קבלת חגים קרובים (30 יום קדימה)
 */
export const get_upcoming_holidays = (days_ahead: number = 30): IsraeliHoliday[] => {
  const today = new Date();
  const end_date = new Date(today);
  end_date.setDate(end_date.getDate() + days_ahead);
  
  return get_holidays_in_range(today, end_date);
};

/**
 * בדיקה אם התאריך הוא יום עבודה מקוצר (ערב חג או יום שישי)
 */
export const is_short_work_day = (date: Date): boolean => {
  const day_of_week = date.getDay();
  return day_of_week === 5 || is_holiday_eve(date);
};