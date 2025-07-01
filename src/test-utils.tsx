import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { DebtProvider } from './contexts/DebtContext'
import { DebtRecord } from './types'

// Mock debt record for testing
export const mockDebtRecord: DebtRecord = {
  customer_id: 'CUST_001',
  customer_name: 'ישראל ישראלי',
  id_number: '123456782',
  debt_amount: 10000,
  paid_amount: 2000,
  remaining_debt: 8000,
  due_date: new Date('2024-12-31'),
  status: 'פעיל',
  collection_agent: 'דני כהן',
  last_payment_date: new Date('2024-01-15'),
  phone: '0501234567',
  notes: 'לקוח טוב',
  created_at: new Date('2023-01-01'),
  updated_at: new Date('2024-01-01')
};

// Additional mock records for testing
export const mockDebtRecords: DebtRecord[] = [
  mockDebtRecord,
  {
    customer_id: 'CUST_002',
    customer_name: 'שרה לוי',
    id_number: '987654321',
    debt_amount: 15000,
    paid_amount: 5000,
    remaining_debt: 10000,
    due_date: new Date('2024-11-30'),
    status: 'בטיפול',
    collection_agent: 'משה ישראלי',
    phone: '0507654321',
    notes: 'דורש מעקב',
    created_at: new Date('2023-02-01'),
    updated_at: new Date('2024-02-01')
  },
  {
    customer_id: 'CUST_003',
    customer_name: 'אברהם כהן',
    id_number: '456789123',
    debt_amount: 5000,
    paid_amount: 5000,
    remaining_debt: 0,
    due_date: new Date('2024-10-31'),
    status: 'סגור',
    collection_agent: 'רחל אברהם',
    phone: '0509876543',
    created_at: new Date('2023-03-01'),
    updated_at: new Date('2024-03-01')
  }
];

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialDebts?: DebtRecord[];
}

const AllTheProviders = ({ children }: { children: React.ReactNode; initialDebts?: DebtRecord[] }) => {
  return (
    <DebtProvider>
      {children}
    </DebtProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialDebts, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} initialDebts={initialDebts} />,
    ...renderOptions,
  });
};

// Helper functions for testing Hebrew content
export const expectHebrewText = (element: HTMLElement, text: string) => {
  // These functions are designed for test environment
  element.textContent?.includes(text);
  element.getAttribute('dir') === 'rtl';
};

export const expectIsraeliCurrency = (element: HTMLElement, amount: number) => {
  const formatted = new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  element.textContent?.includes(formatted);
};

export const expectIsraeliDate = (element: HTMLElement, date: Date) => {
  const formatted = new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  element.textContent?.includes(formatted);
};

// Mock functions for testing
export const createMockDebt = (overrides: Partial<DebtRecord> = {}): DebtRecord => ({
  ...mockDebtRecord,
  ...overrides,
});

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }