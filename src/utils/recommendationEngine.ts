/**
 * מנוע המלצות לגביית חובות
 * Recommendation engine for debt collection strategies
 */

import { DebtRecord, Recommendation } from '../types';
import { calculate_debt_age, is_israeli_holiday_or_weekend } from './formatting';

// ממשק עבור פרמטרי המלצה
interface RecommendationParams {
  debt_age_weight: number;
  amount_weight: number;
  payment_history_weight: number;
  contact_history_weight: number;
  success_rate_weight: number;
}

// פרמטרים ברירת מחדל
const DEFAULT_PARAMS: RecommendationParams = {
  debt_age_weight: 0.3,
  amount_weight: 0.25,
  payment_history_weight: 0.2,
  contact_history_weight: 0.15,
  success_rate_weight: 0.1
};

// נתוני הצלחה היסטוריים לפי סוג פעולה (מדומה)
const ACTION_SUCCESS_RATES = {
  call: {
    'פעיל': 0.65,
    'בטיפול': 0.45,
    'מושהה': 0.25,
    'סגור': 0.1
  },
  email: {
    'פעיל': 0.35,
    'בטיפול': 0.25,
    'מושהה': 0.15,
    'סגור': 0.05
  },
  meeting: {
    'פעיל': 0.75,
    'בטיפול': 0.60,
    'מושהה': 0.30,
    'סגור': 0.05
  },
  legal: {
    'פעיל': 0.80,
    'בטיפול': 0.70,
    'מושהה': 0.85,
    'סגור': 0.20
  }
} as const;

// ממשק עבור הערכת לקוח
interface CustomerAssessment {
  debt_age_score: number;
  amount_score: number;
  payment_history_score: number;
  contact_responsiveness_score: number;
  overall_risk_score: number;
}

/**
 * הערכת לקוח לפי פרמטרים שונים
 */
export const assess_customer = (debt: DebtRecord): CustomerAssessment => {
  const debt_age = calculate_debt_age(debt.due_date);
  
  // ציון גיל חוב (0-1, גבוה יותר = דחוף יותר)
  const debt_age_score = Math.min(1, debt_age / 180); // מקסימום ב-180 יום
  
  // ציון סכום (0-1, גבוה יותר = סכום גדול יותר)
  const amount_score = Math.min(1, debt.remaining_debt / 500000); // מקסימום ב-500,000 ₪
  
  // ציון היסטוריית תשלומים (0-1, גבוה יותר = שילם יותר)
  const payment_ratio = debt.debt_amount > 0 ? debt.paid_amount / debt.debt_amount : 0;
  const payment_history_score = payment_ratio;
  
  // ציון היענות לקשר (מבוסס על תאריך התשלום האחרון)
  let contact_responsiveness_score = 0.5; // ברירת מחדל
  if (debt.last_payment_date) {
    const days_since_payment = calculate_debt_age(debt.last_payment_date);
    contact_responsiveness_score = Math.max(0, 1 - (days_since_payment / 60)); // ירידה במשך 60 יום
  }
  
  // ציון סיכון כללי
  const overall_risk_score = (
    debt_age_score * 0.4 +
    amount_score * 0.3 +
    (1 - payment_history_score) * 0.2 +
    (1 - contact_responsiveness_score) * 0.1
  );
  
  return {
    debt_age_score,
    amount_score,
    payment_history_score,
    contact_responsiveness_score,
    overall_risk_score
  };
};

/**
 * חישוב ציון עדיפות לפעולה מסוימת
 */
export const calculate_action_priority = (
  debt: DebtRecord,
  action: Recommendation['action'],
  assessment: CustomerAssessment,
  params: RecommendationParams = DEFAULT_PARAMS
): number => {
  let base_score = 0;
  
  const debt_age = calculate_debt_age(debt.due_date);
  
  switch (action) {
    case 'call':
      // שיחה מתאימה לחובות בינוניים וחדשים יחסית
      if (debt_age <= 30) base_score = 0.8;
      else if (debt_age <= 60) base_score = 0.9;
      else if (debt_age <= 90) base_score = 0.7;
      else base_score = 0.5;
      
      // הגברה עבור לקוחות שמגיבים טוב
      if (assessment.contact_responsiveness_score > 0.7) base_score *= 1.2;
      break;
    
    case 'email':
      // אימייל מתאים לחובות קטנים או כתזכורת
      if (debt.remaining_debt < 10000) base_score = 0.7;
      else if (debt.remaining_debt < 50000) base_score = 0.5;
      else base_score = 0.3;
      
      // מתאים פחות ללקוחות שלא מגיבים
      if (assessment.contact_responsiveness_score < 0.3) base_score *= 0.5;
      break;
    
    case 'meeting':
      // פגישה מתאימה לחובות גדולים עם פוטנציאל תשלום
      if (debt.remaining_debt > 50000 && assessment.payment_history_score > 0.3) {
        base_score = 0.85;
      } else if (debt.remaining_debt > 20000) {
        base_score = 0.6;
      } else {
        base_score = 0.3;
      }
      
      // לא מתאים לחובות ישנים מדי
      if (debt_age > 120) base_score *= 0.7;
      break;
    
    case 'legal':
      // פעולה משפטית מתאימה לחובות ישנים או גדולים
      if (debt_age > 90 || debt.remaining_debt > 100000) {
        base_score = 0.8;
      } else if (debt_age > 60) {
        base_score = 0.6;
      } else {
        base_score = 0.2;
      }
      
      // הגברה עבור לקוחות שלא מגיבים
      if (assessment.contact_responsiveness_score < 0.3) base_score *= 1.3;
      break;
  }
  
  // התאמה לפי סטטוס
  const status_multiplier = {
    'פעיל': 1.0,
    'בטיפול': 0.8,
    'מושהה': 1.2,
    'סגור': 0.1
  }[debt.status] || 1.0;
  
  // שילוב עם ציוני ההערכה
  const weighted_score = base_score * (
    assessment.debt_age_score * params.debt_age_weight +
    assessment.amount_score * params.amount_weight +
    (1 - assessment.payment_history_score) * params.payment_history_weight +
    (1 - assessment.contact_responsiveness_score) * params.contact_history_weight +
    assessment.overall_risk_score * params.success_rate_weight
  );
  
  return Math.min(10, weighted_score * status_multiplier * 10);
};

/**
 * יצירת הסבר להמלצה
 */
export const generate_recommendation_reason = (
  debt: DebtRecord,
  action: Recommendation['action'],
  assessment: CustomerAssessment
): string => {
  const debt_age = calculate_debt_age(debt.due_date);
  const amount = debt.remaining_debt;
  
  const reasons: string[] = [];
  
  // סיבות בסיסיות לפי סוג הפעולה
  switch (action) {
    case 'call':
      if (debt_age <= 30) reasons.push('חוב חדש - מתאים לקשר טלפוני');
      if (assessment.contact_responsiveness_score > 0.7) reasons.push('לקוח מגיב טוב לפניות');
      if (amount >= 10000 && amount <= 50000) reasons.push('סכום מתאים לטיפול טלפוני');
      break;
    
    case 'email':
      if (amount < 10000) reasons.push('סכום קטן - מתאים לתזכורת באימייל');
      if (debt_age <= 45) reasons.push('חוב עדיין חדש - אימייל יכול להזכיר');
      break;
    
    case 'meeting':
      if (amount > 50000) reasons.push('סכום גדול - מצדיק פגישה אישית');
      if (assessment.payment_history_score > 0.3) reasons.push('היסטוריית תשלומים חיובית');
      if (debt_age <= 90) reasons.push('עדיין בטווח זמן לפתרון ידידותי');
      break;
    
    case 'legal':
      if (debt_age > 90) reasons.push('חוב ישן - דורש טיפול משפטי');
      if (amount > 100000) reasons.push('סכום משמעותי - מצדיק הליך משפטי');
      if (assessment.contact_responsiveness_score < 0.3) reasons.push('לקוח לא מגיב - זקוק ללחץ משפטי');
      break;
  }
  
  // סיבות נוספות לפי הערכה
  if (assessment.overall_risk_score > 0.7) {
    reasons.push('לקוח בסיכון גבוה לאי תשלום');
  }
  
  if (assessment.debt_age_score > 0.5) {
    reasons.push('החוב מתיישן - דורש טיפול דחוף');
  }
  
  return reasons.join(' • ') || 'המלצה מבוססת אלגוריתם';
};

/**
 * חישוב סיכוי הצלחה מוערך
 */
export const calculate_estimated_success = (
  debt: DebtRecord,
  action: Recommendation['action'],
  assessment: CustomerAssessment
): number => {
  // ציון בסיסי לפי נתונים היסטוריים
  const base_success_rate = ACTION_SUCCESS_RATES[action][debt.status] || 0.3;
  
  // התאמות לפי הערכת הלקוח
  let adjusted_rate = base_success_rate;
  
  // התאמה לפי היענות לקשר
  if (assessment.contact_responsiveness_score > 0.7) {
    adjusted_rate *= 1.3;
  } else if (assessment.contact_responsiveness_score < 0.3) {
    adjusted_rate *= 0.7;
  }
  
  // התאמה לפי היסטוריית תשלומים
  if (assessment.payment_history_score > 0.5) {
    adjusted_rate *= 1.2;
  } else if (assessment.payment_history_score < 0.2) {
    adjusted_rate *= 0.8;
  }
  
  // התאמה לפי גיל החוב
  const debt_age = calculate_debt_age(debt.due_date);
  if (debt_age > 120) {
    adjusted_rate *= 0.8;
  } else if (debt_age < 30) {
    adjusted_rate *= 1.1;
  }
  
  return Math.min(100, Math.max(5, adjusted_rate * 100));
};

/**
 * יצירת המלצות עבור לקוח יחיד
 */
export const generate_customer_recommendations = (
  debt: DebtRecord,
  params: RecommendationParams = DEFAULT_PARAMS
): Recommendation[] => {
  const assessment = assess_customer(debt);
  const recommendations: Recommendation[] = [];
  
  const actions: Recommendation['action'][] = ['call', 'email', 'meeting', 'legal'];
  
  actions.forEach(action => {
    const priority = calculate_action_priority(debt, action, assessment, params);
    const estimated_success = calculate_estimated_success(debt, action, assessment);
    const reason = generate_recommendation_reason(debt, action, assessment);
    
    // כולל רק המלצות עם עדיפות מינימלית
    if (priority >= 3) {
      recommendations.push({
        customer_id: debt.customer_id,
        action,
        priority,
        reason,
        estimated_success
      });
    }
  });
  
  // מיון לפי עדיפות
  return recommendations.sort((a, b) => b.priority - a.priority);
};

/**
 * יצירת המלצות עבור רשימת לקוחות
 */
export const generate_bulk_recommendations = (
  debts: DebtRecord[],
  max_recommendations: number = 50,
  params: RecommendationParams = DEFAULT_PARAMS
): Recommendation[] => {
  const all_recommendations: Recommendation[] = [];
  
  debts.forEach(debt => {
    // רק חובות פעילים
    if (debt.status === 'פעיל' || debt.status === 'בטיפול') {
      const customer_recommendations = generate_customer_recommendations(debt, params);
      all_recommendations.push(...customer_recommendations);
    }
  });
  
  // מיון לפי עדיפות ועדיפות לפי מספר ההמלצות ללקוח
  const sorted_recommendations = all_recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, max_recommendations);
  
  return sorted_recommendations;
};

/**
 * סיכום המלצות לפי נציג גביה
 */
export const summarize_recommendations_by_agent = (
  debts: DebtRecord[],
  recommendations: Recommendation[]
): Record<string, { agent: string; recommendations: Recommendation[]; total_debt: number }> => {
  const agent_summary: Record<string, { agent: string; recommendations: Recommendation[]; total_debt: number }> = {};
  
  recommendations.forEach(rec => {
    const debt = debts.find(d => d.customer_id === rec.customer_id);
    if (!debt) return;
    
    const agent = debt.collection_agent;
    if (!agent_summary[agent]) {
      agent_summary[agent] = {
        agent,
        recommendations: [],
        total_debt: 0
      };
    }
    
    agent_summary[agent].recommendations.push(rec);
    agent_summary[agent].total_debt += debt.remaining_debt;
  });
  
  return agent_summary;
};

/**
 * המלצות מותאמות זמן (לא בחגים/שבתות)
 */
export const get_time_appropriate_recommendations = (
  recommendations: Recommendation[]
): Recommendation[] => {
  const now = new Date();
  const is_weekend_or_holiday = is_israeli_holiday_or_weekend(now);
  
  if (is_weekend_or_holiday) {
    // בסופ"ש וחגים - רק פעולות שלא דורשות קשר ישיר
    return recommendations.filter(rec => rec.action === 'email' || rec.action === 'legal');
  }
  
  return recommendations;
};