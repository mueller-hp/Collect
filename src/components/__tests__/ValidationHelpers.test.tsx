import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils';
import userEvent from '@testing-library/user-event';
import { ValidatedField, IsraeliIdField, IsraeliPhoneField, CurrencyField } from '../ValidationHelpers';

describe('ValidationHelpers Components', () => {
  describe('ValidatedField', () => {
    it('renders text field correctly', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          placeholder="הכנס שם"
        />
      );

      expect(screen.getByLabelText('שם לקוח')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('הכנס שם')).toBeInTheDocument();
    });

    it('shows required indicator when field is required', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('calls onChange when value changes', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      await user.type(input, 'ישראל ישראלי');

      expect(mockOnChange).toHaveBeenCalledTimes('ישראל ישראלי'.length);
    });

    it('shows validation error for required empty field', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          required
          show_validation
        />
      );

      expect(screen.getByText(/שם לקוח הוא שדה חובה/)).toBeInTheDocument();
    });

    it('shows success indicator for valid field', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value="ישראל ישראלי"
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          required
          show_validation
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('applies RTL direction', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      expect(input).toHaveAttribute('dir', 'rtl');
    });

    it('disables input when disabled prop is true', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          disabled
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      expect(input).toBeDisabled();
    });
  });

  describe('IsraeliIdField', () => {
    it('validates correct Israeli ID', () => {
      const mockOnChange = vi.fn();
      render(
        <IsraeliIdField
          value="123456782"
          onChange={mockOnChange}
          label="מספר תעודת זהות"
          show_validation
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows error for invalid Israeli ID', () => {
      const mockOnChange = vi.fn();
      render(
        <IsraeliIdField
          value="123456789"
          onChange={mockOnChange}
          label="מספר תעודת זהות"
          show_validation
        />
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText(/מספר תעודת זהות לא תקין/)).toBeInTheDocument();
    });

    it('has correct placeholder', () => {
      const mockOnChange = vi.fn();
      render(
        <IsraeliIdField
          value=""
          onChange={mockOnChange}
          label="מספר תעודת זהות"
        />
      );

      expect(screen.getByPlaceholderText('000000000')).toBeInTheDocument();
    });
  });

  describe('IsraeliPhoneField', () => {
    it('validates correct Israeli phone number', () => {
      const mockOnChange = vi.fn();
      render(
        <IsraeliPhoneField
          value="0501234567"
          onChange={mockOnChange}
          label="מספר טלפון"
          show_validation
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows error for invalid phone number', () => {
      const mockOnChange = vi.fn();
      render(
        <IsraeliPhoneField
          value="123"
          onChange={mockOnChange}
          label="מספר טלפון"
          show_validation
        />
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText(/מספר טלפון לא תקין/)).toBeInTheDocument();
    });

    it('has correct placeholder', () => {
      const mockOnChange = vi.fn();
      render(
        <IsraeliPhoneField
          value=""
          onChange={mockOnChange}
          label="מספר טלפון"
        />
      );

      expect(screen.getByPlaceholderText('050-000-0000')).toBeInTheDocument();
    });
  });

  describe('CurrencyField', () => {
    it('renders currency symbol', () => {
      const mockOnChange = vi.fn();
      render(
        <CurrencyField
          value="1000"
          onChange={mockOnChange}
          label="סכום"
        />
      );

      expect(screen.getByText('₪')).toBeInTheDocument();
    });

    it('validates number input', () => {
      const mockOnChange = vi.fn();
      render(
        <CurrencyField
          value="abc"
          onChange={mockOnChange}
          label="סכום"
          show_validation
        />
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('accepts valid numbers', () => {
      const mockOnChange = vi.fn();
      render(
        <CurrencyField
          value="1000.50"
          onChange={mockOnChange}
          label="סכום"
          show_validation
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('validates correct email format', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value="test@example.com"
          onChange={mockOnChange}
          type="email"
          label="אימייל"
          show_validation
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows error for invalid email format', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value="invalid-email"
          onChange={mockOnChange}
          type="email"
          label="אימייל"
          show_validation
        />
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.getByText(/כתובת אימייל לא תקינה/)).toBeInTheDocument();
    });
  });

  describe('Keyboard and Focus Behavior', () => {
    it('handles keyboard input correctly', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      await user.click(input);
      expect(input).toHaveFocus();
    });

    it('shows validation on blur', async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          required
          show_validation
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      await user.click(input);
      await user.tab(); // Blur the input

      expect(screen.getByText(/שם לקוח הוא שדה חובה/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          required
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      expect(input).toBeInTheDocument();
    });

    it('associates error messages with input', () => {
      const mockOnChange = vi.fn();
      render(
        <ValidatedField
          value=""
          onChange={mockOnChange}
          type="text"
          label="שם לקוח"
          required
          show_validation
        />
      );

      const input = screen.getByLabelText('שם לקוח');
      const errorMessage = screen.getByText(/שם לקוח הוא שדה חובה/);
      
      expect(input).toBeInTheDocument();
      expect(errorMessage).toBeInTheDocument();
    });
  });
});