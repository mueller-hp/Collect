import React, { useState, useEffect } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { FilterOptions, DebtStatus } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_date } from '../utils/formatting';

interface DebtFiltersProps {
  show_advanced?: boolean;
  on_filters_change?: (filters: FilterOptions) => void;
}

const DebtFilters: React.FC<DebtFiltersProps> = ({
  show_advanced = false,
  on_filters_change
}) => {
  const { state } = use_debt_context();
  const { set_filters } = use_debt_actions();
  
  const { filters, debts } = state;
  
  // מצבים מקומיים לטופס
  const [local_filters, set_local_filters] = useState<FilterOptions>(filters);
  const [show_date_range, set_show_date_range] = useState(false);
  const [show_amount_range, set_show_amount_range] = useState(false);
  
  // רשימת סטטוסים אפשריים
  const available_statuses: DebtStatus[] = ['פעיל', 'סגור', 'בטיפול', 'מושהה'];
  
  // רשימת נציגי גביה יחודיים
  const available_agents = Array.from(
    new Set(debts.map(debt => debt.collection_agent))
  ).filter(agent => agent && agent.trim() !== '');

  // עדכון מסננים מקומיים כשהמסננים הגלובליים משתנים
  useEffect(() => {
    set_local_filters(filters);
  }, [filters]);

  // פונקציה לעדכון מסנן יחיד
  const update_filter = (key: keyof FilterOptions, value: any) => {
    const new_filters = { ...local_filters, [key]: value };
    set_local_filters(new_filters);
  };

  // פונקציה להחלת מסננים
  const apply_filters = () => {
    set_filters(local_filters);
    if (on_filters_change) {
      on_filters_change(local_filters);
    }
  };

  // פונקציה לניקוי מסננים
  const clear_filters = () => {
    const empty_filters: FilterOptions = {};
    set_local_filters(empty_filters);
    set_filters(empty_filters);
    set_show_date_range(false);
    set_show_amount_range(false);
    if (on_filters_change) {
      on_filters_change(empty_filters);
    }
  };

  // פונקציה לטיפול בשינוי חיפוש
  const handle_search_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const search_term = e.target.value;
    const new_filters = { ...local_filters, search_term: search_term || undefined };
    set_local_filters(new_filters);
    
    // החלת החיפוש באופן מיידי
    set_filters(new_filters);
    if (on_filters_change) {
      on_filters_change(new_filters);
    }
  };

  // פונקציה לטיפול בשינוי סטטוס
  const handle_status_change = (status: DebtStatus, checked: boolean) => {
    const current_statuses = local_filters.status || [];
    let new_statuses: DebtStatus[];
    
    if (checked) {
      new_statuses = [...current_statuses, status];
    } else {
      new_statuses = current_statuses.filter(s => s !== status);
    }
    
    update_filter('status', new_statuses.length > 0 ? new_statuses : undefined);
  };

  // פונקציה לטיפול בשינוי נציגי גביה
  const handle_agent_change = (agent: string, checked: boolean) => {
    const current_agents = local_filters.collection_agent || [];
    let new_agents: string[];
    
    if (checked) {
      new_agents = [...current_agents, agent];
    } else {
      new_agents = current_agents.filter(a => a !== agent);
    }
    
    update_filter('collection_agent', new_agents.length > 0 ? new_agents : undefined);
  };

  // פונקציה לטיפול בטווח תאריכים
  const handle_date_range_change = (start_date: string, end_date: string) => {
    if (start_date && end_date) {
      update_filter('date_range', {
        start: new Date(start_date),
        end: new Date(end_date)
      });
    } else {
      update_filter('date_range', undefined);
    }
  };

  // פונקציה לטיפול בטווח סכומים
  const handle_amount_range_change = (min_amount: string, max_amount: string) => {
    const min = parseFloat(min_amount) || 0;
    const max = parseFloat(max_amount) || 0;
    
    if (min > 0 || max > 0) {
      update_filter('amount_range', {
        min: min > 0 ? min : 0,
        max: max > 0 ? max : Infinity
      });
    } else {
      update_filter('amount_range', undefined);
    }
  };

  // בדיקה אם יש מסננים פעילים
  const has_active_filters = Object.keys(local_filters).some(key => {
    const value = local_filters[key as keyof FilterOptions];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{get_text('filter')}</h3>
        <div className="flex space-x-2 space-x-reverse">
          {has_active_filters && (
            <button
              onClick={clear_filters}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {get_text('clear_filters')}
            </button>
          )}
          {show_advanced && (
            <button
              onClick={apply_filters}
              className="px-4 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 transition-colors"
            >
              החל מסננים
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* חיפוש טקסט */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {get_text('search')}
          </label>
          <input
            type="text"
            value={local_filters.search_term || ''}
            onChange={handle_search_change}
            placeholder={get_text('search_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
          />
        </div>

        {/* סינון לפי סטטוס */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {get_text('filter_by_status')}
          </label>
          <div className="flex flex-wrap gap-2">
            {available_statuses.map(status => (
              <label key={status} className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={local_filters.status?.includes(status) || false}
                  onChange={(e) => handle_status_change(status, e.target.checked)}
                  className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
                />
                <span className="text-sm text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>

        {/* סינון לפי נציגי גביה */}
        {available_agents.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {get_text('filter_by_agent')}
            </label>
            <div className="flex flex-wrap gap-2">
              {available_agents.map(agent => (
                <label key={agent} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={local_filters.collection_agent?.includes(agent) || false}
                    onChange={(e) => handle_agent_change(agent, e.target.checked)}
                    className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
                  />
                  <span className="text-sm text-gray-700">{agent}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* מסננים מתקדמים */}
        {show_advanced && (
          <div className="border-t pt-4 space-y-4">
            {/* טווח תאריכים */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {get_text('filter_by_date')}
                </label>
                <button
                  onClick={() => set_show_date_range(!show_date_range)}
                  className="text-sm text-israeli-blue hover:text-israeli-blue/80"
                >
                  {show_date_range ? 'הסתר' : 'הצג'}
                </button>
              </div>
              {show_date_range && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {get_text('from_date')}
                    </label>
                    <input
                      type="date"
                      value={local_filters.date_range?.start ? 
                        format_israeli_date(local_filters.date_range.start).split('/').reverse().join('-') : ''}
                      onChange={(e) => handle_date_range_change(
                        e.target.value,
                        local_filters.date_range?.end ? 
                          format_israeli_date(local_filters.date_range.end).split('/').reverse().join('-') : ''
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {get_text('to_date')}
                    </label>
                    <input
                      type="date"
                      value={local_filters.date_range?.end ? 
                        format_israeli_date(local_filters.date_range.end).split('/').reverse().join('-') : ''}
                      onChange={(e) => handle_date_range_change(
                        local_filters.date_range?.start ? 
                          format_israeli_date(local_filters.date_range.start).split('/').reverse().join('-') : '',
                        e.target.value
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* טווח סכומים */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  {get_text('filter_by_amount')}
                </label>
                <button
                  onClick={() => set_show_amount_range(!show_amount_range)}
                  className="text-sm text-israeli-blue hover:text-israeli-blue/80"
                >
                  {show_amount_range ? 'הסתר' : 'הצג'}
                </button>
              </div>
              {show_amount_range && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      סכום מינימלי
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={local_filters.amount_range?.min || ''}
                      onChange={(e) => handle_amount_range_change(
                        e.target.value,
                        local_filters.amount_range?.max?.toString() || ''
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      סכום מקסימלי
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={local_filters.amount_range?.max === Infinity ? '' : local_filters.amount_range?.max || ''}
                      onChange={(e) => handle_amount_range_change(
                        local_filters.amount_range?.min?.toString() || '',
                        e.target.value
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                      placeholder="ללא הגבלה"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* מונה תוצאות */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-gray-600 text-right">
          {state.filtered_debts.length} {get_text('entries')} {state.filtered_debts.length !== state.debts.length && 
            `מתוך ${state.debts.length} כללי`}
        </p>
      </div>
    </div>
  );
};

export default DebtFilters;