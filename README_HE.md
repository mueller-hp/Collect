# מערכת ניהול חובות עברית

מערכת מתקדמת לניהול חובות עם תמיכה מלאה בעברית ו-RTL, בנויה עם React, TypeScript ו-Vite.

## תכונות עיקריות

### 📊 ניתוח נתונים מתקדם
- לוח בקרה עם KPI מקיפים
- גרפים אינטראקטיביים לניתוח התיישנות חובות
- דוחות ביצועים לנציגי גביה
- מעקב אחר מגמות והתקדמות

### 📁 ניהול קבצים חכם
- העלאת קבצי CSV/Excel עם זיהוי אוטומטי של עמודות
- תמיכה בכותרות עבריות ואנגליות
- ולידציה מתקדמת של נתוני לקוחות ישראליים
- עיבוד של מערכי נתונים גדולים

### 🔍 חיפוש עברי מתקדם
- אלגוריתם חיפוש עברי עם תמיכה בדמיון פונטי
- התאמה גמישה לשגיאות הקלדה
- חיפוש במספר שדות בו-זמנית
- המלצות חכמות לתוצאות חיפוש

### 🎯 ניהול לקוחות מתקדם
- ולידציה אוטומטית של מספרי תעודת זהות ישראליים
- פורמט טלפונים ישראליים
- מעקב אחר סטטוס חובות
- תיעוד אירועים והערות

### 📱 עיצוב רספונסיבי
- תמיכה מלאה במכשירים ניידים
- פאנל בדיקות רספונסיביות מובנה
- זיהוי אוטומטי של מכשיר
- בדיקות נגישות למובייל

### ⚡ ביצועים מתקדמים
- גלילה וירטואלית למערכי נתונים גדולים
- מוניטורינג ביצועים בזמן אמת
- אופטימיזציה אוטומטית לטבלאות
- זיכרון מטמון חכם

### ♿ נגישות עברית
- תמיכה מלאה בקוראי מסך בעברית
- ולידציה אוטומטית של נגישות RTL
- צבעים בעלי ניגודיות מתאימה
- ניווט במקלדת מותאם לעברית

## התקנה

```bash
# שיבוט הפרויקט
git clone [repository-url]
cd collect

# התקנת תלויות
npm install

# הרצה בסביבת פיתוח
npm run dev

# בנייה לפרודקשן
npm run build

# הרצת בדיקות
npm run test
```

## מבנה הפרויקט

```
src/
├── components/          # רכיבי React
│   ├── KPIDashboard.tsx    # לוח בקרה ראשי
│   ├── DebtDataTable.tsx   # טבלת נתונים אינטראקטיבית
│   ├── SmartSearch.tsx     # חיפוש עברי מתקדם
│   ├── VirtualTable.tsx    # טבלה וירטואלית לביצועים
│   └── ...
├── contexts/           # ניהול מצב עם Context API
│   └── DebtContext.tsx    # מצב ראשי של המערכת
├── hooks/              # Custom Hooks
│   ├── useVirtualScroll.ts  # גלילה וירטואלית
│   ├── useDebounce.ts      # דחיית פעולות
│   └── usePerformanceMonitor.ts # מוניטורינג ביצועים
├── utils/              # פונקציות עזר
│   ├── formatting.ts      # פורמטים ישראליים
│   ├── localization.ts    # טקסטים בעברית
│   ├── hebrewSearch.ts    # מנוע חיפוש עברי
│   ├── accessibility.ts   # נגישות עברית
│   ├── performance.ts     # אופטימיזציית ביצועים
│   └── mobileUtils.ts     # כלי מובייל
├── types/              # הגדרות TypeScript
└── pages/              # עמודים ראשיים
```

## טכנולוגיות

- **React 18** - ספרייה לבניית ממשק משתמש
- **TypeScript** - פיתוח מקוטב עם בדיקת טיפוסים
- **Vite** - כלי בנייה מהיר
- **Tailwind CSS** - עיצוב עם תמיכה RTL
- **Papa Parse** - עיבוד קבצי CSV
- **Recharts** - גרפים ותרשימים
- **Vitest** - מסגרת בדיקות

## הגדרות עברית ו-RTL

המערכת בנויה מהיסוד עם תמיכה מלאה בעברית:

### כיוון RTL
```css
/* התקנה גלובלית */
html[dir="rtl"] {
  direction: rtl;
}

/* Tailwind RTL Support */
.space-x-reverse > * + * {
  margin-right: var(--tw-space-x-reverse);
  margin-left: calc(var(--tw-space-x-reverse) * 0);
}
```

### גופנים עבריים
```css
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Heebo', sans-serif;
}
```

### צבעים ישראליים
```javascript
const israeliColors = {
  'israeli-blue': '#0078d4',
  'israeli-green': '#107c10',
  'israeli-red': '#d13438'
};
```

## שימוש במערכת

### העלאת קבצים
1. לחץ על "העלאת קובץ" בעמוד הראשי
2. בחר קובץ CSV או Excel עם נתוני חובות
3. המערכת תזהה אוטומטית את עמודות הנתונים
4. בדוק את המיפוי ואשר את העלאת הנתונים

### ניתוח נתונים
- **לוח בקרה**: סקירה כללית של מצב החובות
- **התיישנות חובות**: ניתוח לפי טווחי זמן
- **ביצועי גביה**: מעקב אחר נציגים

### חיפוש וסינון
- השתמש בחיפוש החכם לאיתור לקוחות
- סנן לפי סטטוס, סכום, או תאריך
- מיין תוצאות לפי כל עמודה

### ייצוא נתונים
- ייצא נתונים מסוננים לקובץ Excel
- צור דוחות PDF מעוצבים
- שתף תוצאות עם צוות הגביה

## בדיקות ואבטחת איכות

```bash
# הרצת כל הבדיקות
npm run test

# בדיקות עם כיסוי קוד
npm run test:coverage

# בדיקת לינטינג
npm run lint

# בדיקת TypeScript
npm run type-check
```

### סוגי בדיקות
- **יחידה**: בדיקת פונקציות ורכיבים בודדים
- **אינטגרציה**: בדיקת אינטראקציה בין רכיבים
- **נגישות**: וולידציה של תמיכה בעברית ו-RTL
- **ביצועים**: מדידת זמני תגובה וזיכרון

## פריסה (Deployment)

### GitHub Pages
הפרויקט מוגדר לפריסה אוטומטית ב-GitHub Pages:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### הגדרות פרודקשן
```javascript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/collect/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
```

## תמיכה ופתרון בעיות

### בעיות נפוצות

**בעיה**: הטקסט העברי לא מוצג נכון
**פתרון**: ודא שהגופן Heebo נטען ושהאלמנט מכיל `dir="rtl"`

**בעיה**: הגרפים לא מציגים טקסט עברי
**פתרון**: בדוק שהתוויות מוגדרות בעברית ב-props של הגרף

**בעיה**: הטבלה איטית עם הרבה נתונים
**פתרון**: הפעל גלילה וירטואלית עם `use_virtual_scroll={true}`

### לוגים ודיבוג
```javascript
// הפעלת מצב פיתוח
localStorage.setItem('debug', 'true');

// מוניטורינג ביצועים
import { performance_monitor } from './utils/performance';
console.log(performance_monitor.get_all_stats());
```

## תרומה לפרויקט

### קווים מנחים
1. עקוב אחר סטנדרטי הקידוד של הפרויקט
2. כתוב בדיקות לפיצ'רים חדשים
3. ודא תמיכה מלאה בעברית ו-RTL
4. בדוק נגישות לפני שליחת PR

### סביבת פיתוח
```bash
# התקנת pre-commit hooks
npm run prepare

# הרצה עם hot reload
npm run dev

# בדיקה לפני commit
npm run lint && npm run test && npm run build
```

## רישיון

פרויקט זה מפותח תחת רישיון MIT. ראה את קובץ LICENSE למידע נוסף.

## יצירת קשר

לתמיכה טכנית או שאלות, אנא פתח issue ב-GitHub repository.