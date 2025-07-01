/**
 * לוח בקרת ביצועים
 * Performance monitoring dashboard
 */

import React, { useState, useEffect } from 'react';
import { use_performance_monitor, use_performance_warnings } from '../hooks/usePerformanceMonitor';

interface PerformanceMetric {
  operation: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  median: number;
  status: 'good' | 'warning' | 'critical';
}

const PerformanceDashboard: React.FC = () => {
  const { get_all_stats, clear_stats } = use_performance_monitor();
  const warnings = use_performance_warnings();
  const [metrics, set_metrics] = useState<PerformanceMetric[]>([]);
  const [is_visible, set_is_visible] = useState(false);
  
  // עדכון מטריקות כל 2 שניות
  useEffect(() => {
    const update_metrics = () => {
      const stats = get_all_stats();
      const new_metrics: PerformanceMetric[] = Object.entries(stats)
        .filter(([_, stat]) => stat && stat.count > 0)
        .map(([operation, stat]) => ({
          operation,
          ...stat,
          status: get_performance_status(stat.avg)
        }))
        .sort((a, b) => b.avg - a.avg); // מיון לפי ממוצע זמן
      
      set_metrics(new_metrics);
    };
    
    const interval = setInterval(update_metrics, 2000);
    update_metrics(); // עדכון ראשוני
    
    return () => clearInterval(interval);
  }, [get_all_stats]);
  
  // קביעת סטטוס ביצועים לפי זמן ממוצע
  const get_performance_status = (avg_time: number): 'good' | 'warning' | 'critical' => {
    if (avg_time < 50) return 'good';
    if (avg_time < 200) return 'warning';
    return 'critical';
  };
  
  // קבלת צבע לפי סטטוס
  const get_status_color = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };
  
  // פורמט זמן למיליסניות
  const format_time = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  // חישוב סיכום ביצועים
  const performance_summary = {
    total_operations: metrics.reduce((sum, m) => sum + m.count, 0),
    avg_response_time: metrics.length > 0 ? 
      metrics.reduce((sum, m) => sum + m.avg, 0) / metrics.length : 0,
    slow_operations: metrics.filter(m => m.status === 'critical').length,
    warning_operations: metrics.filter(m => m.status === 'warning').length
  };
  
  if (!is_visible) {
    return (
      <button
        onClick={() => set_is_visible(true)}
        className="fixed bottom-4 left-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="פתח לוח בקרת ביצועים"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="fixed bottom-4 left-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50" dir="rtl">
      {/* כותרת */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">לוח בקרת ביצועים</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => clear_stats()}
            className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-gray-600"
          >
            נקה
          </button>
          <button
            onClick={() => set_is_visible(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* סיכום */}
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {performance_summary.total_operations.toLocaleString()}
            </div>
            <div className="text-gray-600">פעולות</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {format_time(performance_summary.avg_response_time)}
            </div>
            <div className="text-gray-600">זמן ממוצע</div>
          </div>
        </div>
        
        {/* אזהרות */}
        {warnings.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <div className="font-medium text-yellow-800 mb-1">אזהרות ביצועים:</div>
            {warnings.map((warning, index) => (
              <div key={index} className="text-yellow-700">{warning}</div>
            ))}
          </div>
        )}
      </div>
      
      {/* רשימת מטריקות */}
      <div className="max-h-64 overflow-y-auto">
        {metrics.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            אין נתוני ביצועים זמינים
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {metrics.map((metric) => (
              <div key={metric.operation} className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {metric.operation}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${get_status_color(metric.status)}`}>
                    {metric.status === 'good' ? 'טוב' : 
                     metric.status === 'warning' ? 'אזהרה' : 'איטי'}
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>
                    <div className="font-medium">{metric.count}</div>
                    <div>קריאות</div>
                  </div>
                  <div>
                    <div className="font-medium">{format_time(metric.avg)}</div>
                    <div>ממוצע</div>
                  </div>
                  <div>
                    <div className="font-medium">{format_time(metric.min)}</div>
                    <div>מינימום</div>
                  </div>
                  <div>
                    <div className="font-medium">{format_time(metric.max)}</div>
                    <div>מקסימום</div>
                  </div>
                </div>
                
                {/* פס התקדמות יחסי */}
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full ${
                        metric.status === 'good' ? 'bg-green-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${Math.min(100, (metric.avg / 500) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* פוטר */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 text-center">
        עדכון אוטומטי כל 2 שניות
      </div>
    </div>
  );
};

export default PerformanceDashboard;