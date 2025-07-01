import React, { useState, useEffect, useCallback } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { Alert, DebtRecord } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_currency, format_israeli_date, calculate_debt_age } from '../utils/formatting';

interface AlertSystemProps {
  show_floating_alerts?: boolean;
  max_floating_alerts?: number;
  auto_dismiss_time?: number;
}

// סוגי התראות
interface AlertRule {
  id: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  enabled: boolean;
  check_function: (debt: DebtRecord) => boolean;
  create_alert: (debt: DebtRecord) => Omit<Alert, 'id' | 'created_at' | 'is_read'>;
}

const AlertSystem: React.FC<AlertSystemProps> = ({
  show_floating_alerts = true,
  max_floating_alerts = 5,
  auto_dismiss_time = 5000
}) => {
  const { state } = use_debt_context();
  const { set_alerts } = use_debt_actions();
  
  const [floating_alerts, set_floating_alerts] = useState<Alert[]>([]);
  const [alert_rules, set_alert_rules] = useState<AlertRule[]>([]);
  const [last_check, set_last_check] = useState<Date>(new Date());

  // הגדרת כללי התראות
  const initialize_alert_rules = useCallback((): AlertRule[] => {
    return [
      {
        id: 'urgent_debt',
        name: 'חוב דחוף',
        description: 'חובות מעל 90 יום או מעל 50,000 ₪',
        priority: 'high',
        enabled: true,
        check_function: (debt: DebtRecord) => {
          const age = calculate_debt_age(debt.due_date);
          return debt.status === 'פעיל' && (age > 90 || debt.remaining_debt > 50000);
        },
        create_alert: (debt: DebtRecord) => ({
          type: 'urgent_debt',
          title: 'חוב דחוף לטיפול',
          description: `לקוח ${debt.customer_name} - חוב של ${format_israeli_currency(debt.remaining_debt)}`,
          related_customer_id: debt.customer_id,
          priority: 'high'
        })
      },
      {
        id: 'due_payment',
        name: 'תשלום לפירעון',
        description: 'חובות שתאריך הפירעון שלהם הגיע',
        priority: 'medium',
        enabled: true,
        check_function: (debt: DebtRecord) => {
          const today = new Date();
          const due_date = new Date(debt.due_date);
          const days_diff = Math.ceil((due_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return debt.status === 'פעיל' && days_diff <= 0;
        },
        create_alert: (debt: DebtRecord) => ({
          type: 'due_payment',
          title: 'תאריך פירעון עבר',
          description: `לקוח ${debt.customer_name} - תאריך פירעון: ${format_israeli_date(debt.due_date)}`,
          related_customer_id: debt.customer_id,
          priority: 'medium'
        })
      },
      {
        id: 'upcoming_due',
        name: 'פירעון קרוב',
        description: 'חובות שיגיעו לפירעון בימים הקרובים',
        priority: 'medium',
        enabled: true,
        check_function: (debt: DebtRecord) => {
          const today = new Date();
          const due_date = new Date(debt.due_date);
          const days_diff = Math.ceil((due_date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return debt.status === 'פעיל' && days_diff > 0 && days_diff <= 7;
        },
        create_alert: (debt: DebtRecord) => ({
          type: 'due_payment',
          title: 'פירעון קרוב',
          description: `לקוח ${debt.customer_name} - פירעון בעוד ${Math.ceil((new Date(debt.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} ימים`,
          related_customer_id: debt.customer_id,
          priority: 'medium'
        })
      },
      {
        id: 'large_debt',
        name: 'חוב גדול',
        description: 'חובות מעל סכום מסוים',
        priority: 'medium',
        enabled: true,
        check_function: (debt: DebtRecord) => {
          return debt.status === 'פעיל' && debt.remaining_debt > 100000;
        },
        create_alert: (debt: DebtRecord) => ({
          type: 'urgent_debt',
          title: 'חוב בסכום גדול',
          description: `לקוח ${debt.customer_name} - חוב של ${format_israeli_currency(debt.remaining_debt)}`,
          related_customer_id: debt.customer_id,
          priority: 'medium'
        })
      },
      {
        id: 'no_recent_contact',
        name: 'אין קשר לאחרונה',
        description: 'לקוחות שלא היה איתם קשר במשך זמן רב',
        priority: 'low',
        enabled: true,
        check_function: (debt: DebtRecord) => {
          if (!debt.last_payment_date || debt.status !== 'פעיל') return false;
          const days_since_contact = calculate_debt_age(debt.last_payment_date);
          return days_since_contact > 30;
        },
        create_alert: (debt: DebtRecord) => ({
          type: 'collection_target',
          title: 'חסר קשר עם לקוח',
          description: `לקוח ${debt.customer_name} - אין קשר משך יותר מ-30 יום`,
          related_customer_id: debt.customer_id,
          priority: 'low'
        })
      },
      {
        id: 'collection_target_miss',
        name: 'החמצת יעד גביה',
        description: 'נציגי גביה שלא עמדו ביעדים',
        priority: 'medium',
        enabled: true,
        check_function: (debt: DebtRecord) => {
          // לוגיקה פשוטה - אם יש חובות פעילים ישנים לנציג
          const age = calculate_debt_age(debt.due_date);
          return debt.status === 'פעיל' && age > 60;
        },
        create_alert: (debt: DebtRecord) => ({
          type: 'collection_target',
          title: 'יעד גביה לא הושג',
          description: `נציג ${debt.collection_agent} - יש חובות פעילים ישנים`,
          related_customer_id: debt.customer_id,
          priority: 'medium'
        })
      }
    ];
  }, []);

  // אתחול כללי התראות
  useEffect(() => {
    const rules = initialize_alert_rules();
    set_alert_rules(rules);
  }, [initialize_alert_rules]);

  // בדיקת התראות
  const check_alerts = useCallback(() => {
    if (alert_rules.length === 0) return;

    const new_alerts: Alert[] = [];
    const current_time = new Date();

    // בדיקה עבור כל רשומת חוב
    state.debts.forEach(debt => {
      alert_rules.forEach(rule => {
        if (!rule.enabled) return;

        try {
          if (rule.check_function(debt)) {
            // בדיקה אם כבר יש התראה כזו עבור הלקוח הזה
            const existing_alert = state.alerts.find(alert => 
              alert.related_customer_id === debt.customer_id && 
              alert.type === rule.create_alert(debt).type &&
              !alert.is_read
            );

            if (!existing_alert) {
              const alert_data = rule.create_alert(debt);
              const new_alert: Alert = {
                ...alert_data,
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                created_at: current_time,
                is_read: false
              };
              
              new_alerts.push(new_alert);
            }
          }
        } catch (error) {
          console.error(`Error checking alert rule ${rule.id}:`, error);
        }
      });
    });

    // עדכון התראות אם יש חדשות
    if (new_alerts.length > 0) {
      const updated_alerts = [...state.alerts, ...new_alerts];
      set_alerts(updated_alerts);

      // הצגת התראות צפות
      if (show_floating_alerts) {
        const alerts_to_float = new_alerts
          .filter(alert => alert.priority === 'high')
          .slice(0, max_floating_alerts);
        
        set_floating_alerts(prev => [...prev, ...alerts_to_float]);
      }
    }

    set_last_check(current_time);
  }, [state.debts, state.alerts, alert_rules, set_alerts, show_floating_alerts, max_floating_alerts]);

  // בדיקת התראות אוטומטית
  useEffect(() => {
    const interval = setInterval(check_alerts, 60000); // בדיקה כל דקה
    return () => clearInterval(interval);
  }, [check_alerts]);

  // בדיקה ראשונית
  useEffect(() => {
    if (alert_rules.length > 0) {
      check_alerts();
    }
  }, [alert_rules, check_alerts]);

  // הסרת התראה צפה
  const dismiss_floating_alert = (alert_id: string) => {
    set_floating_alerts(prev => prev.filter(alert => alert.id !== alert_id));
  };

  // הסרה אוטומטית של התראות צפות
  useEffect(() => {
    floating_alerts.forEach(alert => {
      setTimeout(() => {
        dismiss_floating_alert(alert.id);
      }, auto_dismiss_time);
    });
  }, [floating_alerts, auto_dismiss_time]);

  // סימון התראה כנקראה
  const mark_alert_as_read = (alert_id: string) => {
    const updated_alerts = state.alerts.map(alert =>
      alert.id === alert_id ? { ...alert, is_read: true } : alert
    );
    set_alerts(updated_alerts);
  };

  // מחיקת התראה
  const delete_alert = (alert_id: string) => {
    const updated_alerts = state.alerts.filter(alert => alert.id !== alert_id);
    set_alerts(updated_alerts);
  };

  // החלפת מצב כלל התראה
  const toggle_alert_rule = (rule_id: string) => {
    set_alert_rules(prev => prev.map(rule =>
      rule.id === rule_id ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // קבלת צבע לפי עדיפות
  const get_priority_color = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // קבלת אייקון לפי סוג התראה
  const get_alert_icon = (type: string) => {
    switch (type) {
      case 'urgent_debt': return '🚨';
      case 'due_payment': return '⏰';
      case 'collection_target': return '🎯';
      default: return '📢';
    }
  };

  // סינון התראות לא נקראות
  const unread_alerts = state.alerts.filter(alert => !alert.is_read);
  const high_priority_unread = unread_alerts.filter(alert => alert.priority === 'high');

  return (
    <div className="space-y-6">
      {/* סיכום התראות */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{get_text('alerts')}</h3>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={check_alerts}
              className="text-sm text-israeli-blue hover:text-israeli-blue/80 transition-colors"
            >
              {get_text('refresh')}
            </button>
            <div className="text-sm text-gray-600">
              בדיקה אחרונה: {format_israeli_date(last_check)}
            </div>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{high_priority_unread.length}</div>
            <div className="text-sm text-red-700">התראות דחופות</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {unread_alerts.filter(a => a.priority === 'medium').length}
            </div>
            <div className="text-sm text-yellow-700">התראות רגילות</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {unread_alerts.filter(a => a.priority === 'low').length}
            </div>
            <div className="text-sm text-blue-700">התראות מידע</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{state.alerts.length}</div>
            <div className="text-sm text-gray-700">סה"כ התראות</div>
          </div>
        </div>

        {/* הגדרות כללי התראות */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">הגדרות התראות</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alert_rules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1 text-right">
                  <div className="font-medium text-gray-900">{rule.name}</div>
                  <div className="text-sm text-gray-600">{rule.description}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer mr-3">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={() => toggle_alert_rule(rule.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-israeli-blue"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* רשימת התראות */}
      {unread_alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h4 className="font-medium text-gray-900">התראות פעילות</h4>
          </div>
          <div className="divide-y">
            {unread_alerts
              .sort((a, b) => {
                const priority_order = { high: 3, medium: 2, low: 1 };
                return priority_order[b.priority] - priority_order[a.priority];
              })
              .map(alert => (
                <div key={alert.id} className={`p-4 border-r-4 ${get_priority_color(alert.priority)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 text-right">
                      <div className="flex items-center justify-end space-x-2 space-x-reverse">
                        <span className="text-lg">{get_alert_icon(alert.type)}</span>
                        <h5 className="font-medium text-gray-900">{alert.title}</h5>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{alert.description}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {format_israeli_date(alert.created_at)} • עדיפות: {alert.priority}
                      </div>
                    </div>
                    <div className="flex space-x-2 space-x-reverse mr-4">
                      <button
                        onClick={() => mark_alert_as_read(alert.id)}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        סמן כנקרא
                      </button>
                      <button
                        onClick={() => delete_alert(alert.id)}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* התראות צפות */}
      {show_floating_alerts && floating_alerts.length > 0 && (
        <div className="fixed top-4 left-4 z-50 space-y-2">
          {floating_alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg shadow-lg border-r-4 max-w-sm ${get_priority_color(alert.priority)} animate-slide-in-left`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end space-x-2 space-x-reverse">
                    <span>{get_alert_icon(alert.type)}</span>
                    <h6 className="font-medium">{alert.title}</h6>
                  </div>
                  <p className="mt-1 text-sm">{alert.description}</p>
                </div>
                <button
                  onClick={() => dismiss_floating_alert(alert.id)}
                  className="text-gray-400 hover:text-gray-600 mr-2"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertSystem;