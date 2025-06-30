import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { DebtRecord } from '../types';
import { 
  format_israeli_currency, 
  format_israeli_number, 
  format_percentage,
  calculate_collection_rate
} from '../utils/formatting';
import { get_text } from '../utils/localization';

interface CollectionPerformanceChartProps {
  debt_records: DebtRecord[];
}

type ChartType = 'monthly_trend' | 'agent_performance' | 'collection_rate';
type TimeRange = '3_months' | '6_months' | '12_months';

const CollectionPerformanceChart: React.FC<CollectionPerformanceChartProps> = ({ 
  debt_records 
}) => {
  const [chart_type, set_chart_type] = useState<ChartType>('monthly_trend');
  const [time_range, set_time_range] = useState<TimeRange>('6_months');

  // חישוב נתוני ביצועים חודשיים
  const calculate_monthly_trends = () => {
    const months_count = time_range === '3_months' ? 3 : time_range === '6_months' ? 6 : 12;
    const monthly_data = [];
    
    for (let i = months_count - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const month_name = date.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' });
      // const month_key = `${date.getFullYear()}-${date.getMonth()}`;
      
      // פילטר תשלומים לחודש הנוכחי
      const month_payments = debt_records.filter(record => {
        if (!record.last_payment_date) return false;
        const payment_date = new Date(record.last_payment_date);
        return payment_date.getFullYear() === date.getFullYear() && 
               payment_date.getMonth() === date.getMonth();
      });

      const total_collected = month_payments.reduce((sum, record) => sum + record.paid_amount, 0);
      const total_debt = debt_records.reduce((sum, record) => sum + record.debt_amount, 0);
      const collection_rate = calculate_collection_rate(total_debt, total_collected);

      monthly_data.push({
        month: month_name,
        collected: total_collected,
        target: total_collected * 1.2, // יעד של 120% מהגביה הפועלת
        rate: collection_rate,
        payments_count: month_payments.length
      });
    }
    
    return monthly_data;
  };

  // חישוב ביצועי נציגים
  const calculate_agent_performance = () => {
    const agents = [...new Set(debt_records.map(r => r.collection_agent).filter(Boolean))];
    
    return agents.map(agent => {
      const agent_records = debt_records.filter(r => r.collection_agent === agent);
      const total_debt = agent_records.reduce((sum, r) => sum + r.debt_amount, 0);
      const collected = agent_records.reduce((sum, r) => sum + r.paid_amount, 0);
      const active_cases = agent_records.filter(r => r.status === 'פעיל').length;
      const closed_cases = agent_records.filter(r => r.status === 'סגור').length;
      
      return {
        agent: agent || 'לא משויך',
        collected,
        total_debt,
        rate: calculate_collection_rate(total_debt, collected),
        active_cases,
        closed_cases,
        avg_debt: agent_records.length > 0 ? total_debt / agent_records.length : 0
      };
    }).sort((a, b) => b.collected - a.collected);
  };

  // חישוב מגמות אחוז גביה
  const calculate_collection_rate_trends = () => {
    const weeks_count = 12; // 12 שבועות אחרונים
    const weekly_data = [];
    
    for (let i = weeks_count - 1; i >= 0; i--) {
      const week_start = new Date();
      week_start.setDate(week_start.getDate() - (i * 7));
      const week_end = new Date(week_start);
      week_end.setDate(week_end.getDate() + 6);
      
      const week_label = `שבוע ${week_start.getDate()}/${week_start.getMonth() + 1}`;
      
      const week_payments = debt_records.filter(record => {
        if (!record.last_payment_date) return false;
        const payment_date = new Date(record.last_payment_date);
        return payment_date >= week_start && payment_date <= week_end;
      });

      const collected = week_payments.reduce((sum, record) => sum + record.paid_amount, 0);
      const total_debt = debt_records.reduce((sum, record) => sum + record.debt_amount, 0);
      
      weekly_data.push({
        week: week_label,
        rate: calculate_collection_rate(total_debt, collected),
        collected,
        target_rate: 75 // יעד של 75% גביה
      });
    }
    
    return weekly_data;
  };

  // Tooltip מותאם לעברית
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((item: any, index: number) => (
              <p key={index} style={{ color: item.color }}>
                <span className="font-medium">{item.name}:</span> {
                  typeof item.value === 'number' && item.name.includes('אחוז') || item.name.includes('rate') 
                    ? format_percentage(item.value)
                    : typeof item.value === 'number' && item.value > 1000
                    ? format_israeli_currency(item.value)
                    : format_israeli_number(item.value)
                }
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const get_chart_data = () => {
    switch (chart_type) {
      case 'monthly_trend': return calculate_monthly_trends();
      case 'agent_performance': return calculate_agent_performance();
      case 'collection_rate': return calculate_collection_rate_trends();
      default: return [];
    }
  };

  const chart_data = get_chart_data();

  if (!debt_records || debt_records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {get_text('collection_performance')}
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600">{get_text('no_data')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* כותרת ובקרות */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-0">
          {get_text('collection_performance')}
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* בחירת סוג תרשים */}
          <select
            value={chart_type}
            onChange={(e) => set_chart_type(e.target.value as ChartType)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-israeli-blue focus:border-israeli-blue"
          >
            <option value="monthly_trend">מגמות חודשיות</option>
            <option value="agent_performance">ביצועי נציגים</option>
            <option value="collection_rate">אחוז גביה שבועי</option>
          </select>

          {/* בחירת טווח זמן */}
          {chart_type === 'monthly_trend' && (
            <select
              value={time_range}
              onChange={(e) => set_time_range(e.target.value as TimeRange)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-israeli-blue focus:border-israeli-blue"
            >
              <option value="3_months">3 חודשים</option>
              <option value="6_months">6 חודשים</option>
              <option value="12_months">שנה</option>
            </select>
          )}
        </div>
      </div>

      {/* התרשים */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {chart_type === 'monthly_trend' ? (
            <AreaChart data={chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => format_israeli_currency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="collected"
                stroke="#3b82f6"
                fill="url(#collectedGradient)"
                name="נגבה"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#ef4444"
                strokeDasharray="5 5"
                name="יעד"
              />
            </AreaChart>
          ) : chart_type === 'agent_performance' ? (
            <BarChart data={chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="agent" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => format_israeli_currency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="collected" 
                fill="#22c55e"
                name="סכום נגבה"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <LineChart data={chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                axisLine={{ stroke: '#e0e0e0' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#3b82f6"
                strokeWidth={3}
                name="אחוז גביה"
              />
              <Line
                type="monotone"
                dataKey="target_rate"
                stroke="#ef4444"
                strokeDasharray="5 5"
                name="יעד"
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* סיכום ביצועים */}
      {chart_type === 'agent_performance' && chart_data.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">נציג מוביל השבוע</h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">
                  {(chart_data[0] as any).agent || 'נציג מוביל'}
                </p>
                <p className="text-sm text-green-700">
                  נגבה {format_israeli_currency(chart_data[0].collected)} • 
                  אחוז גביה: {format_percentage(chart_data[0].rate)}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-green-700">
                  תיקים פעילים: {format_israeli_number((chart_data[0] as any).active_cases || 0)}
                </p>
                <p className="text-sm text-green-700">
                  תיקים סגורים: {format_israeli_number((chart_data[0] as any).closed_cases || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* מטריקות נוספות */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-600 mb-1">סה"כ נגבה החודש</p>
          <p className="text-lg font-bold text-blue-900">
            {format_israeli_currency(
              debt_records
                .filter(r => r.last_payment_date && new Date(r.last_payment_date).getMonth() === new Date().getMonth())
                .reduce((sum, r) => sum + r.paid_amount, 0)
            )}
          </p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-xs text-green-600 mb-1">אחוז גביה כללי</p>
          <p className="text-lg font-bold text-green-900">
            {format_percentage(
              calculate_collection_rate(
                debt_records.reduce((sum, r) => sum + r.debt_amount, 0),
                debt_records.reduce((sum, r) => sum + r.paid_amount, 0)
              )
            )}
          </p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <p className="text-xs text-yellow-600 mb-1">ממוצע יומי</p>
          <p className="text-lg font-bold text-yellow-900">
            {format_israeli_currency(
              debt_records.reduce((sum, r) => sum + r.paid_amount, 0) / 30
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CollectionPerformanceChart;