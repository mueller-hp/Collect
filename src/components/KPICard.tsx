import React from 'react';
import { KPIData } from '../types';
import { format_israeli_currency, format_israeli_number, format_percentage } from '../utils/formatting';

interface KPICardProps {
  kpi: KPIData;
  icon?: React.ReactNode;
  color_scheme?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

const KPICard: React.FC<KPICardProps> = ({ 
  kpi, 
  icon,
  color_scheme = 'blue' 
}) => {
  
  // עיצוב הערך בהתאם לפורמט
  const format_value = (value: number | string, format?: string): string => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'currency':
        return format_israeli_currency(value);
      case 'percentage':
        return format_percentage(value);
      case 'number':
        return format_israeli_number(value);
      default:
        return typeof value === 'number' ? format_israeli_number(value) : String(value);
    }
  };

  // קבלת צבעים בהתאם לסכמת הצבעים
  const get_color_classes = (scheme: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        icon: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        icon: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-600',
        icon: 'text-yellow-600'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: 'text-red-600'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        icon: 'text-purple-600'
      },
      gray: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        icon: 'text-gray-600'
      }
    };
    
    return colors[scheme as keyof typeof colors] || colors.blue;
  };

  // קבלת אייקון מגמה
  const get_trend_icon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const colors = get_color_classes(color_scheme);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        
        {/* אייקון */}
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className={`w-10 h-10 ${colors.bg} rounded-md flex items-center justify-center`}>
              <div className={`w-6 h-6 ${colors.icon}`}>
                {icon}
              </div>
            </div>
          </div>
        )}

        {/* תוכן */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">
              {kpi.title}
            </p>
            
            {/* מגמה */}
            {kpi.trend && (
              <div className="flex items-center space-x-1 space-x-reverse">
                {get_trend_icon(kpi.trend)}
                {kpi.change !== undefined && (
                  <span className={`text-xs font-medium ${
                    kpi.trend === 'up' ? 'text-green-600' : 
                    kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {kpi.change > 0 ? '+' : ''}{format_percentage(kpi.change, 1)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* הערך הראשי */}
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {format_value(kpi.value, kpi.format)}
          </p>

          {/* מידע נוסף */}
          {kpi.change !== undefined && !kpi.trend && (
            <p className={`text-sm mt-1 ${
              kpi.change > 0 ? 'text-green-600' : 
              kpi.change < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {kpi.change > 0 ? '+' : ''}{format_percentage(kpi.change, 1)} מהחודש הקודם
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;