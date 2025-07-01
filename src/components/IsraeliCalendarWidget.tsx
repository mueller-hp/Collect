import React, { useState, useEffect } from 'react';
import { 
  get_upcoming_holidays, 
  get_day_info, 
  get_contact_time_recommendations,
  calculate_recommended_payment_date,
  count_business_days,
  BusinessDay,
  IsraeliHoliday 
} from '../utils/israeliCalendar';
import { format_israeli_date } from '../utils/formatting';

interface IsraeliCalendarWidgetProps {
  show_upcoming_holidays?: boolean;
  show_business_days_calculator?: boolean;
  show_payment_recommendations?: boolean;
  compact_mode?: boolean;
}

const IsraeliCalendarWidget: React.FC<IsraeliCalendarWidgetProps> = ({
  show_upcoming_holidays = true,
  show_business_days_calculator = true,
  show_payment_recommendations = true,
  compact_mode = false
}) => {
  const [upcoming_holidays, set_upcoming_holidays] = useState<IsraeliHoliday[]>([]);
  const [today_info, set_today_info] = useState<BusinessDay | null>(null);
  const [start_date, set_start_date] = useState('');
  const [end_date, set_end_date] = useState('');
  const [business_days_count, set_business_days_count] = useState<number | null>(null);
  const [payment_date, set_payment_date] = useState('');
  const [recommended_payment, set_recommended_payment] = useState<Date | null>(null);

  useEffect(() => {
    // טעינת מידע על היום
    const today = new Date();
    set_today_info(get_day_info(today));
    
    // טעינת חגים קרובים
    if (show_upcoming_holidays) {
      set_upcoming_holidays(get_upcoming_holidays(60)); // 60 יום קדימה
    }
  }, [show_upcoming_holidays]);

  // חישוב ימי עסקים
  useEffect(() => {
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      if (start <= end) {
        set_business_days_count(count_business_days(start, end));
      } else {
        set_business_days_count(null);
      }
    } else {
      set_business_days_count(null);
    }
  }, [start_date, end_date]);

  // חישוב תאריך תשלום מומלץ
  useEffect(() => {
    if (payment_date) {
      const date = new Date(payment_date);
      set_recommended_payment(calculate_recommended_payment_date(date));
    } else {
      set_recommended_payment(null);
    }
  }, [payment_date]);

  // קבלת צבע לפי סוג יום
  const get_day_type_color = (day_type: BusinessDay['day_type']) => {
    switch (day_type) {
      case 'weekday': return 'text-green-600 bg-green-50';
      case 'friday_short': return 'text-yellow-600 bg-yellow-50';
      case 'weekend': return 'text-gray-600 bg-gray-50';
      case 'holiday': return 'text-red-600 bg-red-50';
      case 'holiday_eve': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // קבלת תווית לסוג יום
  const get_day_type_label = (day_type: BusinessDay['day_type']) => {
    switch (day_type) {
      case 'weekday': return 'יום עסקים רגיל';
      case 'friday_short': return 'יום שישי מקוצר';
      case 'weekend': return 'סוף שבוע';
      case 'holiday': return 'חג';
      case 'holiday_eve': return 'ערב חג';
      default: return 'לא ידוע';
    }
  };

  // קבלת אייקון לסוג חג
  const get_holiday_icon = (type: IsraeliHoliday['type']) => {
    switch (type) {
      case 'religious': return '🕊️';
      case 'national': return '🇮🇱';
      case 'memorial': return '🕯️';
      default: return '📅';
    }
  };

  if (compact_mode) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {format_israeli_date(new Date())}
            </div>
            {today_info && (
              <div className={`text-xs px-2 py-1 rounded-full ${get_day_type_color(today_info.day_type)}`}>
                {get_day_type_label(today_info.day_type)}
              </div>
            )}
          </div>
          <div className="text-left">
            {upcoming_holidays.length > 0 && (
              <div className="text-sm text-gray-600">
                חג קרוב: {upcoming_holidays[0].hebrew_name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* מידע על היום הנוכחי */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">מידע על היום</h3>
        
        {today_info && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {format_israeli_date(today_info.date)}
                </div>
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${get_day_type_color(today_info.day_type)}`}>
                  {get_day_type_label(today_info.day_type)}
                </div>
              </div>
              
              <div className="text-left">
                <div className={`text-2xl font-bold ${today_info.is_business_day ? 'text-green-600' : 'text-red-600'}`}>
                  {today_info.is_business_day ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">
                  {today_info.is_business_day ? 'יום עסקים' : 'לא יום עסקים'}
                </div>
              </div>
            </div>

            {today_info.holiday && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-lg">{get_holiday_icon(today_info.holiday.type)}</span>
                  <span className="font-medium text-blue-900">{today_info.holiday.hebrew_name}</span>
                </div>
                {today_info.holiday.description && (
                  <div className="text-sm text-blue-700 mt-1">
                    {today_info.holiday.description}
                  </div>
                )}
              </div>
            )}

            {/* המלצות ליצירת קשר */}
            <div className="border-t pt-4">
              {(() => {
                const contact_rec = get_contact_time_recommendations(today_info.date);
                return (
                  <div className={`p-3 rounded-lg ${contact_rec.recommended ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg">{contact_rec.recommended ? '✅' : '⚠️'}</span>
                      <span className="font-medium">יצירת קשר עם לקוחות</span>
                    </div>
                    <div className="text-sm mt-1">
                      {contact_rec.reason}
                    </div>
                    {contact_rec.alternative_date && (
                      <div className="text-sm mt-1 text-blue-600">
                        מומלץ: {format_israeli_date(contact_rec.alternative_date)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* חגים קרובים */}
      {show_upcoming_holidays && upcoming_holidays.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">חגים קרובים</h3>
          
          <div className="space-y-3">
            {upcoming_holidays.slice(0, 5).map((holiday, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="text-right">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <span className="text-lg">{get_holiday_icon(holiday.type)}</span>
                    <span className="font-medium text-gray-900">{holiday.hebrew_name}</span>
                  </div>
                  {holiday.description && (
                    <div className="text-sm text-gray-600 mt-1">{holiday.description}</div>
                  )}
                </div>
                
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {format_israeli_date(holiday.date)}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full ${holiday.is_work_day ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {holiday.is_work_day ? 'יום עבודה חלקי' : 'לא יום עבודה'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* מחשבון ימי עסקים */}
      {show_business_days_calculator && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">מחשבון ימי עסקים</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך התחלה
              </label>
              <input
                type="date"
                value={start_date}
                onChange={(e) => set_start_date(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך סיום
              </label>
              <input
                type="date"
                value={end_date}
                onChange={(e) => set_end_date(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ימי עסקים
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-center">
                <span className="text-2xl font-bold text-israeli-blue">
                  {business_days_count !== null ? business_days_count : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* מחשבון תאריכי תשלום */}
      {show_payment_recommendations && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">המלצות לתאריכי תשלום</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך פירעון מקורי
              </label>
              <input
                type="date"
                value={payment_date}
                onChange={(e) => set_payment_date(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-israeli-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                תאריך תשלום מומלץ
              </label>
              <div className="px-3 py-2 bg-green-50 border border-green-300 rounded-md text-center">
                {recommended_payment ? (
                  <span className="text-green-800 font-medium">
                    {format_israeli_date(recommended_payment)}
                  </span>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>
          </div>
          
          {payment_date && recommended_payment && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>הסבר:</strong> התאריך המומלץ מתחשב בחגים, סופי שבוע וימי עבודה מקוצרים 
                כדי להבטיח שהתשלום יתקבל ביום עסקים רגיל.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IsraeliCalendarWidget;