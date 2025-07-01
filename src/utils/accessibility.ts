/**
 * כלי נגישות לעברית ו-RTL
 * Hebrew and RTL accessibility utilities
 */

// ממשק עבור בדיקת נגישות
export interface AccessibilityCheck {
  element: HTMLElement;
  issues: AccessibilityIssue[];
  score: number;
}

export interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  category: 'rtl' | 'hebrew' | 'aria' | 'contrast' | 'keyboard' | 'semantic';
  message: string;
  element?: HTMLElement;
  fix_suggestion?: string;
}

/**
 * בדיקת כיוון RTL נכון
 */
export const check_rtl_compliance = (container: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];
  
  // בדיקת dir="rtl" ברמת הבסיס
  const html = document.documentElement;
  if (html.getAttribute('dir') !== 'rtl') {
    issues.push({
      type: 'warning',
      category: 'rtl',
      message: 'המסמך אינו מוגדר כ-RTL ברמת ה-HTML',
      fix_suggestion: 'הוסף dir="rtl" לאלמנט <html>'
    });
  }

  // בדיקת אלמנטים עם טקסט עברי ללא כיוון RTL
  const text_elements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label, button');
  text_elements.forEach(element => {
    const text = element.textContent || '';
    const hebrew_regex = /[\u0590-\u05FF]/;
    
    if (hebrew_regex.test(text)) {
      const computedDir = window.getComputedStyle(element).direction;
      if (computedDir !== 'rtl') {
        issues.push({
          type: 'error',
          category: 'rtl',
          message: 'אלמנט עם טקסט עברי ללא כיוון RTL',
          element: element as HTMLElement,
          fix_suggestion: 'הוסף dir="rtl" או class עם direction: rtl'
        });
      }
    }
  });

  // בדיקת text-align עבור טקסט עברי
  text_elements.forEach(element => {
    const text = element.textContent || '';
    const hebrew_regex = /[\u0590-\u05FF]/;
    
    if (hebrew_regex.test(text)) {
      const computedAlign = window.getComputedStyle(element).textAlign;
      if (computedAlign === 'left' || computedAlign === 'start') {
        issues.push({
          type: 'warning',
          category: 'hebrew',
          message: 'טקסט עברי מיושר לשמאל',
          element: element as HTMLElement,
          fix_suggestion: 'השתמש ב-text-align: right או text-align: end'
        });
      }
    }
  });

  return issues;
};

/**
 * בדיקת תמיכה בקורא מסך עברי
 */
export const check_screen_reader_support = (container: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];

  // בדיקת lang attribute
  const html = document.documentElement;
  const lang = html.getAttribute('lang');
  if (!lang || !lang.includes('he')) {
    issues.push({
      type: 'error',
      category: 'hebrew',
      message: 'חסר הגדרת שפה עברית',
      fix_suggestion: 'הוסף lang="he" לאלמנט <html>'
    });
  }

  // בדיקת aria-label בעברית
  const interactive_elements = container.querySelectorAll('button, input, select, textarea, [role="button"]');
  interactive_elements.forEach(element => {
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    const label = container.querySelector(`label[for="${element.id}"]`);
    
    if (!ariaLabel && !ariaLabelledBy && !label && !element.textContent?.trim()) {
      issues.push({
        type: 'error',
        category: 'aria',
        message: 'אלמנט אינטראקטיבי ללא תווית נגישה',
        element: element as HTMLElement,
        fix_suggestion: 'הוסף aria-label, aria-labelledby או label'
      });
    }

    // בדיקה שהתווית בעברית
    if (ariaLabel) {
      const hebrew_regex = /[\u0590-\u05FF]/;
      const english_regex = /[a-zA-Z]/;
      
      if (english_regex.test(ariaLabel) && !hebrew_regex.test(ariaLabel)) {
        issues.push({
          type: 'warning',
          category: 'hebrew',
          message: 'aria-label באנגלית במקום בעברית',
          element: element as HTMLElement,
          fix_suggestion: 'תרגם את aria-label לעברית'
        });
      }
    }
  });

  // בדיקת headings hierarchy
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let prev_level = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > prev_level + 1) {
      issues.push({
        type: 'warning',
        category: 'semantic',
        message: 'דילוג ברמת הכותרות',
        element: heading as HTMLElement,
        fix_suggestion: 'השתמש ברמות כותרות רצופות (h1, h2, h3...)'
      });
    }
    prev_level = level;
  });

  return issues;
};

/**
 * בדיקת ניווט במקלדת
 */
export const check_keyboard_navigation = (container: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];

  // בדיקת tabindex
  const interactive_elements = container.querySelectorAll('button, input, select, textarea, a, [tabindex]');
  interactive_elements.forEach(element => {
    const tabindex = element.getAttribute('tabindex');
    
    if (tabindex && parseInt(tabindex) > 0) {
      issues.push({
        type: 'warning',
        category: 'keyboard',
        message: 'tabindex חיובי עלול לבלבל את סדר הניווט',
        element: element as HTMLElement,
        fix_suggestion: 'השתמש ב-tabindex="0" או ב-tabindex="-1" או בסדר הטבעי'
      });
    }
  });

  // בדיקת focus indicators
  const focusable_elements = container.querySelectorAll('button, input, select, textarea, a[href]');
  focusable_elements.forEach(element => {
    const computed_style = window.getComputedStyle(element);
    const outline = computed_style.outline;
    const box_shadow = computed_style.boxShadow;
    
    if (outline === 'none' && !box_shadow.includes('focus')) {
      issues.push({
        type: 'error',
        category: 'keyboard',
        message: 'חסר אינדיקטור focus לניווט במקלדת',
        element: element as HTMLElement,
        fix_suggestion: 'הוסף outline או box-shadow למצב :focus'
      });
    }
  });

  return issues;
};

/**
 * בדיקת ניגודיות צבעים
 */
export const check_color_contrast = (container: HTMLElement): AccessibilityIssue[] => {
  const issues: AccessibilityIssue[] = [];

  const text_elements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label, button, a');
  
  text_elements.forEach(element => {
    if (!element.textContent?.trim()) return;

    const computed_style = window.getComputedStyle(element);
    const color = computed_style.color;
    const background_color = computed_style.backgroundColor;
    
    // המרה לערכי RGB לחישוב ניגודיות
    const color_rgb = parse_rgb_color(color);
    const bg_rgb = parse_rgb_color(background_color);
    
    if (color_rgb && bg_rgb) {
      const contrast_ratio = calculate_contrast_ratio(color_rgb, bg_rgb);
      const font_size = parseFloat(computed_style.fontSize);
      const font_weight = computed_style.fontWeight;
      
      // נמוך מדגרות נגישות WCAG
      const min_ratio = (font_size >= 18 || (font_size >= 14 && (font_weight === 'bold' || parseInt(font_weight) >= 700))) ? 3 : 4.5;
      
      if (contrast_ratio < min_ratio) {
        issues.push({
          type: 'error',
          category: 'contrast',
          message: `ניגודיות נמוכה מדי: ${contrast_ratio.toFixed(2)}:1 (נדרש ${min_ratio}:1)`,
          element: element as HTMLElement,
          fix_suggestion: 'שנה את צבע הטקסט או הרקע לשיפור הניגודיות'
        });
      }
    }
  });

  return issues;
};

/**
 * בדיקה כוללת של נגישות
 */
export const run_accessibility_audit = (container: HTMLElement = document.body): AccessibilityCheck => {
  const issues: AccessibilityIssue[] = [
    ...check_rtl_compliance(container),
    ...check_screen_reader_support(container),
    ...check_keyboard_navigation(container),
    ...check_color_contrast(container)
  ];

  // חישוב ציון נגישות
  const errors = issues.filter(issue => issue.type === 'error').length;
  const warnings = issues.filter(issue => issue.type === 'warning').length;
  
  const score = Math.max(0, 100 - (errors * 10) - (warnings * 3));

  return {
    element: container,
    issues,
    score
  };
};

/**
 * הצגת דוח נגישות
 */
export const generate_accessibility_report = (audit: AccessibilityCheck): string => {
  const { issues, score } = audit;
  
  const errors = issues.filter(issue => issue.type === 'error');
  const warnings = issues.filter(issue => issue.type === 'warning');
  const infos = issues.filter(issue => issue.type === 'info');

  let report = `דוח נגישות - ציון: ${score}/100\n`;
  report += `=================================\n\n`;
  
  if (errors.length > 0) {
    report += `🔴 שגיאות (${errors.length}):\n`;
    errors.forEach((issue, index) => {
      report += `${index + 1}. ${issue.message}\n`;
      if (issue.fix_suggestion) {
        report += `   💡 פתרון: ${issue.fix_suggestion}\n`;
      }
      report += '\n';
    });
  }

  if (warnings.length > 0) {
    report += `🟡 אזהרות (${warnings.length}):\n`;
    warnings.forEach((issue, index) => {
      report += `${index + 1}. ${issue.message}\n`;
      if (issue.fix_suggestion) {
        report += `   💡 פתרון: ${issue.fix_suggestion}\n`;
      }
      report += '\n';
    });
  }

  if (infos.length > 0) {
    report += `ℹ️ מידע (${infos.length}):\n`;
    infos.forEach((issue, index) => {
      report += `${index + 1}. ${issue.message}\n`;
      report += '\n';
    });
  }

  if (issues.length === 0) {
    report += '✅ לא נמצאו בעיות נגישות!\n';
  }

  return report;
};

// פונקציות עזר פנימיות

function parse_rgb_color(color: string): [number, number, number] | null {
  const rgb_match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgb_match) {
    return [parseInt(rgb_match[1]), parseInt(rgb_match[2]), parseInt(rgb_match[3])];
  }
  return null;
}

function calculate_contrast_ratio(color1: [number, number, number], color2: [number, number, number]): number {
  const l1 = get_relative_luminance(color1);
  const l2 = get_relative_luminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function get_relative_luminance([r, g, b]: [number, number, number]): number {
  const rs = r / 255;
  const gs = g / 255;
  const bs = b / 255;
  
  const r_linear = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
  const g_linear = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
  const b_linear = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r_linear + 0.7152 * g_linear + 0.0722 * b_linear;
}

/**
 * תיקון אוטומטי של בעיות נגישות בסיסיות
 */
export const auto_fix_accessibility_issues = (container: HTMLElement): number => {
  let fixes_applied = 0;

  // תיקון כיוון RTL חסר
  const hebrew_elements = container.querySelectorAll('*');
  hebrew_elements.forEach(element => {
    const text = element.textContent || '';
    const hebrew_regex = /[\u0590-\u05FF]/;
    
    if (hebrew_regex.test(text)) {
      const computed_dir = window.getComputedStyle(element).direction;
      if (computed_dir !== 'rtl') {
        (element as HTMLElement).dir = 'rtl';
        fixes_applied++;
      }
    }
  });

  // הוספת aria-label חסר לכפתורים
  const buttons_without_labels = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
  buttons_without_labels.forEach(button => {
    const text = button.textContent?.trim();
    if (!text) {
      button.setAttribute('aria-label', 'כפתור');
      fixes_applied++;
    }
  });

  return fixes_applied;
};