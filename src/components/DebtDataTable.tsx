import React from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { DebtRecord, SortOptions } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_currency, format_israeli_date, format_israeli_phone } from '../utils/formatting';

interface DebtDataTableProps {
  show_actions?: boolean;
  on_edit_debt?: (debt: DebtRecord) => void;
  on_delete_debt?: (debt_id: string) => void;
}

const DebtDataTable: React.FC<DebtDataTableProps> = ({
  show_actions = true,
  on_edit_debt,
  on_delete_debt
}) => {
  const { state } = use_debt_context();
  const { set_sort, set_pagination } = use_debt_actions();
  
  const { filtered_debts, sort, pagination, loading } = state;

  // חישוב רשומות לעמוד נוכחי
  const start_index = (pagination.page - 1) * pagination.per_page;
  const end_index = start_index + pagination.per_page;
  const current_page_debts = filtered_debts.slice(start_index, end_index);
  const total_pages = Math.ceil(pagination.total / pagination.per_page);

  // פונקציה לטיפול במיון
  const handle_sort = (field: keyof DebtRecord) => {
    const new_direction = sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc';
    const new_sort: SortOptions = {
      field,
      direction: new_direction
    };
    set_sort(new_sort);
  };

  // פונקציה לטיפול בשינוי עמוד
  const handle_page_change = (new_page: number) => {
    if (new_page >= 1 && new_page <= total_pages) {
      set_pagination({ ...pagination, page: new_page });
    }
  };

  // פונקציה לשינוי מספר רשומות לעמוד
  const handle_per_page_change = (new_per_page: number) => {
    set_pagination({
      ...pagination,
      per_page: new_per_page,
      page: 1 // חזרה לעמוד הראשון
    });
  };

  // אייקון מיון
  const sort_icon = (field: keyof DebtRecord) => {
    if (sort.field !== field) {
      return <span className="text-gray-400">⇅</span>;
    }
    return sort.direction === 'asc' ? 
      <span className="text-israeli-blue">↑</span> : 
      <span className="text-israeli-blue">↓</span>;
  };

  // פונקציה לקבלת צבע לפי סטטוס
  const get_status_color = (status: string) => {
    switch (status) {
      case 'פעיל': return 'bg-green-100 text-green-800';
      case 'סגור': return 'bg-gray-100 text-gray-800';
      case 'בטיפול': return 'bg-yellow-100 text-yellow-800';
      case 'מושהה': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">{get_text('loading')}</div>
      </div>
    );
  }

  if (filtered_debts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">{get_text('no_data')}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* טבלת נתונים */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handle_sort('customer_name')}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{get_text('customer_name')}</span>
                  {sort_icon('customer_name')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handle_sort('id_number')}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{get_text('id_number')}</span>
                  {sort_icon('id_number')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handle_sort('remaining_debt')}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{get_text('remaining_debt')}</span>
                  {sort_icon('remaining_debt')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handle_sort('due_date')}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{get_text('due_date')}</span>
                  {sort_icon('due_date')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handle_sort('status')}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{get_text('status')}</span>
                  {sort_icon('status')}
                </div>
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handle_sort('collection_agent')}
              >
                <div className="flex items-center justify-end space-x-1 space-x-reverse">
                  <span>{get_text('collection_agent')}</span>
                  {sort_icon('collection_agent')}
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {get_text('phone')}
              </th>
              {show_actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {current_page_debts.map((debt) => (
              <tr key={debt.customer_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {debt.customer_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {debt.id_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-semibold">
                  {format_israeli_currency(debt.remaining_debt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {format_israeli_date(debt.due_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${get_status_color(debt.status)}`}>
                    {debt.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {debt.collection_agent}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {debt.phone ? format_israeli_phone(debt.phone) : '-'}
                </td>
                {show_actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <div className="flex justify-end space-x-2 space-x-reverse">
                      {on_edit_debt && (
                        <button
                          onClick={() => on_edit_debt(debt)}
                          className="text-israeli-blue hover:text-israeli-blue/80 transition-colors"
                        >
                          {get_text('edit')}
                        </button>
                      )}
                      {on_delete_debt && (
                        <button
                          onClick={() => {
                            if (window.confirm(get_text('confirm_delete'))) {
                              on_delete_debt(debt.customer_id);
                            }
                          }}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          {get_text('delete')}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* פנל ניווט בדפים */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => handle_page_change(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {get_text('previous')}
          </button>
          <button
            onClick={() => handle_page_change(pagination.page + 1)}
            disabled={pagination.page >= total_pages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {get_text('next')}
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <p className="text-sm text-gray-700">
              {get_text('showing')} <span className="font-medium">{start_index + 1}</span> {get_text('to')}{' '}
              <span className="font-medium">{Math.min(end_index, pagination.total)}</span> {get_text('of')}{' '}
              <span className="font-medium">{pagination.total}</span> {get_text('entries')}
            </p>
            <div className="flex items-center space-x-2 space-x-reverse">
              <label htmlFor="per-page" className="text-sm text-gray-700">
                {get_text('rows_per_page')}:
              </label>
              <select
                id="per-page"
                value={pagination.per_page}
                onChange={(e) => handle_per_page_change(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-israeli-blue"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handle_page_change(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">{get_text('previous')}</span>
                →
              </button>
              
              {/* מספרי עמודים */}
              {Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
                const page_num = Math.max(1, pagination.page - 2) + i;
                if (page_num > total_pages) return null;
                
                return (
                  <button
                    key={page_num}
                    onClick={() => handle_page_change(page_num)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.page === page_num
                        ? 'z-10 bg-israeli-blue border-israeli-blue text-white'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page_num}
                  </button>
                );
              })}
              
              <button
                onClick={() => handle_page_change(pagination.page + 1)}
                disabled={pagination.page >= total_pages}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">{get_text('next')}</span>
                ←
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtDataTable;