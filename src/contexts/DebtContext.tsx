import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  DebtRecord, 
  FilterOptions, 
  SortOptions, 
  PaginationOptions, 
  SystemMessage,
  PerformanceReport,
  Alert,
  UserSettings
} from '../types';

// סוגי פעולות
type DebtAction =
  | { type: 'SET_DEBTS'; payload: DebtRecord[] }
  | { type: 'ADD_DEBT'; payload: DebtRecord }
  | { type: 'UPDATE_DEBT'; payload: { id: string; data: Partial<DebtRecord> } }
  | { type: 'DELETE_DEBT'; payload: string }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'SET_SORT'; payload: SortOptions }
  | { type: 'SET_PAGINATION'; payload: PaginationOptions }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: SystemMessage }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'SET_PERFORMANCE_REPORT'; payload: PerformanceReport }
  | { type: 'SET_ALERTS'; payload: Alert[] }
  | { type: 'SET_USER_SETTINGS'; payload: UserSettings }
  | { type: 'RESET_STATE' };

// מצב ראשוני
interface DebtState {
  debts: DebtRecord[];
  filtered_debts: DebtRecord[];
  filters: FilterOptions;
  sort: SortOptions;
  pagination: PaginationOptions;
  loading: boolean;
  messages: SystemMessage[];
  performance_report: PerformanceReport | null;
  alerts: Alert[];
  user_settings: UserSettings;
}

const initial_state: DebtState = {
  debts: [],
  filtered_debts: [],
  filters: {},
  sort: { field: 'due_date', direction: 'desc' },
  pagination: { page: 1, per_page: 50, total: 0 },
  loading: false,
  messages: [],
  performance_report: null,
  alerts: [],
  user_settings: {
    language: 'he',
    theme: 'light',
    items_per_page: 50,
    default_filters: {},
    notifications_enabled: true
  }
};

// פונקציית מיון
const sort_debts = (debts: DebtRecord[], sort: SortOptions): DebtRecord[] => {
  return [...debts].sort((a, b) => {
    const aValue = a[sort.field];
    const bValue = b[sort.field];
    
    if (aValue === bValue) return 0;
    
    const result = aValue < bValue ? -1 : 1;
    return sort.direction === 'asc' ? result : -result;
  });
};

// פונקציית סינון
const filter_debts = (debts: DebtRecord[], filters: FilterOptions): DebtRecord[] => {
  return debts.filter(debt => {
    // סינון לפי סטטוס
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(debt.status)) return false;
    }
    
    // סינון לפי טווח תאריכים
    if (filters.date_range) {
      const debt_date = new Date(debt.due_date);
      if (debt_date < filters.date_range.start || debt_date > filters.date_range.end) {
        return false;
      }
    }
    
    // סינון לפי טווח סכומים
    if (filters.amount_range) {
      if (debt.remaining_debt < filters.amount_range.min || debt.remaining_debt > filters.amount_range.max) {
        return false;
      }
    }
    
    // סינון לפי נציגי גביה
    if (filters.collection_agent && filters.collection_agent.length > 0) {
      if (!filters.collection_agent.includes(debt.collection_agent)) return false;
    }
    
    // סינון לפי חיפוש טקסט
    if (filters.search_term) {
      const search_term = filters.search_term.toLowerCase();
      return (
        debt.customer_name.toLowerCase().includes(search_term) ||
        debt.customer_id.toLowerCase().includes(search_term) ||
        debt.id_number.includes(search_term) ||
        (debt.phone && debt.phone.includes(search_term))
      );
    }
    
    return true;
  });
};

// רדיוסר
const debt_reducer = (state: DebtState, action: DebtAction): DebtState => {
  switch (action.type) {
    case 'SET_DEBTS': {
      const sorted_debts = sort_debts(action.payload, state.sort);
      const filtered_debts = filter_debts(sorted_debts, state.filters);
      return {
        ...state,
        debts: action.payload,
        filtered_debts,
        pagination: { ...state.pagination, total: filtered_debts.length }
      };
    }
    
    case 'ADD_DEBT': {
      const new_debts = [...state.debts, action.payload];
      const sorted_debts = sort_debts(new_debts, state.sort);
      const filtered_debts = filter_debts(sorted_debts, state.filters);
      return {
        ...state,
        debts: new_debts,
        filtered_debts,
        pagination: { ...state.pagination, total: filtered_debts.length }
      };
    }
    
    case 'UPDATE_DEBT': {
      const updated_debts = state.debts.map(debt =>
        debt.customer_id === action.payload.id
          ? { ...debt, ...action.payload.data }
          : debt
      );
      const sorted_debts = sort_debts(updated_debts, state.sort);
      const filtered_debts = filter_debts(sorted_debts, state.filters);
      return {
        ...state,
        debts: updated_debts,
        filtered_debts,
        pagination: { ...state.pagination, total: filtered_debts.length }
      };
    }
    
    case 'DELETE_DEBT': {
      const filtered_out_debts = state.debts.filter(debt => debt.customer_id !== action.payload);
      const sorted_debts = sort_debts(filtered_out_debts, state.sort);
      const filtered_debts = filter_debts(sorted_debts, state.filters);
      return {
        ...state,
        debts: filtered_out_debts,
        filtered_debts,
        pagination: { ...state.pagination, total: filtered_debts.length }
      };
    }
    
    case 'SET_FILTERS': {
      const filtered_debts = filter_debts(state.debts, action.payload);
      const sorted_debts = sort_debts(filtered_debts, state.sort);
      return {
        ...state,
        filters: action.payload,
        filtered_debts: sorted_debts,
        pagination: { ...state.pagination, page: 1, total: sorted_debts.length }
      };
    }
    
    case 'SET_SORT': {
      const sorted_debts = sort_debts(state.filtered_debts, action.payload);
      return {
        ...state,
        sort: action.payload,
        filtered_debts: sorted_debts
      };
    }
    
    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: action.payload
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    
    case 'SET_PERFORMANCE_REPORT':
      return {
        ...state,
        performance_report: action.payload
      };
    
    case 'SET_ALERTS':
      return {
        ...state,
        alerts: action.payload
      };
    
    case 'SET_USER_SETTINGS':
      return {
        ...state,
        user_settings: action.payload
      };
    
    case 'RESET_STATE':
      return initial_state;
    
    default:
      return state;
  }
};

// קונטקסט
const DebtContext = createContext<{
  state: DebtState;
  dispatch: React.Dispatch<DebtAction>;
} | null>(null);

// ספק קונטקסט
export const DebtProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(debt_reducer, initial_state);
  
  return (
    <DebtContext.Provider value={{ state, dispatch }}>
      {children}
    </DebtContext.Provider>
  );
};

// Hook לשימוש בקונטקסט
export const use_debt_context = () => {
  const context = useContext(DebtContext);
  if (!context) {
    throw new Error('use_debt_context must be used within a DebtProvider');
  }
  return context;
};

// Hook לפעולות נפוצות
export const use_debt_actions = () => {
  const { dispatch } = use_debt_context();
  
  return {
    set_debts: (debts: DebtRecord[]) => dispatch({ type: 'SET_DEBTS', payload: debts }),
    add_debt: (debt: DebtRecord) => dispatch({ type: 'ADD_DEBT', payload: debt }),
    update_debt: (id: string, data: Partial<DebtRecord>) => 
      dispatch({ type: 'UPDATE_DEBT', payload: { id, data } }),
    delete_debt: (id: string) => dispatch({ type: 'DELETE_DEBT', payload: id }),
    set_filters: (filters: FilterOptions) => dispatch({ type: 'SET_FILTERS', payload: filters }),
    set_sort: (sort: SortOptions) => dispatch({ type: 'SET_SORT', payload: sort }),
    set_pagination: (pagination: PaginationOptions) => 
      dispatch({ type: 'SET_PAGINATION', payload: pagination }),
    set_loading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading }),
    add_message: (message: SystemMessage) => dispatch({ type: 'ADD_MESSAGE', payload: message }),
    remove_message: (id: string) => dispatch({ type: 'REMOVE_MESSAGE', payload: id }),
    set_performance_report: (report: PerformanceReport) => 
      dispatch({ type: 'SET_PERFORMANCE_REPORT', payload: report }),
    set_alerts: (alerts: Alert[]) => dispatch({ type: 'SET_ALERTS', payload: alerts }),
    set_user_settings: (settings: UserSettings) => 
      dispatch({ type: 'SET_USER_SETTINGS', payload: settings }),
    reset_state: () => dispatch({ type: 'RESET_STATE' })
  };
};