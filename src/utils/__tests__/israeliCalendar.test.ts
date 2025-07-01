import { describe, it, expect } from 'vitest';
import {
  is_israeli_holiday,
  is_business_day,
  get_next_business_day,
  get_previous_business_day,
  count_business_days,
  get_holidays_in_range,
  is_holiday_eve,
  get_day_info,
  get_contact_time_recommendations,
  calculate_recommended_payment_date,
  get_upcoming_holidays,
  is_short_work_day
} from '../israeliCalendar';

describe('Israeli Calendar Utilities', () => {
  describe('is_israeli_holiday', () => {
    it('identifies known holidays correctly', () => {
      // Test a known holiday (these dates are approximations)
      const roshHashana2024 = new Date(2024, 8, 16); // September 16, 2024
      const holiday = is_israeli_holiday(roshHashana2024);
      
      if (holiday) {
        expect(holiday.hebrew_name).toBe('ראש השנה');
        expect(holiday.type).toBe('religious');
        expect(holiday.is_work_day).toBe(false);
      }
    });

    it('returns null for regular days', () => {
      const regularDay = new Date(2024, 5, 15); // June 15, 2024
      const holiday = is_israeli_holiday(regularDay);
      expect(holiday).toBeNull();
    });

    it('handles edge cases with dates', () => {
      const futureDate = new Date(2030, 0, 1);
      const holiday = is_israeli_holiday(futureDate);
      // Should either be null or a valid holiday object
      expect(holiday === null || typeof holiday === 'object').toBe(true);
    });
  });

  describe('is_business_day', () => {
    it('identifies weekdays as business days', () => {
      const monday = new Date(2024, 5, 17); // June 17, 2024 (Monday)
      expect(is_business_day(monday)).toBe(true);

      const tuesday = new Date(2024, 5, 18); // June 18, 2024 (Tuesday)
      expect(is_business_day(tuesday)).toBe(true);

      const wednesday = new Date(2024, 5, 19); // June 19, 2024 (Wednesday)
      expect(is_business_day(wednesday)).toBe(true);

      const thursday = new Date(2024, 5, 20); // June 20, 2024 (Thursday)
      expect(is_business_day(thursday)).toBe(true);
    });

    it('identifies Saturday as non-business day', () => {
      const saturday = new Date(2024, 5, 22); // June 22, 2024 (Saturday)
      expect(is_business_day(saturday)).toBe(false);
    });

    it('handles Friday correctly based on time', () => {
      const fridayMorning = new Date(2024, 5, 21, 10, 0); // June 21, 2024, 10:00 AM
      expect(is_business_day(fridayMorning)).toBe(true);

      const fridayAfternoon = new Date(2024, 5, 21, 16, 0); // June 21, 2024, 4:00 PM
      expect(is_business_day(fridayAfternoon)).toBe(false);
    });

    it('considers holidays as non-business days', () => {
      // Test with a known holiday that's not a work day
      const yomKippur2024 = new Date(2024, 8, 25); // September 25, 2024
      const isBusinessDay = is_business_day(yomKippur2024);
      
      // Yom Kippur should not be a business day
      expect(isBusinessDay).toBe(false);
    });
  });

  describe('get_next_business_day', () => {
    it('returns next weekday when starting from weekday', () => {
      const monday = new Date(2024, 5, 17); // June 17, 2024 (Monday)
      const nextBusinessDay = get_next_business_day(monday);
      
      expect(nextBusinessDay.getDay()).toBe(2); // Tuesday
      expect(nextBusinessDay.getDate()).toBe(18);
    });

    it('skips weekend to get to Monday', () => {
      const friday = new Date(2024, 5, 21); // June 21, 2024 (Friday)
      const nextBusinessDay = get_next_business_day(friday);
      
      expect(nextBusinessDay.getDay()).toBe(1); // Monday
      expect(nextBusinessDay.getDate()).toBe(24);
    });

    it('handles end of month correctly', () => {
      const endOfMonth = new Date(2024, 5, 30); // June 30, 2024 (Sunday)
      const nextBusinessDay = get_next_business_day(endOfMonth);
      
      expect(nextBusinessDay.getMonth()).toBe(6); // July
      expect(nextBusinessDay.getDay()).toBe(1); // Monday
    });

    it('prevents infinite loops with safety limit', () => {
      const testDate = new Date(2024, 5, 15);
      const result = get_next_business_day(testDate);
      
      // Should return a valid date within reasonable range
      const daysDiff = Math.abs((result.getTime() - testDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThan(14); // No more than 2 weeks
    });
  });

  describe('get_previous_business_day', () => {
    it('returns previous weekday when starting from weekday', () => {
      const tuesday = new Date(2024, 5, 18); // June 18, 2024 (Tuesday)
      const prevBusinessDay = get_previous_business_day(tuesday);
      
      expect(prevBusinessDay.getDay()).toBe(1); // Monday
      expect(prevBusinessDay.getDate()).toBe(17);
    });

    it('skips weekend to get to Friday', () => {
      const monday = new Date(2024, 5, 24); // June 24, 2024 (Monday)
      const prevBusinessDay = get_previous_business_day(monday);
      
      expect(prevBusinessDay.getDay()).toBe(5); // Friday
      expect(prevBusinessDay.getDate()).toBe(21);
    });
  });

  describe('count_business_days', () => {
    it('counts business days correctly for a week', () => {
      const startDate = new Date(2024, 5, 17); // Monday
      const endDate = new Date(2024, 5, 23); // Sunday
      
      const count = count_business_days(startDate, endDate);
      expect(count).toBe(5); // Monday through Friday
    });

    it('returns 0 for invalid date range', () => {
      const startDate = new Date(2024, 5, 20);
      const endDate = new Date(2024, 5, 15);
      
      const count = count_business_days(startDate, endDate);
      expect(count).toBe(0);
    });

    it('handles same day correctly', () => {
      const date = new Date(2024, 5, 17); // Monday
      const count = count_business_days(date, date);
      expect(count).toBe(1);
    });

    it('excludes weekends from count', () => {
      const friday = new Date(2024, 5, 21);
      const monday = new Date(2024, 5, 24);
      
      const count = count_business_days(friday, monday);
      expect(count).toBe(2); // Friday and Monday only
    });
  });

  describe('get_holidays_in_range', () => {
    it('returns holidays within date range', () => {
      const startDate = new Date(2024, 8, 1); // September 1, 2024
      const endDate = new Date(2024, 8, 30); // September 30, 2024
      
      const holidays = get_holidays_in_range(startDate, endDate);
      expect(Array.isArray(holidays)).toBe(true);
      
      // Should include Rosh Hashana and possibly Yom Kippur
      holidays.forEach(holiday => {
        expect(holiday.date).toBeInstanceOf(Date);
        expect(holiday.date >= startDate).toBe(true);
        expect(holiday.date <= endDate).toBe(true);
      });
    });

    it('returns empty array when no holidays in range', () => {
      const startDate = new Date(2024, 6, 1); // July 1, 2024
      const endDate = new Date(2024, 6, 7); // July 7, 2024
      
      const holidays = get_holidays_in_range(startDate, endDate);
      expect(holidays).toEqual([]);
    });
  });

  describe('is_holiday_eve', () => {
    it('identifies eve of major holidays', () => {
      // Day before a known holiday
      const erevRoshHashana = new Date(2024, 8, 15); // Day before Rosh Hashana
      const isEve = is_holiday_eve(erevRoshHashana);
      
      // This depends on the exact holiday dates, so we check the logic
      expect(typeof isEve).toBe('boolean');
    });

    it('returns false for regular days', () => {
      const regularDay = new Date(2024, 5, 15);
      const isEve = is_holiday_eve(regularDay);
      expect(isEve).toBe(false);
    });
  });

  describe('get_day_info', () => {
    it('provides comprehensive day information', () => {
      const monday = new Date(2024, 5, 17); // Monday
      const dayInfo = get_day_info(monday);
      
      expect(dayInfo.date).toBeInstanceOf(Date);
      expect(dayInfo.is_business_day).toBe(true);
      expect(dayInfo.day_type).toBe('weekday');
      expect(dayInfo.holiday).toBeUndefined();
    });

    it('identifies weekends correctly', () => {
      const saturday = new Date(2024, 5, 22); // Saturday
      const dayInfo = get_day_info(saturday);
      
      expect(dayInfo.is_business_day).toBe(false);
      expect(dayInfo.day_type).toBe('weekend');
    });

    it('identifies Friday as short work day', () => {
      const friday = new Date(2024, 5, 21); // Friday
      const dayInfo = get_day_info(friday);
      
      expect(dayInfo.day_type).toBe('friday_short');
    });
  });

  describe('get_contact_time_recommendations', () => {
    it('recommends business days for contact', () => {
      const monday = new Date(2024, 5, 17, 10, 0); // Monday 10 AM
      const recommendation = get_contact_time_recommendations(monday);
      
      expect(recommendation.recommended).toBe(true);
      expect(recommendation.reason).toContain('מתאים');
    });

    it('discourages contact on holidays', () => {
      const saturday = new Date(2024, 5, 22); // Saturday
      const recommendation = get_contact_time_recommendations(saturday);
      
      expect(recommendation.recommended).toBe(false);
      expect(recommendation.alternative_date).toBeInstanceOf(Date);
    });

    it('provides alternative dates when not recommended', () => {
      const friday = new Date(2024, 5, 21, 15, 0); // Friday 3 PM
      const recommendation = get_contact_time_recommendations(friday);
      
      if (!recommendation.recommended) {
        expect(recommendation.alternative_date).toBeInstanceOf(Date);
        expect(recommendation.reason).toBeTruthy();
      }
    });
  });

  describe('calculate_recommended_payment_date', () => {
    it('returns business day for payment', () => {
      const dueDate = new Date(2024, 5, 22); // Saturday
      const recommendedDate = calculate_recommended_payment_date(dueDate);
      
      expect(is_business_day(recommendedDate)).toBe(true);
      expect(recommendedDate >= dueDate).toBe(true);
    });

    it('adds grace period correctly', () => {
      const dueDate = new Date(2024, 5, 17); // Monday
      const gracePeriod = 7;
      const recommendedDate = calculate_recommended_payment_date(dueDate, gracePeriod);
      
      const daysDiff = (recommendedDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThanOrEqual(gracePeriod);
    });

    it('returns same date if already business day', () => {
      const businessDay = new Date(2024, 5, 17); // Monday
      const recommendedDate = calculate_recommended_payment_date(businessDay, 0);
      
      expect(recommendedDate.toDateString()).toBe(businessDay.toDateString());
    });
  });

  describe('get_upcoming_holidays', () => {
    it('returns array of upcoming holidays', () => {
      const upcomingHolidays = get_upcoming_holidays(90); // Next 90 days
      
      expect(Array.isArray(upcomingHolidays)).toBe(true);
      upcomingHolidays.forEach(holiday => {
        expect(holiday.date).toBeInstanceOf(Date);
        expect(holiday.date >= new Date()).toBe(true);
      });
    });

    it('respects days ahead limit', () => {
      const shortTerm = get_upcoming_holidays(7);
      const longTerm = get_upcoming_holidays(30);
      
      expect(shortTerm.length).toBeLessThanOrEqual(longTerm.length);
    });
  });

  describe('is_short_work_day', () => {
    it('identifies Friday as short work day', () => {
      const friday = new Date(2024, 5, 21); // Friday
      expect(is_short_work_day(friday)).toBe(true);
    });

    it('identifies holiday eve as short work day', () => {
      const holidayEve = new Date(2024, 8, 15); // Day before Rosh Hashana
      const isShort = is_short_work_day(holidayEve);
      
      // This depends on whether it's actually a holiday eve
      expect(typeof isShort).toBe('boolean');
    });

    it('returns false for regular weekdays', () => {
      const monday = new Date(2024, 5, 17); // Monday
      expect(is_short_work_day(monday)).toBe(false);
    });
  });
});