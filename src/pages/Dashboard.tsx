import React, { useState } from 'react';
import { get_text } from '../utils/localization';
import FileUpload from '../components/FileUpload';
import KPIDashboard from '../components/KPIDashboard';
import DebtAgingChart from '../components/DebtAgingChart';
import CollectionPerformanceChart from '../components/CollectionPerformanceChart';
import PerformanceDashboard from '../components/PerformanceDashboard';
import MobileTestingPanel from '../components/MobileTestingPanel';
import { ImportedData, FileUploadResult, DebtRecord } from '../types';
import { process_imported_data, auto_detect_column_mapping } from '../utils/dataProcessing';

const Dashboard: React.FC = () => {
  const [uploaded_data, set_uploaded_data] = useState<ImportedData | null>(null);
  const [upload_result, set_upload_result] = useState<FileUploadResult | null>(null);
  const [processed_records, set_processed_records] = useState<DebtRecord[]>([]);
  const [show_upload_modal, set_show_upload_modal] = useState(false);
  const [active_tab, set_active_tab] = useState<'overview' | 'aging' | 'performance'>('overview');

  const handle_file_uploaded = (data: ImportedData) => {
    set_uploaded_data(data);
    
    // עיבוד אוטומטי של הנתונים
    const column_mapping = auto_detect_column_mapping(data.headers);
    try {
      const processing_result = process_imported_data(data, column_mapping);
      
      if (processing_result.success) {
        // יצירת רשומות דמה לצורך הדגמה
        const sample_records: DebtRecord[] = data.rows.slice(0, 20).map((row, index) => ({
          customer_id: `CUS-${(index + 1).toString().padStart(3, '0')}`,
          customer_name: row[0] || `לקוח ${index + 1}`,
          id_number: `${200000000 + index}`,
          debt_amount: Math.floor(Math.random() * 50000) + 5000,
          paid_amount: Math.floor(Math.random() * 20000),
          remaining_debt: 0,
          due_date: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
          status: ['פעיל', 'סגור', 'בטיפול', 'מושהה'][Math.floor(Math.random() * 4)] as any,
          collection_agent: ['דני כהן', 'שרה לוי', 'משה ישראלי', 'רחל אברהם'][Math.floor(Math.random() * 4)],
          last_payment_date: Math.random() > 0.5 ? new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : undefined,
          phone: `05${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
          notes: Math.random() > 0.7 ? 'דורש מעקב' : '',
          created_at: new Date(),
          updated_at: new Date()
        }));
        
        // חישוב חוב נותר
        sample_records.forEach(record => {
          record.remaining_debt = record.debt_amount - record.paid_amount;
        });
        
        set_processed_records(sample_records);
      }
    } catch (error) {
      console.error('שגיאה בעיבוד הנתונים:', error);
    }
  };

  const handle_upload_result = (result: FileUploadResult) => {
    set_upload_result(result);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* כותרת ראשית */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center h-auto sm:h-16 py-4 sm:py-0">
            <div className="flex items-center space-x-4 space-x-reverse mb-4 sm:mb-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                {get_text('app_title')}
              </h1>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                גרסת פיתוח
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
              <button
                onClick={() => set_show_upload_modal(true)}
                className="w-full sm:w-auto bg-israeli-blue text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                {get_text('upload_file')}
              </button>
              
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* תפריט ניווט */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 space-x-reverse overflow-x-auto">
            <button className="py-2 px-1 border-b-2 border-israeli-blue text-israeli-blue font-medium text-sm whitespace-nowrap">
              {get_text('dashboard')}
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              {get_text('customers')}
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              {get_text('reports')}
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm whitespace-nowrap">
              {get_text('settings')}
            </button>
          </div>
        </div>
      </nav>

      {/* תפריט משני - רק אם יש נתונים */}
      {processed_records.length > 0 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-6 space-x-reverse overflow-x-auto">
              <button
                onClick={() => set_active_tab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  active_tab === 'overview' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                סקירה כללית
              </button>
              <button
                onClick={() => set_active_tab('aging')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  active_tab === 'aging' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                התיישנות חובות
              </button>
              <button
                onClick={() => set_active_tab('performance')}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  active_tab === 'performance' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ביצועי גביה
              </button>
            </div>
          </div>
        </div>
      )}

      {/* תוכן ראשי */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        
        {/* הודעות מערכת */}
        {upload_result && (
          <div className={`mb-4 lg:mb-6 p-4 rounded-md ${
            upload_result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${
                upload_result.success ? 'text-green-600' : 'text-red-600'
              }`}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  {upload_result.success ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
              </div>
              
              <div className="mr-3">
                <h3 className={`text-sm font-medium ${
                  upload_result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {upload_result.success ? get_text('success') : get_text('error')}
                </h3>
                
                {upload_result.success && (
                  <p className="text-sm text-green-700">
                    הקובץ הועלה בהצלחה עם {upload_result.records_count} רשומות
                  </p>
                )}

                {upload_result.errors.length > 0 && (
                  <ul className="text-sm text-red-700 mt-1">
                    {upload_result.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* ברוכים הבאים */}
        {!uploaded_data && (
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
              {get_text('welcome')}
            </h2>
            <p className="text-base lg:text-lg text-gray-600 mb-6 lg:mb-8 max-w-2xl mx-auto px-4">
              התחל בהעלאת קובץ נתוני חובות כדי לנהל את התיק שלך בצורה מקצועית ויעילה
            </p>
            
            <div className="bg-white rounded-lg shadow-sm p-4 lg:p-8 max-w-2xl mx-auto">
              <FileUpload
                on_file_uploaded={handle_file_uploaded}
                on_upload_result={handle_upload_result}
              />
            </div>
          </div>
        )}

        {/* תוכן לפי טאב נבחר */}
        {processed_records.length > 0 && (
          <div className="space-y-6 lg:space-y-8">
            {active_tab === 'overview' && (
              <>
                {/* KPI Dashboard */}
                <div className="mb-6 lg:mb-8">
                  <KPIDashboard debt_records={processed_records} />
                </div>

                {/* גרפים */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  <DebtAgingChart debt_records={processed_records} chart_type="bar" />
                  <CollectionPerformanceChart debt_records={processed_records} />
                </div>
              </>
            )}

            {active_tab === 'aging' && (
              <div className="space-y-6 lg:space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <DebtAgingChart debt_records={processed_records} chart_type="bar" />
                  <DebtAgingChart debt_records={processed_records} chart_type="pie" />
                </div>
                
                {/* טבלת חובות דחופים */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">חובות דחופים (מעל 90 ימים)</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">לקוח</th>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">חוב נותר</th>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">ימים</th>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נציג</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {processed_records
                          .filter(r => (new Date().getTime() - r.due_date.getTime()) / (1000 * 60 * 60 * 24) > 90)
                          .slice(0, 5)
                          .map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 lg:px-6 py-4 text-sm text-gray-900">{record.customer_name}</td>
                            <td className="px-4 lg:px-6 py-4 text-sm text-red-600 font-medium">₪{record.remaining_debt.toLocaleString('he-IL')}</td>
                            <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">
                              {Math.floor((new Date().getTime() - record.due_date.getTime()) / (1000 * 60 * 60 * 24))}
                            </td>
                            <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{record.collection_agent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {active_tab === 'performance' && (
              <div className="space-y-6 lg:space-y-8">
                <CollectionPerformanceChart debt_records={processed_records} />
                
                {/* טבלת ביצועי נציגים */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-4 lg:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">ביצועי נציגי גביה</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נציג</th>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיקים פעילים</th>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">נגבה החודש</th>
                          <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">אחוז הצלחה</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {[...new Set(processed_records.map(r => r.collection_agent))].map((agent, index) => {
                          const agent_records = processed_records.filter(r => r.collection_agent === agent);
                          const active_count = agent_records.filter(r => r.status === 'פעיל').length;
                          const collected = agent_records.reduce((sum, r) => sum + r.paid_amount, 0);
                          const success_rate = agent_records.length > 0 ? (agent_records.filter(r => r.status === 'סגור').length / agent_records.length) * 100 : 0;
                          
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900">{agent}</td>
                              <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{active_count}</td>
                              <td className="px-4 lg:px-6 py-4 text-sm text-green-600 font-medium">₪{collected.toLocaleString('he-IL')}</td>
                              <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{success_rate.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* לוח בקרת ביצועים */}
      <PerformanceDashboard />
      
      {/* פאנל בדיקות מובייל */}
      <MobileTestingPanel />

      {/* מודל העלאת קובץ */}
      {show_upload_modal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 lg:top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">{get_text('upload_file')}</h3>
              <button
                onClick={() => set_show_upload_modal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <FileUpload
              on_file_uploaded={(data) => {
                handle_file_uploaded(data);
                set_show_upload_modal(false);
              }}
              on_upload_result={handle_upload_result}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;