import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { DebtRecord, DebtAging } from '../types';
import { 
  calculate_debt_age, 
  format_israeli_currency, 
  format_israeli_number 
} from '../utils/formatting';
import { get_text } from '../utils/localization';

interface DebtAgingChartProps {
  debt_records: DebtRecord[];
  chart_type?: 'bar' | 'pie';
}

const DebtAgingChart: React.FC<DebtAgingChartProps> = ({ 
  debt_records, 
  chart_type = 'bar' 
}) => {
  
  // חישוב נתוני התיישנות חובות
  const calculate_aging_data = (): DebtAging & { chart_data: any[] } => {
    const aging: DebtAging = {
      current: 0,
      thirty_to_sixty: 0,
      sixty_to_ninety: 0,
      over_ninety: 0
    };

    const amounts = {
      current: 0,
      thirty_to_sixty: 0,
      sixty_to_ninety: 0,
      over_ninety: 0
    };

    debt_records.forEach(record => {
      if (record.status === 'סגור') return; // לא כולל חובות סגורים
      
      const age = calculate_debt_age(record.due_date);
      const amount = record.remaining_debt;
      
      if (age <= 30) {
        aging.current++;
        amounts.current += amount;
      } else if (age <= 60) {
        aging.thirty_to_sixty++;
        amounts.thirty_to_sixty += amount;
      } else if (age <= 90) {
        aging.sixty_to_ninety++;
        amounts.sixty_to_ninety += amount;
      } else {
        aging.over_ninety++;
        amounts.over_ninety += amount;
      }
    });

    const chart_data = [
      {
        category: 'עד 30 ימים',
        count: aging.current,
        amount: amounts.current,
        color: '#22c55e', // ירוק
        percentage: debt_records.length > 0 ? (aging.current / debt_records.length) * 100 : 0
      },
      {
        category: '31-60 ימים',
        count: aging.thirty_to_sixty,
        amount: amounts.thirty_to_sixty,
        color: '#eab308', // צהוב
        percentage: debt_records.length > 0 ? (aging.thirty_to_sixty / debt_records.length) * 100 : 0
      },
      {
        category: '61-90 ימים',
        count: aging.sixty_to_ninety,
        amount: amounts.sixty_to_ninety,
        color: '#f97316', // כתום
        percentage: debt_records.length > 0 ? (aging.sixty_to_ninety / debt_records.length) * 100 : 0
      },
      {
        category: 'מעל 90 ימים',
        count: aging.over_ninety,
        amount: amounts.over_ninety,
        color: '#ef4444', // אדום
        percentage: debt_records.length > 0 ? (aging.over_ninety / debt_records.length) * 100 : 0
      }
    ];

    return { ...aging, chart_data };
  };

  // Tooltip מותאם לעברית
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              <span className="font-medium">מספר חובות:</span> {format_israeli_number(data.count)}
            </p>
            <p className="text-green-600">
              <span className="font-medium">סכום כולל:</span> {format_israeli_currency(data.amount)}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">אחוז:</span> {data.percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Legend מותאם לעברית
  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={index} className="flex items-center">
            <span 
              className="w-3 h-3 rounded-full ml-2"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="text-sm text-gray-700">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  const aging_data = calculate_aging_data();

  if (!debt_records || debt_records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {get_text('aging_report')}
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600">{get_text('no_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {get_text('aging_report')}
        </h3>
        <div className="text-sm text-gray-600">
          סה"כ חובות פעילים: {format_israeli_number(debt_records.filter(r => r.status !== 'סגור').length)}
        </div>
      </div>

      {chart_type === 'bar' ? (
        // תרשים עמודות
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aging_data.chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => format_israeli_number(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // תרשים עוגה
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={aging_data.chart_data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="count"
                label={({ percentage }) => `${percentage.toFixed(1)}%`}
                labelLine={false}
              >
                {aging_data.chart_data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* סיכום מספרי */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {aging_data.chart_data.map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
            <div 
              className="w-4 h-4 rounded-full mx-auto mb-2"
              style={{ backgroundColor: item.color }}
            ></div>
            <p className="text-xs text-gray-600 mb-1">{item.category}</p>
            <p className="text-sm font-semibold text-gray-900">
              {format_israeli_number(item.count)} חובות
            </p>
            <p className="text-xs text-gray-600">
              {format_israeli_currency(item.amount)}
            </p>
          </div>
        ))}
      </div>

      {/* התראות */}
      {aging_data.over_ninety > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-red-800">
                קיימים {format_israeli_number(aging_data.over_ninety)} חובות דחופים מעל 90 ימים
              </p>
              <p className="text-red-700">
                דורש טיפול מיידי וראשיפות גבוהה
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtAgingChart;