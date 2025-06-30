import React from 'react';
import KPICard from './KPICard';
import { DebtRecord, KPIData } from '../types';
import { 
  format_israeli_currency, 
  calculate_collection_rate,
  calculate_debt_age
} from '../utils/formatting';
import { get_text } from '../utils/localization';

interface KPIDashboardProps {
  debt_records: DebtRecord[];
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ debt_records }) => {
  
  // חישוב נתוני KPI
  const calculate_kpi_data = (): KPIData[] => {
    if (!debt_records || debt_records.length === 0) {
      return get_empty_kpi_data();
    }

    // חישובים בסיסיים
    const total_debt = debt_records.reduce((sum, record) => sum + record.debt_amount, 0);
    const total_paid = debt_records.reduce((sum, record) => sum + record.paid_amount, 0);
    const remaining_debt = debt_records.reduce((sum, record) => sum + record.remaining_debt, 0);
    const collection_rate = calculate_collection_rate(total_debt, total_paid);
    
    // ספירת סטטוסים
    const active_debts = debt_records.filter(r => r.status === 'פעיל').length;
    // const closed_debts = debt_records.filter(r => r.status === 'סגור').length;
    // const in_process_debts = debt_records.filter(r => r.status === 'בטיפול').length;
    
    // חובות דחופים (מעל 90 ימים)
    const urgent_debts = debt_records.filter(r => {
      const age = calculate_debt_age(r.due_date);
      return age > 90 && r.status === 'פעיל';
    }).length;

    // חובות שנפרעו השבוע
    const this_week = new Date();
    this_week.setDate(this_week.getDate() - 7);
    const recent_payments = debt_records.filter(r => 
      r.last_payment_date && r.last_payment_date >= this_week
    ).length;

    return [
      {
        title: get_text('total_debt'),
        value: total_debt,
        format: 'currency',
        trend: total_debt > 0 ? 'stable' : 'down',
        change: 0 // יחושב בהתאם לנתונים היסטוריים
      },
      {
        title: get_text('collected_amount'),
        value: total_paid,
        format: 'currency',
        trend: total_paid > remaining_debt * 0.3 ? 'up' : 'down',
        change: 5.2 // דוגמה
      },
      {
        title: get_text('collection_rate'),
        value: collection_rate,
        format: 'percentage',
        trend: collection_rate > 70 ? 'up' : collection_rate > 50 ? 'stable' : 'down',
        change: collection_rate > 70 ? 2.1 : -1.3
      },
      {
        title: get_text('active_debts'),
        value: active_debts,
        format: 'number',
        trend: active_debts < debt_records.length * 0.7 ? 'down' : 'up'
      },
      {
        title: get_text('outstanding_amount'),
        value: remaining_debt,
        format: 'currency',
        trend: remaining_debt < total_debt * 0.5 ? 'down' : 'up'
      },
      {
        title: get_text('total_customers'),
        value: debt_records.length,
        format: 'number',
        trend: 'stable'
      },
      {
        title: 'חובות דחופים (90+ ימים)',
        value: urgent_debts,
        format: 'number',
        trend: urgent_debts === 0 ? 'down' : urgent_debts < debt_records.length * 0.1 ? 'stable' : 'up'
      },
      {
        title: 'תשלומים השבוע',
        value: recent_payments,
        format: 'number',
        trend: recent_payments > 0 ? 'up' : 'stable'
      }
    ];
  };

  // נתוני KPI ריקים כברירת מחדל
  const get_empty_kpi_data = (): KPIData[] => {
    return [
      { title: get_text('total_debt'), value: 0, format: 'currency' },
      { title: get_text('collected_amount'), value: 0, format: 'currency' },
      { title: get_text('collection_rate'), value: 0, format: 'percentage' },
      { title: get_text('active_debts'), value: 0, format: 'number' },
      { title: get_text('outstanding_amount'), value: 0, format: 'currency' },
      { title: get_text('total_customers'), value: 0, format: 'number' },
      { title: 'חובות דחופים', value: 0, format: 'number' },
      { title: 'תשלומים השבוע', value: 0, format: 'number' }
    ];
  };

  // אייקונים עבור KPI
  const get_kpi_icons = () => {
    return [
      // סה"כ חוב
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>,
      
      // סכום נגבה
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,

      // אחוז גביה
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>,

      // חובות פעילים
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,

      // סכום חוב פתוח
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,

      // סה"כ לקוחות
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>,

      // חובות דחופים
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>,

      // תשלומים השבוע
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ];
  };

  // סכמות צבעים עבור KPI
  const get_color_schemes = (): Array<'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'> => {
    return ['blue', 'green', 'yellow', 'red', 'purple', 'gray', 'red', 'green'];
  };

  const kpi_data = calculate_kpi_data();
  const icons = get_kpi_icons();
  const color_schemes = get_color_schemes();

  return (
    <div className="space-y-6">
      
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          מחוונים עסקיים (KPI)
        </h2>
        <div className="text-sm text-gray-600">
          עודכן: {new Date().toLocaleDateString('he-IL')} בשעה {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* גריד KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpi_data.map((kpi, index) => (
          <KPICard
            key={index}
            kpi={kpi}
            icon={icons[index]}
            color_scheme={color_schemes[index]}
          />
        ))}
      </div>

      {/* סיכום מהיר */}
      {debt_records && debt_records.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            סיכום מהיר
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-blue-800">
              <span className="font-medium">ממוצע חוב ללקוח:</span>
              <br />
              <span className="text-lg font-bold">
                {format_israeli_currency(
                  debt_records.reduce((sum, r) => sum + r.remaining_debt, 0) / debt_records.length
                )}
              </span>
            </div>
            
            <div className="text-blue-800">
              <span className="font-medium">חוב הגבוה ביותר:</span>
              <br />
              <span className="text-lg font-bold">
                {format_israeli_currency(
                  Math.max(...debt_records.map(r => r.remaining_debt))
                )}
              </span>
            </div>
            
            <div className="text-blue-800">
              <span className="font-medium">חובות בטיפול:</span>
              <br />
              <span className="text-lg font-bold">
                {debt_records.filter(r => r.status === 'בטיפול').length} מתוך {debt_records.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* הודעה במקרה של אין נתונים */}
      {(!debt_records || debt_records.length === 0) && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            אין נתונים להצגה
          </h3>
          <p className="text-gray-600">
            העלה קובץ נתוני חובות כדי לצפות במחוונים העסקיים
          </p>
        </div>
      )}
    </div>
  );
};

export default KPIDashboard;