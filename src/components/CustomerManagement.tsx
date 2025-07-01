import React, { useState } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { DebtRecord, DebtStatus } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_currency, format_israeli_date } from '../utils/formatting';
import { IsraeliIdField, IsraeliPhoneField, CurrencyField, ValidationSummary, use_form_validation } from './ValidationHelpers';

interface CustomerManagementProps {
  selected_customer_id?: string;
  on_close?: () => void;
}

const CustomerManagement: React.FC<CustomerManagementProps> = ({
  selected_customer_id,
  on_close
}) => {
  const { state } = use_debt_context();
  const { add_debt, update_debt, delete_debt, add_message } = use_debt_actions();
  
  const [mode, set_mode] = useState<'view' | 'add' | 'edit'>('view');
  const [selected_debt, set_selected_debt] = useState<DebtRecord | null>(null);
  const [form_errors, set_form_errors] = useState<Record<string, string>>({});
  
  // נתוני הטופס
  const [form_data, set_form_data] = useState({
    customer_id: '',
    customer_name: '',
    id_number: '',
    debt_amount: '',
    paid_amount: '',
    due_date: '',
    status: 'פעיל' as DebtStatus,
    collection_agent: '',
    phone: '',
    notes: ''
  });

  // אימות הטופס
  const { validate_form } = use_form_validation({
    customer_name: { value: form_data.customer_name, type: 'text', required: true },
    id_number: { value: form_data.id_number, type: 'id', required: true },
    debt_amount: { value: form_data.debt_amount, type: 'number', required: true },
    phone: { value: form_data.phone, type: 'phone', required: false },
    collection_agent: { value: form_data.collection_agent, type: 'text', required: true }
  });

  // רשימת החובות של הלקוח
  const customer_debts = selected_customer_id 
    ? state.filtered_debts.filter(debt => debt.customer_id === selected_customer_id)
    : state.filtered_debts;

  // רשימת נציגי גביה
  const available_agents = Array.from(
    new Set(state.debts.map(debt => debt.collection_agent))
  ).filter(agent => agent && agent.trim() !== '');

  // איפוס הטופס
  const reset_form = () => {
    set_form_data({
      customer_id: '',
      customer_name: '',
      id_number: '',
      debt_amount: '',
      paid_amount: '',
      due_date: '',
      status: 'פעיל',
      collection_agent: '',
      phone: '',
      notes: ''
    });
    set_form_errors({});
  };

  // טעינת נתוני לקוח לטופס
  const load_debt_to_form = (debt: DebtRecord) => {
    set_form_data({
      customer_id: debt.customer_id,
      customer_name: debt.customer_name,
      id_number: debt.id_number,
      debt_amount: debt.debt_amount.toString(),
      paid_amount: debt.paid_amount.toString(),
      due_date: format_israeli_date(debt.due_date).split('/').reverse().join('-'),
      status: debt.status,
      collection_agent: debt.collection_agent,
      phone: debt.phone || '',
      notes: debt.notes || ''
    });
  };

  // פונקציה לטיפול בשמירה
  const handle_save = () => {
    const validation = validate_form();
    
    if (!validation.is_valid) {
      set_form_errors(validation.errors);
      return;
    }

    const debt_data: DebtRecord = {
      customer_id: form_data.customer_id || `CUST_${Date.now()}`,
      customer_name: form_data.customer_name,
      id_number: form_data.id_number,
      debt_amount: parseFloat(form_data.debt_amount),
      paid_amount: parseFloat(form_data.paid_amount || '0'),
      remaining_debt: parseFloat(form_data.debt_amount) - parseFloat(form_data.paid_amount || '0'),
      due_date: new Date(form_data.due_date),
      status: form_data.status,
      collection_agent: form_data.collection_agent,
      phone: form_data.phone || undefined,
      notes: form_data.notes || undefined,
      created_at: selected_debt?.created_at || new Date(),
      updated_at: new Date()
    };

    try {
      if (mode === 'add') {
        add_debt(debt_data);
        add_message({
          id: `msg_${Date.now()}`,
          type: 'success',
          title: get_text('success'),
          message: get_text('data_saved'),
          timestamp: new Date(),
          auto_dismiss: true
        });
      } else if (mode === 'edit' && selected_debt) {
        update_debt(selected_debt.customer_id, debt_data);
        add_message({
          id: `msg_${Date.now()}`,
          type: 'success',
          title: get_text('success'),
          message: get_text('data_saved'),
          timestamp: new Date(),
          auto_dismiss: true
        });
      }

      set_mode('view');
      set_selected_debt(null);
      reset_form();
    } catch (error) {
      add_message({
        id: `msg_${Date.now()}`,
        type: 'error',
        title: get_text('error'),
        message: get_text('operation_failed'),
        timestamp: new Date(),
        auto_dismiss: true
      });
    }
  };

  // פונקציה למחיקת חוב
  const handle_delete = (debt_id: string) => {
    if (window.confirm(get_text('confirm_delete'))) {
      try {
        delete_debt(debt_id);
        add_message({
          id: `msg_${Date.now()}`,
          type: 'success',
          title: get_text('success'),
          message: get_text('data_deleted'),
          timestamp: new Date(),
          auto_dismiss: true
        });
        set_selected_debt(null);
      } catch (error) {
        add_message({
          id: `msg_${Date.now()}`,
          type: 'error',
          title: get_text('error'),
          message: get_text('operation_failed'),
          timestamp: new Date(),
          auto_dismiss: true
        });
      }
    }
  };

  // פונקציה לעריכת חוב
  const handle_edit = (debt: DebtRecord) => {
    set_selected_debt(debt);
    load_debt_to_form(debt);
    set_mode('edit');
  };

  // פונקציה להוספת חוב חדש
  const handle_add_new = () => {
    reset_form();
    set_selected_debt(null);
    set_mode('add');
  };

  // פונקציה לביטול
  const handle_cancel = () => {
    set_mode('view');
    set_selected_debt(null);
    reset_form();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* כותרת */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'add' ? 'הוספת חוב חדש' : 
             mode === 'edit' ? 'עריכת חוב' : 
             get_text('customers')}
          </h2>
          <div className="flex space-x-2 space-x-reverse">
            {mode === 'view' && (
              <button
                onClick={handle_add_new}
                className="px-4 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 transition-colors"
              >
                {get_text('add')}
              </button>
            )}
            {on_close && (
              <button
                onClick={on_close}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {get_text('close')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* מצב צפייה */}
        {mode === 'view' && (
          <div>
            {customer_debts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">{get_text('no_data')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customer_debts.map((debt) => (
                  <div key={debt.customer_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 text-right">
                          {debt.customer_name}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="text-right">
                            <span className="font-medium">{get_text('id_number')}:</span>
                            <div>{debt.id_number}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{get_text('remaining_debt')}:</span>
                            <div className="font-semibold text-red-600">
                              {format_israeli_currency(debt.remaining_debt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{get_text('due_date')}:</span>
                            <div>{format_israeli_date(debt.due_date)}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{get_text('status')}:</span>
                            <div>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                debt.status === 'פעיל' ? 'bg-red-100 text-red-800' :
                                debt.status === 'בטיפול' ? 'bg-yellow-100 text-yellow-800' :
                                debt.status === 'סגור' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {debt.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => handle_edit(debt)}
                          className="text-israeli-blue hover:text-israeli-blue/80 transition-colors"
                        >
                          {get_text('edit')}
                        </button>
                        <button
                          onClick={() => handle_delete(debt.customer_id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          {get_text('delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* מצב הוספה/עריכה */}
        {(mode === 'add' || mode === 'edit') && (
          <div className="space-y-6">
            <ValidationSummary errors={form_errors} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* פרטי לקוח */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">פרטי לקוח</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {get_text('customer_name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form_data.customer_name}
                    onChange={(e) => set_form_data({...form_data, customer_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                    placeholder="שם מלא"
                  />
                </div>

                <IsraeliIdField
                  value={form_data.id_number}
                  onChange={(value) => set_form_data({...form_data, id_number: value})}
                  label={get_text('id_number')}
                  required
                />

                <IsraeliPhoneField
                  value={form_data.phone}
                  onChange={(value) => set_form_data({...form_data, phone: value})}
                  label={get_text('phone')}
                />
              </div>

              {/* פרטי חוב */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">פרטי חוב</h3>
                
                <CurrencyField
                  value={form_data.debt_amount}
                  onChange={(value) => set_form_data({...form_data, debt_amount: value})}
                  label={get_text('debt_amount')}
                  required
                />

                <CurrencyField
                  value={form_data.paid_amount}
                  onChange={(value) => set_form_data({...form_data, paid_amount: value})}
                  label={get_text('paid_amount')}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {get_text('due_date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form_data.due_date}
                    onChange={(e) => set_form_data({...form_data, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {get_text('status')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form_data.status}
                    onChange={(e) => set_form_data({...form_data, status: e.target.value as DebtStatus})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                  >
                    <option value="פעיל">פעיל</option>
                    <option value="בטיפול">בטיפול</option>
                    <option value="מושהה">מושהה</option>
                    <option value="סגור">סגור</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {get_text('collection_agent')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form_data.collection_agent}
                    onChange={(e) => set_form_data({...form_data, collection_agent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                  >
                    <option value="">בחר נציג גביה</option>
                    {available_agents.map(agent => (
                      <option key={agent} value={agent}>{agent}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* הערות */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {get_text('notes')}
              </label>
              <textarea
                value={form_data.notes}
                onChange={(e) => set_form_data({...form_data, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                placeholder="הערות נוספות..."
              />
            </div>

            {/* כפתורי פעולה */}
            <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t">
              <button
                onClick={handle_cancel}
                className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {get_text('cancel')}
              </button>
              <button
                onClick={handle_save}
                className="px-6 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 transition-colors"
              >
                {get_text('save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;