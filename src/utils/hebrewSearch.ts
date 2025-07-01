/**
 * מנוע חיפוש חכם לעברית
 * Smart Hebrew search engine with fuzzy matching and intelligent filtering
 */

import { DebtRecord } from '../types';

// מיפוי תווים דומים בעברית
const HEBREW_SIMILAR_CHARS: Record<string, string[]> = {
  'כ': ['ך', 'כ'],
  'ך': ['כ', 'ך'],
  'מ': ['ם', 'מ'],
  'ם': ['מ', 'ם'],
  'נ': ['ן', 'נ'],
  'ן': ['נ', 'ן'],
  'פ': ['ף', 'פ'],
  'ף': ['פ', 'ף'],
  'צ': ['ץ', 'צ'],
  'ץ': ['צ', 'ץ']
};

// תווי ניקוד עבריים לביטול
const HEBREW_DIACRITICS = /[\u0591-\u05C7]/g;

// ממשק עבור תוצאת חיפוש
export interface SearchResult {
  record: DebtRecord;
  score: number;
  matched_fields: string[];
  highlights: Record<string, string>;
}

// ממשק עבור הגדרות חיפוש
export interface SearchOptions {
  fuzzy_threshold?: number; // רף דמיון (0-1)
  max_results?: number; // מספר תוצאות מקסימלי
  fields?: (keyof DebtRecord)[]; // שדות לחיפוש
  boost_fields?: Record<keyof DebtRecord, number>; // משקל שדות
  exact_match_boost?: number; // הגברת התאמה מדויקת
}

// הגדרות ברירת מחדל
const DEFAULT_OPTIONS: SearchOptions = {
  fuzzy_threshold: 0.6,
  max_results: 100,
  fields: ['customer_name', 'id_number', 'customer_id', 'phone', 'collection_agent'],
  boost_fields: {
    customer_name: 2.0,
    id_number: 1.5,
    customer_id: 1.5,
    phone: 1.0,
    collection_agent: 0.8
  },
  exact_match_boost: 3.0
};

/**
 * ניקוי טקסט עברי מניקוד ותיקון
 */
export const normalize_hebrew_text = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(HEBREW_DIACRITICS, '') // הסרת ניקוד
    .replace(/\s+/g, ' ') // איחוד רווחים
    .trim()
    .toLowerCase();
};

/**
 * המרת תווים סופיים לתווים רגילים
 */
export const normalize_final_chars = (text: string): string => {
  let normalized = text;
  
  Object.entries(HEBREW_SIMILAR_CHARS).forEach(([char, alternatives]) => {
    alternatives.forEach(alt => {
      normalized = normalized.replace(new RegExp(alt, 'g'), char);
    });
  });
  
  return normalized;
};

/**
 * חישוב דמיון בין שתי מחרוזות (Levenshtein distance)
 */
export const calculate_similarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;

  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // אתחול מטריצה
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // חישוב מרחק עריכה
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // מחיקה
        matrix[i][j - 1] + 1,     // הוספה
        matrix[i - 1][j - 1] + cost // החלפה
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  
  return maxLen === 0 ? 1 : 1 - (distance / maxLen);
};

/**
 * בדיקת התאמה חלקית
 */
export const check_partial_match = (searchTerm: string, text: string): boolean => {
  const normalizedSearch = normalize_hebrew_text(normalize_final_chars(searchTerm));
  const normalizedText = normalize_hebrew_text(normalize_final_chars(text));
  
  return normalizedText.includes(normalizedSearch);
};

/**
 * יצירת הדגשה עבור טקסט מתאים
 */
export const create_highlight = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const normalizedSearch = normalize_hebrew_text(normalize_final_chars(searchTerm));
  const normalizedText = normalize_hebrew_text(normalize_final_chars(text));
  
  const index = normalizedText.indexOf(normalizedSearch);
  if (index === -1) return text;
  
  // מציאת המיקום המקורי בטקסט
  let originalIndex = 0;
  let normalizedIndex = 0;
  
  while (normalizedIndex < index && originalIndex < text.length) {
    const normalizedChar = normalize_hebrew_text(normalize_final_chars(text[originalIndex]));
    if (normalizedChar === normalizedText[normalizedIndex]) {
      normalizedIndex++;
    }
    originalIndex++;
  }
  
  const startIndex = Math.max(0, originalIndex - 1);
  const endIndex = Math.min(text.length, startIndex + searchTerm.length);
  
  return (
    text.slice(0, startIndex) +
    '<mark class="bg-yellow-200">' +
    text.slice(startIndex, endIndex) +
    '</mark>' +
    text.slice(endIndex)
  );
};

/**
 * חיפוש חכם ברשומת חוב יחידה
 */
export const search_debt_record = (
  record: DebtRecord,
  searchTerm: string,
  options: SearchOptions = {}
): SearchResult | null => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const normalizedSearch = normalize_hebrew_text(normalize_final_chars(searchTerm));
  
  if (!normalizedSearch) return null;
  
  let totalScore = 0;
  const matchedFields: string[] = [];
  const highlights: Record<string, string> = {};
  
  opts.fields!.forEach(field => {
    const fieldValue = record[field];
    if (!fieldValue) return;
    
    const fieldText = String(fieldValue);
    const normalizedField = normalize_hebrew_text(normalize_final_chars(fieldText));
    
    let fieldScore = 0;
    let matched = false;
    
    // בדיקת התאמה מדויקת
    if (normalizedField === normalizedSearch) {
      fieldScore = 1.0 * (opts.exact_match_boost || 1);
      matched = true;
    }
    // בדיקת התאמה חלקית
    else if (check_partial_match(searchTerm, fieldText)) {
      const similarity = calculate_similarity(normalizedSearch, normalizedField);
      if (similarity >= (opts.fuzzy_threshold || 0.6)) {
        fieldScore = similarity;
        matched = true;
      }
    }
    // בדיקת התאמה של מילים בודדות
    else {
      const searchWords = normalizedSearch.split(/\s+/);
      const fieldWords = normalizedField.split(/\s+/);
      
      let wordMatches = 0;
      searchWords.forEach(searchWord => {
        fieldWords.forEach(fieldWord => {
          const similarity = calculate_similarity(searchWord, fieldWord);
          if (similarity >= (opts.fuzzy_threshold || 0.6)) {
            wordMatches += similarity;
          }
        });
      });
      
      if (wordMatches > 0) {
        fieldScore = wordMatches / searchWords.length;
        matched = true;
      }
    }
    
    if (matched) {
      // הכפלת הציון לפי משקל השדה
      const boost = opts.boost_fields?.[field] || 1.0;
      totalScore += fieldScore * boost;
      matchedFields.push(field as string);
      highlights[field as string] = create_highlight(fieldText, searchTerm);
    }
  });
  
  if (totalScore === 0) return null;
  
  // נירמול הציון
  const maxPossibleScore = opts.fields!.reduce((sum, field) => {
    return sum + (opts.boost_fields?.[field] || 1.0);
  }, 0);
  
  const normalizedScore = Math.min(1.0, totalScore / maxPossibleScore);
  
  return {
    record,
    score: normalizedScore,
    matched_fields: matchedFields,
    highlights
  };
};

/**
 * חיפוש חכם במערך רשומות
 */
export const smart_search = (
  records: DebtRecord[],
  searchTerm: string,
  options: SearchOptions = {}
): SearchResult[] => {
  if (!searchTerm.trim()) return [];
  
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: SearchResult[] = [];
  
  records.forEach(record => {
    const result = search_debt_record(record, searchTerm, opts);
    if (result) {
      results.push(result);
    }
  });
  
  // מיון לפי ציון (גבוה לנמוך)
  results.sort((a, b) => b.score - a.score);
  
  // הגבלת מספר תוצאות
  return results.slice(0, opts.max_results);
};

/**
 * חיפוש מתקדם עם מילטי-טרם
 */
export const advanced_search = (
  records: DebtRecord[],
  query: string,
  options: SearchOptions = {}
): SearchResult[] => {
  const terms = query.trim().split(/\s+/);
  
  if (terms.length === 1) {
    return smart_search(records, query, options);
  }
  
  // חיפוש כל טרם בנפרד
  const termResults: SearchResult[][] = terms.map(term => 
    smart_search(records, term, { ...options, max_results: records.length })
  );
  
  // מציאת רשומות שמופיעות בכל התוצאות
  const commonRecords = new Map<string, SearchResult[]>();
  
  termResults[0].forEach(result => {
    const recordId = result.record.customer_id;
    const allTermResults: SearchResult[] = [result];
    
    // בדיקה אם הרשומה מופיעה בכל הטרמים
    let foundInAll = true;
    for (let i = 1; i < termResults.length; i++) {
      const termResult = termResults[i].find(r => r.record.customer_id === recordId);
      if (termResult) {
        allTermResults.push(termResult);
      } else {
        foundInAll = false;
        break;
      }
    }
    
    if (foundInAll) {
      commonRecords.set(recordId, allTermResults);
    }
  });
  
  // חישוב ציון משולב
  const finalResults: SearchResult[] = [];
  commonRecords.forEach((termResults, recordId) => {
    const avgScore = termResults.reduce((sum, result) => sum + result.score, 0) / termResults.length;
    const allMatchedFields = Array.from(new Set(termResults.flatMap(r => r.matched_fields)));
    const combinedHighlights: Record<string, string> = {};
    
    // שילוב הדגשות
    termResults.forEach(result => {
      Object.entries(result.highlights).forEach(([field, highlight]) => {
        combinedHighlights[field] = highlight;
      });
    });
    
    finalResults.push({
      record: termResults[0].record,
      score: avgScore,
      matched_fields: allMatchedFields,
      highlights: combinedHighlights
    });
  });
  
  // מיון ותוצאה
  finalResults.sort((a, b) => b.score - a.score);
  return finalResults.slice(0, options.max_results || DEFAULT_OPTIONS.max_results!);
};

/**
 * סיכום תוצאות חיפוש
 */
export interface SearchSummary {
  total_results: number;
  avg_score: number;
  top_matched_fields: string[];
  search_time_ms: number;
}

export const get_search_summary = (results: SearchResult[], searchTime: number): SearchSummary => {
  if (results.length === 0) {
    return {
      total_results: 0,
      avg_score: 0,
      top_matched_fields: [],
      search_time_ms: searchTime
    };
  }
  
  const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length;
  
  // ספירת שדות שנמצאו התאמות
  const fieldCounts: Record<string, number> = {};
  results.forEach(result => {
    result.matched_fields.forEach(field => {
      fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    });
  });
  
  const topMatchedFields = Object.entries(fieldCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([field]) => field);
  
  return {
    total_results: results.length,
    avg_score: Math.round(avgScore * 100) / 100,
    top_matched_fields: topMatchedFields,
    search_time_ms: searchTime
  };
};