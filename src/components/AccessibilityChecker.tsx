import React, { useState, useEffect } from 'react';
import { 
  run_accessibility_audit, 
  generate_accessibility_report, 
  auto_fix_accessibility_issues,
  AccessibilityCheck,
  AccessibilityIssue
} from '../utils/accessibility';

interface AccessibilityCheckerProps {
  auto_run?: boolean;
  show_details?: boolean;
  target_element?: HTMLElement;
}

const AccessibilityChecker: React.FC<AccessibilityCheckerProps> = ({
  auto_run = false,
  show_details = true,
  target_element
}) => {
  const [audit_result, set_audit_result] = useState<AccessibilityCheck | null>(null);
  const [is_running, set_is_running] = useState(false);
  const [auto_fixed, set_auto_fixed] = useState(0);

  // הרצת בדיקה אוטומטית
  useEffect(() => {
    if (auto_run) {
      run_audit();
    }
  }, [auto_run]);

  // פונקציה להרצת בדיקת נגישות
  const run_audit = () => {
    set_is_running(true);
    
    setTimeout(() => {
      const container = target_element || document.body;
      const result = run_accessibility_audit(container);
      set_audit_result(result);
      set_is_running(false);
    }, 100);
  };

  // פונקציה לתיקון אוטומטי
  const apply_auto_fixes = () => {
    if (!audit_result) return;
    
    const container = target_element || document.body;
    const fixes_count = auto_fix_accessibility_issues(container);
    set_auto_fixed(fixes_count);
    
    // הרצת בדיקה מחדש אחרי התיקון
    setTimeout(() => {
      run_audit();
    }, 200);
  };

  // קבלת צבע לפי ציון
  const get_score_color = (score: number): string => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // קבלת אייקון לפי סוג בעיה
  const get_issue_icon = (type: AccessibilityIssue['type']): string => {
    switch (type) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  // קבלת צבע לפי קטגוריה
  const get_category_color = (category: AccessibilityIssue['category']): string => {
    switch (category) {
      case 'rtl': return 'bg-blue-100 text-blue-800';
      case 'hebrew': return 'bg-purple-100 text-purple-800';
      case 'aria': return 'bg-green-100 text-green-800';
      case 'contrast': return 'bg-red-100 text-red-800';
      case 'keyboard': return 'bg-yellow-100 text-yellow-800';
      case 'semantic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // קיבוץ בעיות לפי קטגוריה
  const group_issues_by_category = (issues: AccessibilityIssue[]) => {
    return issues.reduce((groups, issue) => {
      const category = issue.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(issue);
      return groups;
    }, {} as Record<string, AccessibilityIssue[]>);
  };

  const category_names = {
    rtl: 'כיוון RTL',
    hebrew: 'תמיכה בעברית',
    aria: 'ARIA ונגישות',
    contrast: 'ניגודיות צבעים',
    keyboard: 'ניווט במקלדת',
    semantic: 'מבנה סמנטי'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">בודק נגישות עברית</h3>
        <div className="flex space-x-3 space-x-reverse">
          {audit_result && audit_result.issues.length > 0 && (
            <button
              onClick={apply_auto_fixes}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              תיקון אוטומטי
            </button>
          )}
          <button
            onClick={run_audit}
            disabled={is_running}
            className="px-4 py-2 bg-israeli-blue text-white rounded-md hover:bg-israeli-blue/90 disabled:opacity-50 transition-colors"
          >
            {is_running ? 'בודק...' : 'הרץ בדיקה'}
          </button>
        </div>
      </div>

      {/* הודעת תיקון אוטומטי */}
      {auto_fixed > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 text-sm">
            ✅ תוקנו {auto_fixed} בעיות נגישות באופן אוטומטי
          </p>
        </div>
      )}

      {/* תוצאות הבדיקה */}
      {audit_result && (
        <div className="space-y-6">
          {/* ציון כללי */}
          <div className="text-center">
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-lg font-bold ${get_score_color(audit_result.score)}`}>
              ציון נגישות: {audit_result.score}/100
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {audit_result.score >= 90 ? 'מעולה! האתר נגיש במלואו' :
               audit_result.score >= 70 ? 'טוב - יש כמה נקודות לשיפור' :
               audit_result.score >= 50 ? 'בינוני - נדרשים תיקונים' :
               'נמוך - נדרשים תיקונים דחופים'}
            </p>
          </div>

          {/* סיכום בעיות */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {audit_result.issues.filter(i => i.type === 'error').length}
              </div>
              <div className="text-sm text-red-700">שגיאות</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {audit_result.issues.filter(i => i.type === 'warning').length}
              </div>
              <div className="text-sm text-yellow-700">אזהרות</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {audit_result.issues.filter(i => i.type === 'info').length}
              </div>
              <div className="text-sm text-blue-700">מידע</div>
            </div>
          </div>

          {/* פירוט בעיות */}
          {show_details && audit_result.issues.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900">פירוט בעיות</h4>
              
              {Object.entries(group_issues_by_category(audit_result.issues)).map(([category, issues]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-gray-900">
                      {category_names[category as keyof typeof category_names] || category}
                    </h5>
                    <span className={`px-2 py-1 text-xs rounded-full ${get_category_color(category as AccessibilityIssue['category'])}`}>
                      {issues.length} בעיות
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {issues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-3 space-x-reverse p-3 bg-gray-50 rounded-md">
                        <span className="text-lg">{get_issue_icon(issue.type)}</span>
                        <div className="flex-1 text-right">
                          <p className="text-sm text-gray-900">{issue.message}</p>
                          {issue.fix_suggestion && (
                            <p className="text-xs text-gray-600 mt-1">
                              💡 <strong>פתרון:</strong> {issue.fix_suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* דוח טקסטואלי */}
          <div className="border-t pt-4">
            <details className="text-right">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                הצג דוח מפורט
              </summary>
              <pre className="mt-3 p-4 bg-gray-50 rounded-md text-xs text-gray-800 whitespace-pre-wrap font-mono" dir="rtl">
                {generate_accessibility_report(audit_result)}
              </pre>
            </details>
          </div>

          {/* המלצות כלליות */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h5 className="font-medium text-blue-900 mb-2">המלצות נוספות לנגישות עברית:</h5>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>ודא שכל הטקסט בעברית מיושר לימין</li>
              <li>השתמש בגופנים הנתמכים בעברית (כמו Heebo)</li>
              <li>בדוק שהניווט במקלדת פועל נכון בכיוון RTL</li>
              <li>ודא שכל התוכן נקרא נכון בקוראי מסך בעברית</li>
              <li>בדוק ניגודיות צבעים עבור כל רכיבי הממשק</li>
            </ul>
          </div>
        </div>
      )}

      {/* מצב ללא תוצאות */}
      {!audit_result && !is_running && (
        <div className="text-center py-8">
          <p className="text-gray-500">לחץ על "הרץ בדיקה" כדי לבדוק את נגישות האתר</p>
        </div>
      )}

      {/* מצב טעינה */}
      {is_running && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 space-x-reverse">
            <svg className="animate-spin h-5 w-5 text-israeli-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">בודק נגישות...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityChecker;