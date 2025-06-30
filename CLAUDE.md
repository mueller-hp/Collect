# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Hebrew debt collection management system built with React + TypeScript + Vite for Israeli companies. The entire application supports RTL layout, Hebrew language, and Israeli business standards.

## Development Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:5173
npm run build        # Build for production (TypeScript check + Vite build)
npm run preview      # Preview production build
npm run lint         # ESLint with TypeScript support
npm run test         # Run tests with Vitest
```

## Architecture Overview

### State Management
The application uses React Context API with useReducer for centralized state management:
- **DebtContext** (`src/contexts/DebtContext.tsx`) - Main state container with actions for CRUD operations, filtering, sorting, pagination, and system messages
- State automatically handles filtering and sorting when data changes
- Provides `use_debt_context()` and `use_debt_actions()` hooks for components

### Core Data Types
All types are defined in `src/types/index.ts`:
- **DebtRecord** - Core debt record with Israeli-specific fields (customer_id, id_number for Israeli ID, etc.)
- **DebtStatus** - Hebrew status literals: 'פעיל' | 'סגור' | 'בטיפול' | 'מושהה'
- **FilterOptions, SortOptions, PaginationOptions** - For data table functionality
- **PerformanceReport, DebtAging, KPIData** - For dashboard analytics

### Israeli Localization System
- **Localization**: `src/utils/localization.ts` contains all Hebrew text strings and helper functions
- **Formatting**: `src/utils/formatting.ts` handles Israeli-specific formatting:
  - Currency (₪), dates (DD/MM/YYYY), phone numbers (+972-XX-XXX-XXXX)
  - Israeli ID validation (9-digit with checksum algorithm)
  - Debt aging categories in Hebrew

### Styling and RTL Support
- **Tailwind CSS** with custom Israeli color palette (israeli-blue, israeli-green, israeli-red)
- **RTL Layout**: Full right-to-left support configured in `index.html` and CSS
- **Heebo Font**: Hebrew-optimized font loaded from Google Fonts
- **Mobile-first**: Responsive design with mobile emphasis

## Development Patterns

### Naming Conventions
- Use `snake_case` for functions and variables (user preference)
- Component files use PascalCase
- All Hebrew text should use the localization system (`get_text()` function)

### Component Architecture
- Components go in `src/components/`
- Pages go in `src/pages/`
- Custom hooks in `src/hooks/`
- Use the DebtContext for all debt-related state operations

### Israeli Business Logic
- Always validate Israeli ID numbers using `validate_israeli_id()`
- Format phone numbers with `format_israeli_phone()`
- Use Hebrew status categories consistently
- Currency should always display with ₪ symbol using `format_israeli_currency()`

### File Processing
- Use Papa Parse for CSV/Excel file processing
- File uploads should validate Hebrew data and Israeli formats
- Support both Hebrew and English column headers

## Key Features Implementation

### Data Flow
1. File upload → Data validation → DebtContext state update
2. UI components subscribe to DebtContext
3. Filtering/sorting happens automatically in context reducer
4. Charts and KPIs derive from filtered data

### RTL Considerations  
- All layouts use `dir="rtl"` 
- Text alignment defaults to right
- Icons and navigation should flow right-to-left
- Date pickers and form inputs need RTL support

### Performance Optimization
- Large datasets (10,000+ records) supported via pagination
- Filtering and sorting happen in memory for performance
- Charts use Recharts with Hebrew labels

## Current Development Status

**Phase 1 Complete**: Project setup, TypeScript interfaces, Context API, localization
**Phase 2 In Progress**: File upload components, data processing utilities, main dashboard

See `proj.md` for detailed development roadmap and task tracking.