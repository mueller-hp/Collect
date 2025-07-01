import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { DebtProvider } from './contexts/DebtContext';
import { DebtRecord } from './types';

// Mock data for testing
export const mockDebtRecord: DebtRecord = {
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
  updated_at: new Date('2024-06-01'),
  last_payment_date: new Date('2024-05-15')
};

export const mockDebtRecords: DebtRecord[] = [
  mockDebtRecord,
  {
    ...mockDebtRecord,
    customer_id: 'CUST_002',
    customer_name: 'שרה לוי',
    id_number: '987654321',
    debt_amount: 25000,
    paid_amount: 5000,
    remaining_debt: 20000,
    status: 'בטיפול',
    collection_agent: 'רחל אברהם'
  },
  {
    ...mockDebtRecord,
    customer_id: 'CUST_003',
    customer_name: 'דוד דוידסון',
    id_number: '111111111',
    debt_amount: 100000,
    paid_amount: 100000,
    remaining_debt: 0,
    status: 'סגור',
    collection_agent: 'יוסי מרקוביץ'
  }
];

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialDebts?: DebtRecord[];
}

const AllTheProviders = ({ children, initialDebts = [] }: { children: React.ReactNode; initialDebts?: DebtRecord[] }) => {
  return (
    <DebtProvider>
      {children}
    </DebtProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialDebts = [], ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders initialDebts={initialDebts}>{children}</AllTheProviders>,
    ...renderOptions,
  });
};

// Helper functions for testing Hebrew content
export const expectHebrewText = (element: HTMLElement, text: string) => {
  expect(element).toHaveTextContent(text);
  expect(element).toHaveAttribute('dir', 'rtl');
};

export const expectIsraeliCurrency = (element: HTMLElement, amount: number) => {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  expect(element).toHaveTextContent(formatted);
};

export const expectIsraeliDate = (element: HTMLElement, date: Date) => {
  const formatted = new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  expect(element).toHaveTextContent(formatted);
};

// Mock functions for testing
export const createMockDebt = (overrides: Partial<DebtRecord> = {}): DebtRecord => ({
  ...mockDebtRecord,
  ...overrides,
  customer_id: overrides.customer_id || `CUST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Replace the default render with our custom render
export { customRender as render };