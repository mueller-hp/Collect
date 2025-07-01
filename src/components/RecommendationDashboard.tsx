import React, { useState, useEffect, useMemo } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { Recommendation, DebtRecord } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_currency, format_israeli_date } from '../utils/formatting';
import {
  generate_bulk_recommendations,
  summarize_recommendations_by_agent,
  get_time_appropriate_recommendations,
  assess_customer
} from '../utils/recommendationEngine';

interface RecommendationDashboardProps {
  max_recommendations?: number;
  group_by_agent?: boolean;
  show_time_filter?: boolean;
}

const RecommendationDashboard: React.FC<RecommendationDashboardProps> = ({
  max_recommendations = 50,
  group_by_agent = false,
  show_time_filter = true
}) => {
  const { state } = use_debt_context();
  const { update_debt, add_message } = use_debt_actions();
  
  const [recommendations, set_recommendations] = useState<Recommendation[]>([]);
  const [loading, set_loading] = useState(false);
  const [selected_agent, set_selected_agent] = useState<string>('');
  const [selected_action, set_selected_action] = useState<Recommendation['action'] | ''>('');
  const [min_priority, set_min_priority] = useState<number>(5);
  const [time_filtered, set_time_filtered] = useState(false);
  const [last_updated, set_last_updated] = useState<Date>(new Date());

  // יצירת המלצות
  const generate_recommendations = useMemo(() => {
    if (state.debts.length === 0) return [];
    
    set_loading(true);
    try {
      let recs = generate_bulk_recommendations(state.debts, max_recommendations);
      
      if (show_time_filter && time_filtered) {
        recs = get_time_appropriate_recommendations(recs);
      }
      
      return recs;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    } finally {
      set_loading(false);
    }
  }, [state.debts, max_recommendations, show_time_filter, time_filtered]);

  // עדכון המלצות כשהנתונים משתנים
  useEffect(() => {
    set_recommendations(generate_recommendations);
    set_last_updated(new Date());
  }, [generate_recommendations]);

  // סינון המלצות
  const filtered_recommendations = useMemo(() => {
    return recommendations.filter(rec => {
      // סינון לפי נציג
      if (selected_agent) {
        const debt = state.debts.find(d => d.customer_id === rec.customer_id);
        if (!debt || debt.collection_agent !== selected_agent) return false;
      }
      
      // סינון לפי סוג פעולה
      if (selected_action && rec.action !== selected_action) return false;
      
      // סינון לפי עדיפות מינימלית
      if (rec.priority < min_priority) return false;
      
      return true;
    });
  }, [recommendations, selected_agent, selected_action, min_priority, state.debts]);

  // קבלת נציגי גביה יחודיים
  const available_agents = useMemo(() => {
    return Array.from(new Set(state.debts.map(debt => debt.collection_agent)))
      .filter(agent => agent && agent.trim() !== '');
  }, [state.debts]);

  // סיכום לפי נציגים
  const agent_summary = useMemo(() => {
    if (!group_by_agent) return {};
    return summarize_recommendations_by_agent(state.debts, filtered_recommendations);
  }, [group_by_agent, state.debts, filtered_recommendations]);

  // פונקציה לביצוע פעולה
  const execute_action = async (recommendation: Recommendation) => {
    const debt = state.debts.find(d => d.customer_id === recommendation.customer_id);
    if (!debt) return;

    try {
      // עדכון סטטוס לקוח ל"בטיפול"
      await update_debt(debt.customer_id, { 
        status: 'בטיפול',
        notes: `${debt.notes || ''}\n${new Date().toLocaleDateString('he-IL')}: ${get_action_name(recommendation.action)} - ${recommendation.reason}`.trim()
      });

      add_message({
        id: `action_${Date.now()}`,
        type: 'success',
        title: get_text('success'),
        message: `פעולה "${get_action_name(recommendation.action)}" נרשמה עבור ${debt.customer_name}`,
        timestamp: new Date(),
        auto_dismiss: true
      });

      // הסרת ההמלצה מהרשימה
      set_recommendations(prev => prev.filter(r => r !== recommendation));

    } catch (error) {
      add_message({
        id: `action_error_${Date.now()}`,
        type: 'error',
        title: get_text('error'),
        message: 'שגיאה בביצוע הפעולה',
        timestamp: new Date(),
        auto_dismiss: true
      });
    }
  };

  // קבלת שם פעולה בעברית
  const get_action_name = (action: Recommendation['action']): string => {
    switch (action) {
      case 'call': return get_text('call_customer');
      case 'email': return get_text('send_email');
      case 'meeting': return get_text('schedule_meeting');
      case 'legal': return get_text('legal_action');
      default: return action;
    }
  };

  // קבלת אייקון פעולה
  const get_action_icon = (action: Recommendation['action']): string => {
    switch (action) {
      case 'call': return '📞';
      case 'email': return '📧';
      case 'meeting': return '🤝';
      case 'legal': return '⚖️';
      default: return '📋';
    }
  };

  // קבלת צבע עדיפות
  const get_priority_color = (priority: number): string => {
    if (priority >= 8) return 'text-red-600 bg-red-50';
    if (priority >= 6) return 'text-yellow-600 bg-yellow-50';
    if (priority >= 4) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  // קבלת תווית עדיפות
  const get_priority_label = (priority: number): string => {
    if (priority >= 8) return 'דחופה';
    if (priority >= 6) return 'גבוהה';
    if (priority >= 4) return 'בינונית';
    return 'נמוכה';
  };

  return (
    <div className="space-y-6">
      {/* כותרת ופקדים */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">מנוע המלצות לגביה</h3>
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={() => {
                set_recommendations(generate_recommendations);
                set_last_updated(new Date());
              }}
              className="text-sm text-israeli-blue hover:text-israeli-blue/80 transition-colors"
            >
              {get_text('refresh')}
            </button>
            <div className="text-sm text-gray-600">
              עודכן: {format_israeli_date(last_updated)}
            </div>
          </div>
        </div>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{filtered_recommendations.length}</div>
            <div className="text-sm text-blue-700">המלצות פעילות</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {filtered_recommendations.filter(r => r.priority >= 8).length}
            </div>
            <div className="text-sm text-red-700">דחופות</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {filtered_recommendations.filter(r => r.action === 'call').length}
            </div>
            <div className="text-sm text-yellow-700">שיחות מומלצות</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(filtered_recommendations.reduce((sum, r) => sum + r.estimated_success, 0) / filtered_recommendations.length) || 0}%
            </div>
            <div className="text-sm text-green-700">הצלחה ממוצעת</div>
          </div>
        </div>

        {/* מסננים */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              נציג גביה
            </label>
            <select
              value={selected_agent}
              onChange={(e) => set_selected_agent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
            >
              <option value="">כל הנציגים</option>
              {available_agents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              סוג פעולה
            </label>
            <select
              value={selected_action}
              onChange={(e) => set_selected_action(e.target.value as Recommendation['action'] | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
            >
              <option value="">כל הפעולות</option>
              <option value="call">שיחות</option>
              <option value="email">אימיילים</option>
              <option value="meeting">פגישות</option>
              <option value="legal">פעולה משפטית</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              עדיפות מינימלית
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={min_priority}
              onChange={(e) => set_min_priority(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 text-center mt-1">{min_priority}/10</div>
          </div>

          {show_time_filter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מסנן זמן
              </label>
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={time_filtered}
                  onChange={(e) => set_time_filtered(e.target.checked)}
                  className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
                />
                <span className="text-sm text-gray-700">התאם לשעות עבודה</span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* המלצות */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="text-lg text-gray-600">יוצר המלצות...</div>
        </div>
      ) : group_by_agent ? (
        // תצוגה לפי נציגים
        <div className="space-y-4">
          {Object.values(agent_summary).map(summary => (
            <div key={summary.agent} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{summary.agent}</h4>
                  <div className="text-sm text-gray-600">
                    {summary.recommendations.length} המלצות • {format_israeli_currency(summary.total_debt)} חוב כולל
                  </div>
                </div>
              </div>
              <div className="divide-y">
                {summary.recommendations.map((rec, index) => {
                  const debt = state.debts.find(d => d.customer_id === rec.customer_id);
                  if (!debt) return null;

                  return (
                    <RecommendationCard
                      key={`${rec.customer_id}-${rec.action}-${index}`}
                      recommendation={rec}
                      debt={debt}
                      onExecute={() => execute_action(rec)}
                      getPriorityColor={get_priority_color}
                      getPriorityLabel={get_priority_label}
                      getActionName={get_action_name}
                      getActionIcon={get_action_icon}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // תצוגה רגילה
        <div className="bg-white rounded-lg shadow">
          {filtered_recommendations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              אין המלצות להצגה עם המסננים הנוכחיים
            </div>
          ) : (
            <div className="divide-y">
              {filtered_recommendations.map((rec, index) => {
                const debt = state.debts.find(d => d.customer_id === rec.customer_id);
                if (!debt) return null;

                return (
                  <RecommendationCard
                    key={`${rec.customer_id}-${rec.action}-${index}`}
                    recommendation={rec}
                    debt={debt}
                    onExecute={() => execute_action(rec)}
                    getPriorityColor={get_priority_color}
                    getPriorityLabel={get_priority_label}
                    getActionName={get_action_name}
                    getActionIcon={get_action_icon}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// רכיב כרטיס המלצה
interface RecommendationCardProps {
  recommendation: Recommendation;
  debt: DebtRecord;
  onExecute: () => void;
  getPriorityColor: (priority: number) => string;
  getPriorityLabel: (priority: number) => string;
  getActionName: (action: Recommendation['action']) => string;
  getActionIcon: (action: Recommendation['action']) => string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  debt,
  onExecute,
  getPriorityColor,
  getPriorityLabel,
  getActionName,
  getActionIcon
}) => {
  const assessment = assess_customer(debt);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end space-x-3 space-x-reverse mb-2">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(recommendation.priority)}`}>
              {getPriorityLabel(recommendation.priority)} ({recommendation.priority.toFixed(1)})
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-lg">{getActionIcon(recommendation.action)}</span>
              <span className="font-medium text-gray-900">{getActionName(recommendation.action)}</span>
            </div>
          </div>

          <div className="mb-2">
            <h5 className="text-lg font-semibold text-gray-900">{debt.customer_name}</h5>
            <div className="text-sm text-gray-600">
              ת.ז: {debt.id_number} • חוב: {format_israeli_currency(debt.remaining_debt)}
            </div>
          </div>

          <div className="text-sm text-gray-700 mb-3">
            <strong>סיבה:</strong> {recommendation.reason}
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">סיכוי הצלחה:</span>
              <div className="font-medium text-green-600">{recommendation.estimated_success.toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-gray-600">ציון סיכון:</span>
              <div className="font-medium text-red-600">{(assessment.overall_risk_score * 100).toFixed(0)}%</div>
            </div>
            <div>
              <span className="text-gray-600">נציג גביה:</span>
              <div className="font-medium text-gray-900">{debt.collection_agent}</div>
            </div>
          </div>
        </div>

        <div className="mr-6">
          <button
            onClick={onExecute}
            className="px-4 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 transition-colors text-sm"
          >
            בצע פעולה
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecommendationDashboard;