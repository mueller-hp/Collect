import React, { useState, useEffect, useCallback, useRef } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { DebtRecord } from '../types';
import { format_israeli_currency } from '../utils/formatting';
import { 
  smart_search, 
  advanced_search, 
  SearchResult, 
  SearchOptions, 
  get_search_summary,
  SearchSummary 
} from '../utils/hebrewSearch';

interface SmartSearchProps {
  on_result_select?: (record: DebtRecord) => void;
  placeholder?: string;
  show_summary?: boolean;
  auto_focus?: boolean;
  max_visible_results?: number;
}

const SmartSearch: React.FC<SmartSearchProps> = ({
  on_result_select,
  placeholder = 'חיפוש חכם - הקלד שם, ת.ז., טלפון או כל פרט...',
  show_summary = true,
  auto_focus = false,
  max_visible_results = 10
}) => {
  const { state } = use_debt_context();
  const { set_filters } = use_debt_actions();
  
  const [search_query, set_search_query] = useState('');
  const [search_results, set_search_results] = useState<SearchResult[]>([]);
  const [search_summary, set_search_summary] = useState<SearchSummary | null>(null);
  const [is_searching, set_is_searching] = useState(false);
  const [show_results, set_show_results] = useState(false);
  const [selected_index, set_selected_index] = useState(-1);
  const [search_mode, set_search_mode] = useState<'smart' | 'advanced'>('smart');
  
  const search_input_ref = useRef<HTMLInputElement>(null);
  const results_ref = useRef<HTMLDivElement>(null);
  const search_timeout_ref = useRef<NodeJS.Timeout>();

  // הגדרות חיפוש
  const search_options: SearchOptions = {
    fuzzy_threshold: 0.6,
    max_results: 50,
    fields: ['customer_name', 'id_number', 'customer_id', 'phone', 'collection_agent', 'notes'],
    boost_fields: {
      customer_name: 3.0,
      id_number: 2.5,
      customer_id: 2.0,
      phone: 1.5,
      collection_agent: 1.0,
      notes: 0.5,
      status: 1.0,
      debt_amount: 1.0,
      paid_amount: 1.0,
      remaining_debt: 1.0,
      due_date: 1.0,
      last_payment_date: 0.5,
      created_at: 0.5,
      updated_at: 0.5
    },
    exact_match_boost: 4.0
  };

  // ביצוע חיפוש
  const perform_search = useCallback(
    (query: string) => {
      if (!query.trim()) {
        set_search_results([]);
        set_search_summary(null);
        set_show_results(false);
        return;
      }

      set_is_searching(true);
      const start_time = performance.now();

      try {
        const results = search_mode === 'advanced' 
          ? advanced_search(state.debts, query, search_options)
          : smart_search(state.debts, query, search_options);
        
        const end_time = performance.now();
        const search_time = end_time - start_time;
        
        set_search_results(results);
        set_search_summary(get_search_summary(results, search_time));
        set_show_results(true);
        set_selected_index(-1);
      } catch (error) {
        console.error('Search error:', error);
        set_search_results([]);
        set_search_summary(null);
      } finally {
        set_is_searching(false);
      }
    },
    [state.debts, search_mode, search_options]
  );

  // חיפוש עם debounce
  const debounced_search = useCallback((query: string) => {
    if (search_timeout_ref.current) {
      clearTimeout(search_timeout_ref.current);
    }
    
    search_timeout_ref.current = setTimeout(() => {
      perform_search(query);
    }, 300);
  }, [perform_search]);

  // טיפול בשינוי בשדה החיפוש
  const handle_search_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    set_search_query(query);
    debounced_search(query);
  };

  // טיפול בלחיצות מקלדת
  const handle_key_down = (e: React.KeyboardEvent) => {
    if (!show_results || search_results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        set_selected_index(prev => 
          prev < search_results.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        set_selected_index(prev => 
          prev > 0 ? prev - 1 : search_results.length - 1
        );
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selected_index >= 0 && selected_index < search_results.length) {
          handle_result_select(search_results[selected_index]);
        }
        break;
      
      case 'Escape':
        set_show_results(false);
        set_selected_index(-1);
        break;
    }
  };

  // טיפול בבחירת תוצאה
  const handle_result_select = (result: SearchResult) => {
    if (on_result_select) {
      on_result_select(result.record);
    } else {
      // סינון לפי הרשומה הנבחרת
      set_filters({
        search_term: result.record.customer_name
      });
    }
    
    set_show_results(false);
    set_search_query(result.record.customer_name);
  };

  // סגירת תוצאות כשמקליקים מחוץ
  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (
        results_ref.current && 
        !results_ref.current.contains(event.target as Node) &&
        search_input_ref.current && 
        !search_input_ref.current.contains(event.target as Node)
      ) {
        set_show_results(false);
      }
    };

    document.addEventListener('mousedown', handle_click_outside);
    return () => document.removeEventListener('mousedown', handle_click_outside);
  }, []);

  // מיקוד אוטומטי
  useEffect(() => {
    if (auto_focus && search_input_ref.current) {
      search_input_ref.current.focus();
    }
  }, [auto_focus]);

  // ניקוי timeout בעת unmount
  useEffect(() => {
    return () => {
      if (search_timeout_ref.current) {
        clearTimeout(search_timeout_ref.current);
      }
    };
  }, []);

  // קבלת צבע ציון
  const get_score_color = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  // קבלת תווית ציון
  const get_score_label = (score: number): string => {
    if (score >= 0.9) return 'התאמה מושלמת';
    if (score >= 0.7) return 'התאמה טובה';
    if (score >= 0.5) return 'התאמה חלקית';
    return 'התאמה חלשה';
  };

  return (
    <div className="relative">
      {/* שדה חיפוש */}
      <div className="relative">
        <input
          ref={search_input_ref}
          type="text"
          value={search_query}
          onChange={handle_search_change}
          onKeyDown={handle_key_down}
          onFocus={() => search_results.length > 0 && set_show_results(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-israeli-blue focus:border-israeli-blue text-right text-lg"
          dir="rtl"
        />
        
        {/* אייקון חיפוש */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {is_searching ? (
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>

        {/* מתג מצב חיפוש */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <button
            onClick={() => set_search_mode(prev => prev === 'smart' ? 'advanced' : 'smart')}
            className={`text-xs px-2 py-1 rounded ${
              search_mode === 'advanced' 
                ? 'bg-israeli-blue text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
            title={search_mode === 'smart' ? 'לחץ למעבר לחיפוש מתקדם' : 'לחץ למעבר לחיפוש חכם'}
          >
            {search_mode === 'smart' ? 'חכם' : 'מתקדם'}
          </button>
        </div>
      </div>

      {/* סיכום תוצאות */}
      {show_summary && search_summary && (
        <div className="mt-2 text-sm text-gray-600 text-right">
          נמצאו {search_summary.total_results} תוצאות 
          {search_summary.avg_score > 0 && (
            <span> • דיוק ממוצע: {Math.round(search_summary.avg_score * 100)}%</span>
          )}
          <span> • זמן חיפוש: {Math.round(search_summary.search_time_ms)}ms</span>
        </div>
      )}

      {/* תוצאות חיפוש */}
      {show_results && (
        <div 
          ref={results_ref}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {search_results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              לא נמצאו תוצאות עבור "{search_query}"
            </div>
          ) : (
            <>
              {search_results.slice(0, max_visible_results).map((result, index) => (
                <div
                  key={result.record.customer_id}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    index === selected_index 
                      ? 'bg-israeli-blue/10' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handle_result_select(result)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-right">
                      <div className="font-semibold text-gray-900">
                        <span 
                          dangerouslySetInnerHTML={{ 
                            __html: result.highlights.customer_name || result.record.customer_name 
                          }} 
                        />
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="inline-block ml-4">
                          ת.ז.: <span 
                            dangerouslySetInnerHTML={{ 
                              __html: result.highlights.id_number || result.record.id_number 
                            }} 
                          />
                        </span>
                        {result.record.phone && (
                          <span className="inline-block ml-4">
                            טלפון: <span 
                              dangerouslySetInnerHTML={{ 
                                __html: result.highlights.phone || result.record.phone 
                              }} 
                            />
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-800 mt-1">
                        <span className="font-medium text-red-600">
                          {format_israeli_currency(result.record.remaining_debt)}
                        </span>
                        <span className="mr-2">•</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          result.record.status === 'פעיל' ? 'bg-red-100 text-red-800' :
                          result.record.status === 'בטיפול' ? 'bg-yellow-100 text-yellow-800' :
                          result.record.status === 'סגור' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {result.record.status}
                        </span>
                      </div>
                    </div>
                    <div className="mr-4 text-left">
                      <div className={`text-xs font-medium ${get_score_color(result.score)}`}>
                        {Math.round(result.score * 100)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {get_score_label(result.score)}
                      </div>
                    </div>
                  </div>
                  
                  {/* שדות מתאימים */}
                  {result.matched_fields.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 text-right">
                      נמצא ב: {result.matched_fields.join(', ')}
                    </div>
                  )}
                </div>
              ))}
              
              {search_results.length > max_visible_results && (
                <div className="p-3 text-center text-sm text-gray-500 border-t">
                  ועוד {search_results.length - max_visible_results} תוצאות...
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;