/**
 * פאנל בדיקות רספונסיביות ומובייל
 * Mobile and responsive testing panel
 */

import React, { useState, useEffect } from 'react';
import { 
  detect_device, 
  get_current_breakpoint, 
  run_mobile_audit, 
  generate_mobile_report,
  BREAKPOINTS 
} from '../utils/mobileUtils';

interface ViewportSize {
  width: number;
  height: number;
  name: string;
}

// גדלי מסך נפוצים לבדיקה
const COMMON_VIEWPORT_SIZES: ViewportSize[] = [
  { width: 375, height: 667, name: 'iPhone SE' },
  { width: 390, height: 844, name: 'iPhone 12' },
  { width: 428, height: 926, name: 'iPhone 12 Pro Max' },
  { width: 360, height: 640, name: 'Android Small' },
  { width: 412, height: 915, name: 'Android Large' },
  { width: 768, height: 1024, name: 'iPad Portrait' },
  { width: 1024, height: 768, name: 'iPad Landscape' },
  { width: 1920, height: 1080, name: 'Desktop Full HD' }
];

const MobileTestingPanel: React.FC = () => {
  const [is_open, set_is_open] = useState(false);
  const [current_device, set_current_device] = useState(detect_device());
  const [current_breakpoint, set_current_breakpoint] = useState(get_current_breakpoint());
  const [audit_results, set_audit_results] = useState<any>(null);
  const [is_testing_mode, set_is_testing_mode] = useState(false);
  const [selected_viewport, set_selected_viewport] = useState<ViewportSize | null>(null);
  
  // עדכון מידע מכשיר בשינוי גודל חלון
  useEffect(() => {
    const handle_resize = () => {
      set_current_device(detect_device());
      set_current_breakpoint(get_current_breakpoint());
    };
    
    window.addEventListener('resize', handle_resize);
    return () => window.removeEventListener('resize', handle_resize);
  }, []);
  
  // הרצת בדיקת מובייל
  const run_audit = () => {
    const results = run_mobile_audit();
    set_audit_results(results);
  };
  
  // שימולציית גודל מסך
  const simulate_viewport = (viewport: ViewportSize) => {
    if (is_testing_mode) {
      // ביטול מצב בדיקה
      document.body.style.maxWidth = '';
      document.body.style.margin = '';
      document.body.style.border = '';
      document.body.style.boxShadow = '';
      set_is_testing_mode(false);
      set_selected_viewport(null);
    } else {
      // הפעלת מצב בדיקה
      document.body.style.maxWidth = `${viewport.width}px`;
      document.body.style.margin = '20px auto';
      document.body.style.border = '1px solid #ddd';
      document.body.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
      set_is_testing_mode(true);
      set_selected_viewport(viewport);
    }
  };
  
  // קבלת צבע לפי ברייקפוינט
  const get_breakpoint_color = (bp: string) => {
    switch (bp) {
      case 'xs': return 'bg-red-100 text-red-800';
      case 'sm': return 'bg-orange-100 text-orange-800';
      case 'md': return 'bg-yellow-100 text-yellow-800';
      case 'lg': return 'bg-green-100 text-green-800';
      case 'xl': return 'bg-blue-100 text-blue-800';
      case '2xl': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // קבלת אייקון מכשיר
  const get_device_icon = () => {
    if (current_device.is_mobile) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 10a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (current_device.is_tablet) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm4 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5a1 1 0 00-1 1v1a1 1 0 001 1h6a1 1 0 001-1v-1a1 1 0 00-1-1H8.771z" clipRule="evenodd" />
      </svg>
    );
  };
  
  if (!is_open) {
    return (
      <button
        onClick={() => set_is_open(true)}
        className="fixed bottom-20 left-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        title="פתח פאנל בדיקות מובייל"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 10a1 1 0 100 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-20 left-4 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto" dir="rtl">
      {/* כותרת */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">בדיקות רספונסיביות</h3>
        <button
          onClick={() => set_is_open(false)}
          className="text-gray-400 hover:text-gray-600 p-1"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {/* מידע מכשיר נוכחי */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">מכשיר נוכחי:</span>
          <div className="flex items-center space-x-2 space-x-reverse">
            {get_device_icon()}
            <span className="text-sm text-gray-600">
              {current_device.width} × {current_device.height}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">ברייקפוינט:</span>
          <span className={`px-2 py-1 text-xs rounded-full ${get_breakpoint_color(current_breakpoint)}`}>
            {current_breakpoint}
          </span>
        </div>
        
        {is_testing_mode && selected_viewport && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
            <div className="flex items-center justify-between">
              <span className="text-blue-800">שימולציה:</span>
              <span className="text-blue-600 font-medium">{selected_viewport.name}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* שימולציית גדלי מסך */}
      <div className="p-4 border-b border-gray-100">
        <h4 className="text-sm font-medium text-gray-900 mb-3">שימולציית מכשירים</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {COMMON_VIEWPORT_SIZES.map((viewport) => (
            <button
              key={viewport.name}
              onClick={() => simulate_viewport(viewport)}
              className={`w-full text-right p-2 text-xs rounded hover:bg-gray-50 border ${
                selected_viewport?.name === viewport.name 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{viewport.name}</span>
                <span className="text-gray-500">{viewport.width} × {viewport.height}</span>
              </div>
            </button>
          ))}
        </div>
        
        {is_testing_mode && (
          <button
            onClick={() => simulate_viewport(selected_viewport!)}
            className="w-full mt-2 p-2 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            סיים שימולציה
          </button>
        )}
      </div>
      
      {/* בדיקת נגישות מובייל */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">בדיקת נגישות</h4>
          <button
            onClick={run_audit}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            הרץ בדיקה
          </button>
        </div>
        
        {audit_results && (
          <div className="space-y-2">
            {audit_results.applicable === false ? (
              <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                {audit_results.message}
              </div>
            ) : (
              <>
                {/* סיכום תוצאות */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <div className="font-medium text-gray-900">
                      {audit_results.content_overflow.length}
                    </div>
                    <div className="text-gray-600">overflow</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <div className="font-medium text-gray-900">
                      {audit_results.button_issues.length}
                    </div>
                    <div className="text-gray-600">כפתורים</div>
                  </div>
                </div>
                
                {/* אזהרות */}
                {audit_results.horizontal_scroll && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <span className="text-red-800">⚠️ גלילה אופקית זוהתה</span>
                  </div>
                )}
                
                {audit_results.touch_spacing.length > 0 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <span className="text-yellow-800">
                      ⚠️ {audit_results.touch_spacing.length} בעיות מרווח
                    </span>
                  </div>
                )}
                
                {/* דוח מפורט */}
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900 font-medium">
                    דוח מפורט
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs whitespace-pre-wrap font-mono overflow-auto max-h-32">
                    {generate_mobile_report(audit_results)}
                  </pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTestingPanel;