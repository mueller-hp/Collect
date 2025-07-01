/**
 * כלי עזר למכשירים ניידים ובדיקות רספונסיביות
 * Mobile utilities and responsive testing helpers
 */

// זיהוי סוג המכשיר
export const detect_device = () => {
  const user_agent = navigator.userAgent;
  const width = window.innerWidth;
  
  return {
    is_mobile: /iPhone|iPad|iPod|Android|BlackBerry|Windows Phone/i.test(user_agent) || width <= 768,
    is_tablet: /iPad|Android/i.test(user_agent) && width > 768 && width <= 1024,
    is_desktop: width > 1024,
    is_ios: /iPhone|iPad|iPod/i.test(user_agent),
    is_android: /Android/i.test(user_agent),
    width,
    height: window.innerHeight,
    orientation: width > window.innerHeight ? 'landscape' : 'portrait'
  };
};

// ברייקפוינטים לפי Tailwind CSS
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

// בדיקת ברייקפוינט נוכחי
export const get_current_breakpoint = (): keyof typeof BREAKPOINTS | 'xs' => {
  const width = window.innerWidth;
  
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
};

// Hook לזיהוי שינויי מסך
export const use_media_query = (query: string): boolean => {
  const [matches, set_matches] = React.useState(() => 
    window.matchMedia(query).matches
  );
  
  React.useEffect(() => {
    const media = window.matchMedia(query);
    
    const listener = (event: MediaQueryListEvent) => {
      set_matches(event.matches);
    };
    
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [query]);
  
  return matches;
};

// בדיקת תמיכה ב-touch
export const is_touch_device = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// חישוב גודל אלמנט בפיקסלים
export const calculate_element_size = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const computed_style = window.getComputedStyle(element);
  
  return {
    width: rect.width,
    height: rect.height,
    padding: {
      top: parseFloat(computed_style.paddingTop),
      right: parseFloat(computed_style.paddingRight),
      bottom: parseFloat(computed_style.paddingBottom),
      left: parseFloat(computed_style.paddingLeft)
    },
    margin: {
      top: parseFloat(computed_style.marginTop),
      right: parseFloat(computed_style.marginRight),
      bottom: parseFloat(computed_style.marginBottom),
      left: parseFloat(computed_style.marginLeft)
    },
    content_width: rect.width - 
      parseFloat(computed_style.paddingLeft) - parseFloat(computed_style.paddingRight),
    content_height: rect.height - 
      parseFloat(computed_style.paddingTop) - parseFloat(computed_style.paddingBottom)
  };
};

// בדיקת נגישות לטקסט קטן במובייל
export const check_mobile_text_readability = (element: HTMLElement) => {
  const style = window.getComputedStyle(element);
  const font_size = parseFloat(style.fontSize);
  const device = detect_device();
  
  const issues = [];
  
  // בדיקת גודל פונט מינימלי למובייל
  if (device.is_mobile && font_size < 16) {
    issues.push({
      type: 'warning' as const,
      message: `גודל פונט קטן מדי למובייל: ${font_size}px (מומלץ 16px+)`,
      suggestion: 'הגדל את גודל הפונט ל-16px לפחות במובייל'
    });
  }
  
  // בדיקת גובה שורה
  const line_height = parseFloat(style.lineHeight);
  if (line_height < font_size * 1.2) {
    issues.push({
      type: 'info' as const,
      message: 'גובה שורה נמוך יחסית לגודל הפונט',
      suggestion: 'הגדל את line-height ל-1.4 לפחות'
    });
  }
  
  return issues;
};

// בדיקת גודלי כפתורים למובייל
export const check_mobile_button_sizes = (button: HTMLElement) => {
  const size = calculate_element_size(button);
  const device = detect_device();
  const issues = [];
  
  // בדיקת גודל מינימלי לכפתורים במובייל (44px לפי Apple, 48dp לפי Google)
  if (device.is_mobile) {
    const min_size = device.is_ios ? 44 : 48;
    
    if (size.height < min_size) {
      issues.push({
        type: 'error' as const,
        message: `כפתור קטן מדי למובייל: גובה ${size.height.toFixed(1)}px`,
        suggestion: `הגדל את גובה הכפתור ל-${min_size}px לפחות`
      });
    }
    
    if (size.width < min_size) {
      issues.push({
        type: 'error' as const,
        message: `כפתור קטן מדי למובייל: רוחב ${size.width.toFixed(1)}px`,
        suggestion: `הגדל את רוחב הכפתור ל-${min_size}px לפחות`
      });
    }
  }
  
  return issues;
};

// בדיקת מרווחים בין אלמנטים אינטראקטיביים
export const check_touch_target_spacing = (container: HTMLElement) => {
  const interactive_elements = container.querySelectorAll(
    'button, a, input, select, textarea, [role="button"], [tabindex]'
  );
  
  const issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    suggestion: string;
    elements?: HTMLElement[];
  }> = [];
  const device = detect_device();
  
  if (!device.is_mobile) return issues;
  
  const min_spacing = 8; // 8px מרווח מינימלי
  
  for (let i = 0; i < interactive_elements.length - 1; i++) {
    const current = interactive_elements[i] as HTMLElement;
    const next = interactive_elements[i + 1] as HTMLElement;
    
    const current_rect = current.getBoundingClientRect();
    const next_rect = next.getBoundingClientRect();
    
    // חישוב מרווח אנכי
    const vertical_gap = Math.abs(next_rect.top - current_rect.bottom);
    // חישוב מרווח אופקי
    const horizontal_gap = Math.abs(next_rect.left - current_rect.right);
    
    const min_gap = Math.min(vertical_gap, horizontal_gap);
    
    if (min_gap < min_spacing && min_gap > 0) {
      issues.push({
        type: 'warning' as const,
        message: `מרווח קטן מדי בין אלמנטים אינטראקטיביים: ${min_gap.toFixed(1)}px`,
        suggestion: `הגדל את המרווח ל-${min_spacing}px לפחות`,
        elements: [current, next]
      });
    }
  }
  
  return issues;
};

// בדיקת גלילה אופקית לא רצויה
export const check_horizontal_scroll = (): boolean => {
  return document.body.scrollWidth > window.innerWidth;
};

// בדיקת תוכן שעלול לצאת מהמסך
export const check_content_overflow = (container: HTMLElement = document.body) => {
  const issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    element: HTMLElement;
    overflow_amount: number;
  }> = [];
  const viewport_width = window.innerWidth;
  
  const all_elements = container.querySelectorAll('*');
  
  all_elements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    
    if (rect.right > viewport_width) {
      issues.push({
        type: 'error' as const,
        message: 'אלמנט יוצא מגבולות המסך',
        element: element as HTMLElement,
        overflow_amount: rect.right - viewport_width
      });
    }
  });
  
  return issues;
};

// בדיקה כוללת למובייל
export const run_mobile_audit = (container: HTMLElement = document.body) => {
  const device = detect_device();
  
  if (!device.is_mobile) {
    return {
      applicable: false,
      message: 'בדיקת מובייל לא רלוונטית - זוהה מכשיר שולחני'
    };
  }
  
  const results = {
    device_info: device,
    horizontal_scroll: check_horizontal_scroll(),
    content_overflow: check_content_overflow(container),
    touch_spacing: check_touch_target_spacing(container),
    text_issues: [] as any[],
    button_issues: [] as any[]
  };
  
  // בדיקת כל הטקסטים
  const text_elements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label');
  text_elements.forEach(element => {
    const issues = check_mobile_text_readability(element as HTMLElement);
    if (issues.length > 0) {
      results.text_issues.push({ element, issues });
    }
  });
  
  // בדיקת כל הכפתורים
  const buttons = container.querySelectorAll('button, [role="button"]');
  buttons.forEach(button => {
    const issues = check_mobile_button_sizes(button as HTMLElement);
    if (issues.length > 0) {
      results.button_issues.push({ element: button, issues });
    }
  });
  
  return results;
};

// יצירת דוח מובייל
export const generate_mobile_report = (audit_results: any) => {
  if (!audit_results.applicable) {
    return audit_results.message;
  }
  
  let report = 'דוח בדיקת נגישות מובייל\n';
  report += '========================\n\n';
  
  report += `מידע מכשיר:\n`;
  report += `- רוחב: ${audit_results.device_info.width}px\n`;
  report += `- גובה: ${audit_results.device_info.height}px\n`;
  report += `- כיוון: ${audit_results.device_info.orientation}\n`;
  report += `- פלטפורמה: ${audit_results.device_info.is_ios ? 'iOS' : audit_results.device_info.is_android ? 'Android' : 'אחר'}\n\n`;
  
  if (audit_results.horizontal_scroll) {
    report += '🔴 בעיית גלילה אופקית זוהתה\n\n';
  }
  
  if (audit_results.content_overflow.length > 0) {
    report += `🔴 תוכן יוצא מגבולות המסך (${audit_results.content_overflow.length} אלמנטים)\n\n`;
  }
  
  if (audit_results.touch_spacing.length > 0) {
    report += `🟡 בעיות מרווח בין אלמנטים (${audit_results.touch_spacing.length} מקרים)\n\n`;
  }
  
  if (audit_results.text_issues.length > 0) {
    report += `ℹ️ בעיות טקסט (${audit_results.text_issues.length} אלמנטים)\n\n`;
  }
  
  if (audit_results.button_issues.length > 0) {
    report += `🔴 בעיות כפתורים (${audit_results.button_issues.length} כפתורים)\n\n`;
  }
  
  if (audit_results.horizontal_scroll === false && 
      audit_results.content_overflow.length === 0 && 
      audit_results.touch_spacing.length === 0 && 
      audit_results.text_issues.length === 0 && 
      audit_results.button_issues.length === 0) {
    report += '✅ לא נמצאו בעיות נגישות מובייל!\n';
  }
  
  return report;
};

// Import React for the hook
import React from 'react';