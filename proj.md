# מערכת ניהול חובות - Hebrew Debt Collection Management System

## סקירת הפרויקט / Project Overview

מערכת מתקדמת באפליקציית React לניהול גביית חובות עבור חברה ישראלית עם תמיכה מלאה בשפה העברית.

Advanced React application for debt collection management for an Israeli company with full Hebrew language support.

## ✅ מטלות שהושלמו / Completed Tasks

### Phase 1: Project Setup & Foundation ✅
- [x] Initialize React TypeScript project with Vite
- [x] Configure RTL support with Tailwind CSS  
- [x] Set up Hebrew fonts and typography (Heebo font)
- [x] Install core dependencies (Recharts, Papa Parse, React Router)
- [x] Create basic project structure with Hebrew naming conventions
- [x] Implement TypeScript interfaces for debt records
- [x] Create context API for state management
- [x] Set up Hebrew localization system

## ✅ מטלות שהושלמו / Completed Tasks

### Phase 2: Core Infrastructure ✅
- [x] Build file upload component with validation
- [x] Create data processing utilities for Excel/CSV files
- [x] Build main dashboard layout
- [x] Implement KPI components with Israeli formatting

### Phase 3: Main Dashboard & Analytics ✅
- [x] Build Hebrew KPI dashboard with Israeli formatting
- [x] Implement debt aging charts and visualizations  
- [x] Create collection performance metrics
- [x] Add Israeli currency (₪) and date formatting
- [x] Build responsive mobile-first layout

## ✅ מטלות שהושלמו / Completed Tasks

### Phase 4: Data Management & Tables ✅
- [x] Create interactive Hebrew data tables with sortable columns
- [x] Implement advanced filtering and search functionality
- [x] Add Israeli ID number and phone validation utilities
- [x] Build customer management interface
- [x] Add data export functionality (CSV/Excel)

### Phase 5: Advanced Features & UX ✅
- [x] Implement smart Hebrew search functionality
- [x] Add alerts and notification system
- [x] Create recommendation engine for debt collection
- [x] Build PDF report generation with Hebrew support
- [x] Add Israeli holiday calendar integration

## 🚧 מטלות נוכחיות / Current Tasks

## 📋 מטלות עתידיות / Future Tasks

### Phase 6: Testing & Polish
- [ ] Write comprehensive test suite
- [ ] Ensure Hebrew accessibility compliance
- [ ] Performance optimization for large datasets
- [ ] Final mobile responsiveness testing
- [ ] Documentation in Hebrew

## 🏗️ מבנה הפרויקט / Project Structure

```
src/
├── components/          # רכיבי UI
├── contexts/           # קונטקסטים של React
├── hooks/              # hooks מותאמים אישית
├── pages/              # דפי האפליקציה
├── types/              # הגדרות TypeScript
├── utils/              # פונקציות עזר
│   ├── formatting.ts   # עיצוב נתונים ישראליים
│   └── localization.ts # מערכת לוקליזציה בעברית
└── assets/             # קבצי מדיה
```

## 🔧 טכנולוגיות / Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with RTL support
- **Charts**: Recharts
- **File Processing**: Papa Parse
- **Routing**: React Router
- **State Management**: Context API + useReducer
- **Fonts**: Heebo (Hebrew-optimized)

## 🌟 תכונות מיוחדות / Special Features

### Hebrew & RTL Support
- Full RTL layout implementation
- Hebrew fonts (Heebo) optimization
- Israeli date/currency formatting
- Hebrew form validation messages

### Israeli Business Context
- Israeli ID number validation (ת.ז.)
- Israeli phone number formatting (+972)
- Israeli Shekel (₪) currency formatting
- Israeli date format (DD/MM/YYYY)
- Hebrew status categories
- Israeli business calendar support

### Mobile-First Design
- Responsive design optimized for Israeli users
- Touch-friendly interface
- Mobile data tables with horizontal scroll
- Optimized for Hebrew mobile keyboards

## 📊 נתונים לדוגמה / Sample Data Structure

```typescript
interface DebtRecord {
  customer_id: string;        // מזהה לקוח
  customer_name: string;      // שם לקוח
  id_number: string;          // מספר תעודת זהות
  debt_amount: number;        // סכום חוב
  paid_amount: number;        // סכום ששולם
  remaining_debt: number;     // חוב נותר
  due_date: Date;            // תאריך פירעון
  status: 'פעיל' | 'סגור' | 'בטיפול' | 'מושהה';
  collection_agent: string;  // נציג גביה
  phone?: string;            // טלפון
  notes?: string;            // הערות
}
```

## 🎯 יעדי הפרויקט / Project Goals

1. **יעילות תפעולית** - ממשק פשוט ויעיל לצוותי גביה
2. **תמיכה מלאה בעברית** - כל המערכת בעברית עם תמיכת RTL
3. **נתונים מדויקים** - דוחות וניתוחים מתקדמים
4. **מותאם לשוק הישראלי** - תקנות, פורמטים ותרבות עסקית ישראלית
5. **ביצועים גבוהים** - טיפול ביעילות בקבצים גדולים

## 🚀 הפעלת הפרויקט / Getting Started

```bash
npm install
npm run dev
```

הפרויקט יעלה על: http://localhost:5173

## 📝 הערות פיתוח / Development Notes

- כל הטקסטים במערכת בעברית
- שימוש בקונבנציות snake_case לפי העדפות המשתמש
- כל הפונקציות כוללות type hints
- מבנה מודולרי וניתן לשימוש חוזר
- בדיקות תקינות מקיפות לנתונים ישראליים

---

**סטטוס**: Phase 1 ✅ | Phase 2 ✅ | Phase 3 ✅ | Phase 4 ✅ | Phase 5 ✅ | Phase 6 מוכנה להתחלה 🚀

**גרסה**: 1.0.0-dev

**תאריך עדכון אחרון**: 30/06/2025