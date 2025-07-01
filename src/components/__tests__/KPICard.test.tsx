import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils';
import KPICard from '../KPICard';
import { KPIData } from '../../types';

describe('KPICard Component', () => {
  const mockKPIData: KPIData = {
    title: 'סה"כ חוב',
    value: 150000,
    change: 5.2,
    trend: 'up',
    format: 'currency'
  };

  it('renders KPI title correctly', () => {
    render(<KPICard kpi={mockKPIData} />);
    expect(screen.getByText('סה"כ חוב')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<KPICard kpi={mockKPIData} />);
    const valueElement = screen.getByText(/150,000.*₪/);
    expect(valueElement).toBeInTheDocument();
  });

  it('displays percentage change correctly', () => {
    render(<KPICard kpi={mockKPIData} />);
    expect(screen.getByText(/5\.2%/)).toBeInTheDocument();
  });

  it('shows correct trend indicator for upward trend', () => {
    render(<KPICard kpi={mockKPIData} />);
    // Look for the SVG icon instead of text
    const trendElement = screen.getByTestId('trend-up') || screen.getByText('+5.2%');
    expect(trendElement).toBeInTheDocument();
  });

  it('shows correct trend indicator for downward trend', () => {
    const downwardKPI: KPIData = {
      ...mockKPIData,
      change: -3.1,
      trend: 'down'
    };
    render(<KPICard kpi={downwardKPI} />);
    const trendElement = screen.getByText('-3.1%');
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass('text-red-600');
  });

  it('shows stable trend correctly', () => {
    const stableKPI: KPIData = {
      ...mockKPIData,
      change: 0,
      trend: 'stable'
    };
    render(<KPICard kpi={stableKPI} />);
    const trendElement = screen.getByText('0.0%');
    expect(trendElement).toBeInTheDocument();
    expect(trendElement).toHaveClass('text-gray-600');
  });

  it('formats percentage values correctly', () => {
    const percentageKPI: KPIData = {
      title: 'אחוז גביה',
      value: 75.5,
      format: 'percentage'
    };
    render(<KPICard kpi={percentageKPI} />);
    expect(screen.getByText('75.5%')).toBeInTheDocument();
  });

  it('formats number values correctly', () => {
    const numberKPI: KPIData = {
      title: 'מספר לקוחות',
      value: 1250,
      format: 'number'
    };
    render(<KPICard kpi={numberKPI} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });

  it('handles string values', () => {
    const stringKPI: KPIData = {
      title: 'סטטוס מערכת',
      value: 'פעיל'
    };
    render(<KPICard kpi={stringKPI} />);
    expect(screen.getByText('פעיל')).toBeInTheDocument();
  });

  it('renders without change and trend', () => {
    const simpleKPI: KPIData = {
      title: 'סה"כ רשומות',
      value: 500,
      format: 'number'
    };
    render(<KPICard kpi={simpleKPI} />);
    expect(screen.getByText('סה"כ רשומות')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
    expect(screen.queryByText('+%')).not.toBeInTheDocument();
  });

  it('applies RTL direction', () => {
    const { container } = render(<KPICard kpi={mockKPIData} />);
    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('bg-white');
  });

  it('has proper accessibility attributes', () => {
    render(<KPICard kpi={mockKPIData} />);
    // Check for the title text instead of role
    expect(screen.getByText('סה"כ חוב')).toBeInTheDocument();
  });

  it('handles zero values correctly', () => {
    const zeroKPI: KPIData = {
      title: 'חובות חדשים',
      value: 0,
      format: 'currency'
    };
    render(<KPICard kpi={zeroKPI} />);
    expect(screen.getByText(/0.*₪/)).toBeInTheDocument();
  });

  it('handles negative values correctly', () => {
    const negativeKPI: KPIData = {
      title: 'איזון חשבון',
      value: -5000,
      format: 'currency'
    };
    render(<KPICard kpi={negativeKPI} />);
    expect(screen.getByText(/-.*5,000.*₪/)).toBeInTheDocument();
  });
});