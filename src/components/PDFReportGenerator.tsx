import React, { useState, useRef } from 'react';
import { use_debt_context, use_debt_actions } from '../contexts/DebtContext';
import { DebtRecord, PDFReportData } from '../types';
import { get_text } from '../utils/localization';
import { format_israeli_currency, format_israeli_date, calculate_debt_age } from '../utils/formatting';

interface PDFReportGeneratorProps {
  selected_debts?: DebtRecord[];
  report_title?: string;
  include_charts?: boolean;
}

type ReportType = 'summary' | 'detailed' | 'aging' | 'performance' | 'custom';

const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({
  selected_debts,
  report_title = 'דוח גביית חובות'
}) => {
  const { state } = use_debt_context();
  const { add_message } = use_debt_actions();
  
  const [report_type, set_report_type] = useState<ReportType>('summary');
  const [is_generating, set_is_generating] = useState(false);
  const [include_logo, set_include_logo] = useState(true);
  const [include_summary, set_include_summary] = useState(true);
  const [include_details, set_include_details] = useState(true);
  const [include_aging_analysis, set_include_aging_analysis] = useState(true);
  const [company_name, set_company_name] = useState('חברת גביה ישראלית');
  const [report_notes, set_report_notes] = useState('');
  
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const print_ref = useRef<HTMLDivElement>(null);

  // קבלת נתונים לדוח
  const get_report_data = (): PDFReportData => {
    const debts = selected_debts || state.filtered_debts;
    
    const total_debt = debts.reduce((sum, debt) => sum + debt.remaining_debt, 0);
    const collected_amount = debts.reduce((sum, debt) => sum + debt.paid_amount, 0);
    const collection_rate = total_debt > 0 ? (collected_amount / (total_debt + collected_amount)) * 100 : 0;
    const total_customers = debts.length;
    const active_debts = debts.filter(debt => debt.status === 'פעיל').length;
    
    // ניתוח התיישנות
    const aging_analysis = {
      current: 0,
      thirty_to_sixty: 0,
      sixty_to_ninety: 0,
      over_ninety: 0
    };
    
    debts.forEach(debt => {
      const age = calculate_debt_age(debt.due_date);
      if (age <= 30) aging_analysis.current += debt.remaining_debt;
      else if (age <= 60) aging_analysis.thirty_to_sixty += debt.remaining_debt;
      else if (age <= 90) aging_analysis.sixty_to_ninety += debt.remaining_debt;
      else aging_analysis.over_ninety += debt.remaining_debt;
    });

    return {
      title: report_title,
      generated_at: new Date(),
      filters: state.filters,
      summary: {
        total_debt,
        collected_amount,
        collection_rate,
        total_customers,
        active_debts,
        aging_analysis
      },
      records: debts
    };
  };

  // יצירת HTML לדוח
  const generate_report_html = (data: PDFReportData): string => {
    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap');
        
        body {
          font-family: 'Heebo', Arial, sans-serif;
          direction: rtl;
          margin: 0;
          padding: 20px;
          color: #1f2937;
          line-height: 1.6;
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        
        .company-name {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 10px;
        }
        
        .report-title {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 10px;
        }
        
        .report-date {
          font-size: 14px;
          color: #6b7280;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin: 30px 0;
        }
        
        .summary-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        
        .summary-value {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          margin-bottom: 5px;
        }
        
        .summary-label {
          font-size: 14px;
          color: #6b7280;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin: 30px 0 15px 0;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .aging-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        
        .aging-item {
          background: #fff;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #d1d5db;
          text-align: center;
        }
        
        .aging-amount {
          font-size: 18px;
          font-weight: 600;
          color: #dc2626;
          margin-bottom: 5px;
        }
        
        .aging-label {
          font-size: 12px;
          color: #6b7280;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }
        
        .table th,
        .table td {
          border: 1px solid #d1d5db;
          padding: 8px;
          text-align: right;
        }
        
        .table th {
          background: #f3f4f6;
          font-weight: 600;
        }
        
        .table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .status-active { color: #dc2626; }
        .status-closed { color: #059669; }
        .status-processing { color: #d97706; }
        .status-suspended { color: #6b7280; }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        
        @media print {
          body { margin: 0; }
          .summary-grid { grid-template-columns: repeat(2, 1fr); }
          .aging-grid { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    `;

    const header = `
      <div class="header">
        ${include_logo ? `<div class="company-name">${company_name}</div>` : ''}
        <div class="report-title">${data.title}</div>
        <div class="report-date">נוצר בתאריך: ${format_israeli_date(data.generated_at)}</div>
      </div>
    `;

    const summary = include_summary ? `
      <div class="section-title">סיכום כללי</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-value">${format_israeli_currency(data.summary.total_debt)}</div>
          <div class="summary-label">סה"כ חוב פתוח</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${format_israeli_currency(data.summary.collected_amount)}</div>
          <div class="summary-label">סכום נגבה</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${data.summary.collection_rate.toFixed(1)}%</div>
          <div class="summary-label">אחוז גביה</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">${data.summary.total_customers}</div>
          <div class="summary-label">סה"כ לקוחות</div>
        </div>
      </div>
    ` : '';

    const aging = include_aging_analysis ? `
      <div class="section-title">ניתוח התיישנות חובות</div>
      <div class="aging-grid">
        <div class="aging-item">
          <div class="aging-amount">${format_israeli_currency(data.summary.aging_analysis.current)}</div>
          <div class="aging-label">עד 30 ימים</div>
        </div>
        <div class="aging-item">
          <div class="aging-amount">${format_israeli_currency(data.summary.aging_analysis.thirty_to_sixty)}</div>
          <div class="aging-label">31-60 ימים</div>
        </div>
        <div class="aging-item">
          <div class="aging-amount">${format_israeli_currency(data.summary.aging_analysis.sixty_to_ninety)}</div>
          <div class="aging-label">61-90 ימים</div>
        </div>
        <div class="aging-item">
          <div class="aging-amount">${format_israeli_currency(data.summary.aging_analysis.over_ninety)}</div>
          <div class="aging-label">מעל 90 ימים</div>
        </div>
      </div>
    ` : '';

    const details = include_details && data.records.length > 0 ? `
      <div class="section-title">פירוט חובות</div>
      <table class="table">
        <thead>
          <tr>
            <th>שם לקוח</th>
            <th>ת.ז.</th>
            <th>סכום חוב</th>
            <th>תאריך פירעון</th>
            <th>סטטוס</th>
            <th>נציג גביה</th>
          </tr>
        </thead>
        <tbody>
          ${data.records.slice(0, 50).map(debt => `
            <tr>
              <td>${debt.customer_name}</td>
              <td>${debt.id_number}</td>
              <td>${format_israeli_currency(debt.remaining_debt)}</td>
              <td>${format_israeli_date(debt.due_date)}</td>
              <td class="status-${debt.status === 'פעיל' ? 'active' : debt.status === 'סגור' ? 'closed' : debt.status === 'בטיפול' ? 'processing' : 'suspended'}">${debt.status}</td>
              <td>${debt.collection_agent}</td>
            </tr>
          `).join('')}
          ${data.records.length > 50 ? '<tr><td colspan="6" style="text-align: center; font-style: italic;">...ועוד ' + (data.records.length - 50) + ' רשומות</td></tr>' : ''}
        </tbody>
      </table>
    ` : '';

    const notes = report_notes ? `
      <div class="section-title">הערות</div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
        ${report_notes.replace(/\n/g, '<br>')}
      </div>
    ` : '';

    const footer = `
      <div class="footer">
        דוח זה נוצר באמצעות מערכת ניהול חובות • ${format_israeli_date(new Date())}
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title}</title>
        ${styles}
      </head>
      <body>
        ${header}
        ${summary}
        ${aging}
        ${details}
        ${notes}
        ${footer}
      </body>
      </html>
    `;
  };

  // יצירת דוח PDF
  const generate_pdf = async () => {
    set_is_generating(true);
    
    try {
      const report_data = get_report_data();
      const html_content = generate_report_html(report_data);
      
      // פתיחת חלון חדש להדפסה
      const print_window = window.open('', '_blank');
      if (!print_window) {
        throw new Error('לא ניתן לפתוח חלון הדפסה');
      }
      
      print_window.document.write(html_content);
      print_window.document.close();
      
      // המתנה לטעינת הגופנים וה-CSS
      setTimeout(() => {
        print_window.focus();
        print_window.print();
        
        // סגירת החלון לאחר ההדפסה
        print_window.addEventListener('afterprint', () => {
          print_window.close();
        });
      }, 1000);

      add_message({
        id: `pdf_${Date.now()}`,
        type: 'success',
        title: get_text('success'),
        message: 'דוח PDF נוצר בהצלחה',
        timestamp: new Date(),
        auto_dismiss: true
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      add_message({
        id: `pdf_error_${Date.now()}`,
        type: 'error',
        title: get_text('error'),
        message: 'שגיאה ביצירת דוח PDF',
        timestamp: new Date(),
        auto_dismiss: true
      });
    } finally {
      set_is_generating(false);
    }
  };

  // ייצוא כ-HTML
  const export_html = () => {
    const report_data = get_report_data();
    const html_content = generate_report_html(report_data);
    
    const blob = new Blob([html_content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `דוח_${format_israeli_date(new Date()).replace(/\//g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // תצוגה מקדימה
  const preview_report = () => {
    const report_data = get_report_data();
    const html_content = generate_report_html(report_data);
    
    const preview_window = window.open('', '_blank');
    if (preview_window) {
      preview_window.document.write(html_content);
      preview_window.document.close();
    }
  };

  const report_data = get_report_data();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">יצירת דוח PDF</h3>
        <div className="text-sm text-gray-600">
          {report_data.records.length} רשומות
        </div>
      </div>

      <div className="space-y-6">
        {/* הגדרות כלליות */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">הגדרות כלליות</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג דוח
              </label>
              <select
                value={report_type}
                onChange={(e) => set_report_type(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
              >
                <option value="summary">דוח סיכום</option>
                <option value="detailed">דוח מפורט</option>
                <option value="aging">דוח התיישנות</option>
                <option value="performance">דוח ביצועים</option>
                <option value="custom">דוח מותאם</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם החברה
              </label>
              <input
                type="text"
                value={company_name}
                onChange={(e) => set_company_name(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
                placeholder="שם החברה"
              />
            </div>
          </div>
        </div>

        {/* אפשרויות תוכן */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">תוכן הדוח</h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                checked={include_logo}
                onChange={(e) => set_include_logo(e.target.checked)}
                className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">כלול לוגו וכותרת חברה</span>
            </label>

            <label className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                checked={include_summary}
                onChange={(e) => set_include_summary(e.target.checked)}
                className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">כלול סיכום כללי</span>
            </label>

            <label className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                checked={include_aging_analysis}
                onChange={(e) => set_include_aging_analysis(e.target.checked)}
                className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">כלול ניתוח התיישנות חובות</span>
            </label>

            <label className="flex items-center space-x-3 space-x-reverse">
              <input
                type="checkbox"
                checked={include_details}
                onChange={(e) => set_include_details(e.target.checked)}
                className="rounded border-gray-300 text-israeli-blue focus:ring-israeli-blue"
              />
              <span className="text-sm text-gray-700">כלול פירוט רשומות (עד 50 ראשונות)</span>
            </label>
          </div>
        </div>

        {/* הערות */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            הערות נוספות
          </label>
          <textarea
            value={report_notes}
            onChange={(e) => set_report_notes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue text-right"
            placeholder="הערות שיוכללו בדוח..."
          />
        </div>

        {/* סיכום מהיר */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">תצוגה מקדימה</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">חובות כוללים:</span>
              <div className="font-medium">{format_israeli_currency(report_data.summary.total_debt)}</div>
            </div>
            <div>
              <span className="text-gray-600">סכום נגבה:</span>
              <div className="font-medium">{format_israeli_currency(report_data.summary.collected_amount)}</div>
            </div>
            <div>
              <span className="text-gray-600">אחוז גביה:</span>
              <div className="font-medium">{report_data.summary.collection_rate.toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-gray-600">מספר לקוחות:</span>
              <div className="font-medium">{report_data.summary.total_customers}</div>
            </div>
          </div>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
          <button
            onClick={preview_report}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            תצוגה מקדימה
          </button>
          
          <button
            onClick={export_html}
            className="px-4 py-2 text-israeli-blue border border-israeli-blue rounded-md hover:bg-israeli-blue/10 transition-colors"
          >
            ייצא כ-HTML
          </button>
          
          <button
            onClick={generate_pdf}
            disabled={is_generating}
            className="px-6 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 space-x-reverse"
          >
            {is_generating && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {is_generating ? 'יוצר דוח...' : 'צור דוח PDF'}
            </span>
          </button>
        </div>
      </div>

      {/* Canvas נסתר לעבודה עם גרפיקה */}
      <canvas ref={canvas_ref} style={{ display: 'none' }} />
      
      {/* Div נסתר להדפסה */}
      <div ref={print_ref} style={{ display: 'none' }} />
    </div>
  );
};

export default PDFReportGenerator;