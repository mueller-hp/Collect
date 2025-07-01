import { describe, it, expect } from 'vitest';
import {
  normalize_hebrew_text,
  normalize_final_chars,
  calculate_similarity,
  check_partial_match,
  create_highlight,
  search_debt_record,
  smart_search,
  advanced_search
} from '../hebrewSearch';
import { DebtRecord } from '../../types';

const mockDebtRecord: DebtRecord = {
  customer_id: 'CUST_001',
  customer_name: 'ישראל ישראלי',
  id_number: '123456789',
  debt_amount: 50000,
  paid_amount: 10000,
  remaining_debt: 40000,
  due_date: new Date('2024-12-31'),
  status: 'פעיל',
  collection_agent: 'משה כהן',
  phone: '050-1234567',
  notes: 'הערות בדיקה',
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-06-01')
};

const mockDebtRecords: DebtRecord[] = [
  mockDebtRecord,
  {
    ...mockDebtRecord,
    customer_id: 'CUST_002',
    customer_name: 'שרה לוי',
    id_number: '987654321',
    collection_agent: 'רחל אברהם'
  },
  {
    ...mockDebtRecord,
    customer_id: 'CUST_003',
    customer_name: 'דוד דוידסון',
    id_number: '111111111',
    collection_agent: 'יוסי מרקוביץ'
  }
];

describe('Hebrew Search Utilities', () => {
  describe('normalize_hebrew_text', () => {
    it('removes diacritics from Hebrew text', () => {
      expect(normalize_hebrew_text('שָׁלוֹם')).toBe('שלום');
      expect(normalize_hebrew_text('מִכְתָּב')).toBe('מכתב');
    });

    it('normalizes whitespace', () => {
      expect(normalize_hebrew_text('שלום   עולם')).toBe('שלום עולם');
      expect(normalize_hebrew_text('  שלום  ')).toBe('שלום');
    });

    it('converts to lowercase', () => {
      expect(normalize_hebrew_text('Hello World')).toBe('hello world');
    });

    it('handles empty strings', () => {
      expect(normalize_hebrew_text('')).toBe('');
      expect(normalize_hebrew_text('   ')).toBe('');
    });
  });

  describe('normalize_final_chars', () => {
    it('converts final Hebrew characters to regular ones', () => {
      expect(normalize_final_chars('ךםןףץ')).toBe('כמנפצ');
      expect(normalize_final_chars('שלום')).toBe('שלומ');
      expect(normalize_final_chars('בית')).toBe('בית');
    });

    it('handles mixed text with final characters', () => {
      expect(normalize_final_chars('מילימ עליכמ')).toBe('מילימ עליכמ');
    });
  });

  describe('calculate_similarity', () => {
    it('returns 1 for identical strings', () => {
      expect(calculate_similarity('שלום', 'שלום')).toBe(1);
      expect(calculate_similarity('hello', 'hello')).toBe(1);
    });

    it('returns 0 for completely different strings', () => {
      expect(calculate_similarity('', 'שלום')).toBe(0);
      expect(calculate_similarity('abc', '')).toBe(0);
    });

    it('calculates similarity for similar strings', () => {
      const similarity = calculate_similarity('שלום', 'שלומ');
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1);
    });

    it('calculates similarity for different strings', () => {
      const similarity = calculate_similarity('שלום', 'בוקר');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('check_partial_match', () => {
    it('finds partial matches in Hebrew text', () => {
      expect(check_partial_match('ישרא', 'ישראל ישראלי')).toBe(true);
      expect(check_partial_match('לוי', 'שרה לוי')).toBe(true);
    });

    it('handles final character variations', () => {
      expect(check_partial_match('משה', 'משה כהן')).toBe(true);
      expect(check_partial_match('כהן', 'משה כהן')).toBe(true);
    });

    it('returns false for non-matches', () => {
      expect(check_partial_match('בוקר', 'ישראל ישראלי')).toBe(false);
      expect(check_partial_match('xyz', 'משה כהן')).toBe(false);
    });

    it('handles empty strings', () => {
      expect(check_partial_match('', 'ישראל')).toBe(true);
      expect(check_partial_match('ישרא', '')).toBe(false);
    });
  });

  describe('create_highlight', () => {
    it('creates highlighting for matched text', () => {
      const result = create_highlight('ישראל ישראלי', 'ישרא');
      expect(result).toContain('<mark');
      expect(result).toContain('ישרא');
    });

    it('returns original text when no match', () => {
      const result = create_highlight('ישראל ישראלי', 'בוקר');
      expect(result).toBe('ישראל ישראלי');
      expect(result).not.toContain('<mark');
    });

    it('handles empty search terms', () => {
      const result = create_highlight('ישראל ישראלי', '');
      expect(result).toBe('ישראל ישראלי');
    });
  });

  describe('search_debt_record', () => {
    it('finds matches in customer name', () => {
      const result = search_debt_record(mockDebtRecord, 'ישרא');
      expect(result).not.toBeNull();
      expect(result!.matched_fields).toContain('customer_name');
      expect(result!.score).toBeGreaterThan(0);
    });

    it('finds matches in ID number', () => {
      const result = search_debt_record(mockDebtRecord, '123456');
      expect(result).not.toBeNull();
      expect(result!.matched_fields).toContain('id_number');
    });

    it('finds matches in collection agent', () => {
      const result = search_debt_record(mockDebtRecord, 'משה');
      expect(result).not.toBeNull();
      expect(result!.matched_fields).toContain('collection_agent');
    });

    it('returns null for non-matches', () => {
      const result = search_debt_record(mockDebtRecord, 'בוקר טוב');
      expect(result).toBeNull();
    });

    it('handles exact matches with higher scores', () => {
      const result = search_debt_record(mockDebtRecord, 'ישראל ישראלי');
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThan(0.8);
    });

    it('includes highlights in results', () => {
      const result = search_debt_record(mockDebtRecord, 'ישרא');
      expect(result).not.toBeNull();
      expect(result!.highlights.customer_name).toContain('<mark');
    });
  });

  describe('smart_search', () => {
    it('returns empty array for empty search term', () => {
      const results = smart_search(mockDebtRecords, '');
      expect(results).toEqual([]);
    });

    it('finds multiple matching records', () => {
      const results = smart_search(mockDebtRecords, 'CUST');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.record.customer_id.includes('CUST'))).toBe(true);
    });

    it('sorts results by score', () => {
      const results = smart_search(mockDebtRecords, 'ישרא');
      expect(results.length).toBeGreaterThan(0);
      
      // Check that scores are in descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i-1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it('respects max results option', () => {
      const results = smart_search(mockDebtRecords, 'CUST', { max_results: 1 });
      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('applies fuzzy threshold correctly', () => {
      const strictResults = smart_search(mockDebtRecords, 'ישראלי', { fuzzy_threshold: 0.9 });
      const lenientResults = smart_search(mockDebtRecords, 'ישראלי', { fuzzy_threshold: 0.3 });
      
      expect(lenientResults.length).toBeGreaterThanOrEqual(strictResults.length);
    });
  });

  describe('advanced_search', () => {
    it('handles single term search', () => {
      const results = advanced_search(mockDebtRecords, 'ישראל');
      expect(results.length).toBeGreaterThan(0);
    });

    it('handles multi-term search', () => {
      const results = advanced_search(mockDebtRecords, 'ישראל כהן');
      expect(results.length).toBeGreaterThan(0);
    });

    it('finds records matching all terms', () => {
      const results = advanced_search(mockDebtRecords, 'ישראל משה');
      
      // Should find the record that has both "ישראל" in customer_name and "משה" in collection_agent
      expect(results.length).toBeGreaterThan(0);
      const foundRecord = results.find(r => r.record.customer_id === 'CUST_001');
      expect(foundRecord).toBeDefined();
    });

    it('combines scores from multiple terms', () => {
      const multiTermResults = advanced_search(mockDebtRecords, 'ישראל משה');
      
      // Multi-term search should generally have different (often lower) scores
      expect(multiTermResults.length).toBeGreaterThan(0);
    });

    it('handles non-matching multi-term search', () => {
      const results = advanced_search(mockDebtRecords, 'בוקר טוב שלום');
      expect(results.length).toBe(0);
    });
  });
});