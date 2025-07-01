import { describe, it, expect } from 'vitest';
import {
  format_israeli_currency,
  format_israeli_number,
  format_israeli_date,
  validate_israeli_id,
  validate_israeli_phone,
  format_israeli_phone,
  calculate_debt_age,
  get_debt_age_category,
  calculate_collection_rate,
  format_percentage,
  get_status_color
} from '../formatting';

describe('Israeli Formatting Utilities', () => {
  describe('format_israeli_currency', () => {
    it('formats positive amounts correctly', () => {
      expect(format_israeli_currency(1000)).toMatch(/1,?000.*₪/);
      expect(format_israeli_currency(50000)).toMatch(/50,?000.*₪/);
    });

    it('formats decimal amounts correctly', () => {
      expect(format_israeli_currency(1000.50)).toMatch(/1,?000\.50.*₪/);
    });

    it('handles zero amount', () => {
      expect(format_israeli_currency(0)).toMatch(/0.*₪/);
    });

    it('handles negative amounts', () => {
      expect(format_israeli_currency(-1000)).toMatch(/-.*1,?000.*₪/);
    });
  });

  describe('format_israeli_number', () => {
    it('formats large numbers with separators', () => {
      expect(format_israeli_number(1000)).toBe('1,000');
      expect(format_israeli_number(50000)).toBe('50,000');
      expect(format_israeli_number(1000000)).toBe('1,000,000');
    });

    it('handles small numbers without separators', () => {
      expect(format_israeli_number(100)).toBe('100');
    });
  });

  describe('format_israeli_date', () => {
    it('formats dates in Israeli format (DD/MM/YYYY)', () => {
      const date = new Date('2024-06-15');
      const formatted = format_israeli_date(date);
      expect(formatted).toMatch(/15\.06\.2024|15\/06\/2024/);
    });

    it('handles different months correctly', () => {
      const date = new Date('2024-12-01');
      const formatted = format_israeli_date(date);
      expect(formatted).toMatch(/01\.12\.2024|01\/12\/2024/);
    });
  });

  describe('validate_israeli_id', () => {
    it('validates correct Israeli ID numbers', () => {
      // These are test IDs that pass the checksum algorithm
      expect(validate_israeli_id('123456782')).toBe(true);
      expect(validate_israeli_id('000000018')).toBe(true);
    });

    it('rejects invalid Israeli ID numbers', () => {
      expect(validate_israeli_id('123456789')).toBe(false); // Invalid checksum
      expect(validate_israeli_id('12345678')).toBe(false);  // Too short
      expect(validate_israeli_id('1234567890')).toBe(false); // Too long
      expect(validate_israeli_id('12345678a')).toBe(false);  // Contains letters
      expect(validate_israeli_id('')).toBe(false);           // Empty
    });
  });

  describe('validate_israeli_phone', () => {
    it('validates correct Israeli phone numbers', () => {
      expect(validate_israeli_phone('0501234567')).toBe(true);
      expect(validate_israeli_phone('972501234567')).toBe(true);
      expect(validate_israeli_phone('+972501234567')).toBe(true);
      expect(validate_israeli_phone('050-123-4567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(validate_israeli_phone('123456789')).toBe(false);   // Too short
      expect(validate_israeli_phone('12345678901')).toBe(false); // Too long
      expect(validate_israeli_phone('abc1234567')).toBe(false);  // Contains letters
      expect(validate_israeli_phone('')).toBe(false);           // Empty
    });
  });

  describe('format_israeli_phone', () => {
    it('formats local phone numbers correctly', () => {
      expect(format_israeli_phone('0501234567')).toBe('050-123-4567');
      expect(format_israeli_phone('0771234567')).toBe('077-123-4567');
    });

    it('formats international phone numbers correctly', () => {
      expect(format_israeli_phone('972501234567')).toBe('+972-50-123-4567');
    });

    it('handles phone numbers with existing formatting', () => {
      expect(format_israeli_phone('050-123-4567')).toBe('050-123-4567');
    });

    it('returns original for invalid numbers', () => {
      expect(format_israeli_phone('invalid')).toBe('invalid');
      expect(format_israeli_phone('123')).toBe('123');
    });
  });

  describe('calculate_debt_age', () => {
    it('calculates debt age correctly', () => {
      const today = new Date();
      const past_date = new Date(today);
      past_date.setDate(past_date.getDate() - 30);
      
      const age = calculate_debt_age(past_date);
      expect(age).toBeCloseTo(30, 0);
    });

    it('handles future dates', () => {
      const future_date = new Date();
      future_date.setDate(future_date.getDate() + 10);
      
      const age = calculate_debt_age(future_date);
      expect(age).toBeLessThan(0);
    });
  });

  describe('get_debt_age_category', () => {
    it('categorizes debt age correctly', () => {
      expect(get_debt_age_category(15)).toBe('עד 30 ימים');
      expect(get_debt_age_category(45)).toBe('31-60 ימים');
      expect(get_debt_age_category(75)).toBe('61-90 ימים');
      expect(get_debt_age_category(120)).toBe('מעל 90 ימים');
    });

    it('handles edge cases', () => {
      expect(get_debt_age_category(30)).toBe('עד 30 ימים');
      expect(get_debt_age_category(60)).toBe('31-60 ימים');
      expect(get_debt_age_category(90)).toBe('61-90 ימים');
    });
  });

  describe('calculate_collection_rate', () => {
    it('calculates collection rate correctly', () => {
      expect(calculate_collection_rate(1000, 500)).toBe(50);
      expect(calculate_collection_rate(1000, 750)).toBe(75);
      expect(calculate_collection_rate(1000, 0)).toBe(0);
      expect(calculate_collection_rate(1000, 1000)).toBe(100);
    });

    it('handles zero total debt', () => {
      expect(calculate_collection_rate(0, 100)).toBe(0);
    });

    it('handles over-collection', () => {
      expect(calculate_collection_rate(1000, 1200)).toBe(120);
    });
  });

  describe('format_percentage', () => {
    it('formats percentages with default decimals', () => {
      expect(format_percentage(50.5)).toBe('50.5%');
      expect(format_percentage(100)).toBe('100.0%');
    });

    it('formats percentages with custom decimals', () => {
      expect(format_percentage(50.555, 2)).toBe('50.56%');
      expect(format_percentage(50.555, 0)).toBe('51%');
    });
  });

  describe('get_status_color', () => {
    it('returns correct colors for each status', () => {
      expect(get_status_color('פעיל')).toContain('red');
      expect(get_status_color('בטיפול')).toContain('yellow');
      expect(get_status_color('סגור')).toContain('green');
      expect(get_status_color('מושהה')).toContain('gray');
    });

    it('handles unknown status', () => {
      expect(get_status_color('לא ידוע')).toContain('gray');
    });
  });
});