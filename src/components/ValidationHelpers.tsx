import React from 'react';
import { validate_israeli_id, validate_israeli_phone } from '../utils/formatting';
import { get_text, format_error_message } from '../utils/localization';

// ממשק עבור שדה עם אימות
interface ValidatedFieldProps {
  value: string;
  onChange: (value: string) => void;
  type: 'id' | 'phone' | 'text' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  show_validation?: boolean;
}

// רכיב שדה עם אימות
export const ValidatedField: React.FC<ValidatedFieldProps> = ({
  value,
  onChange,
  type,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  label,
  show_validation = true
}) => {
  // פונקציית אימות לפי סוג השדה
  const validate_field = (field_value: string): { is_valid: boolean; error_message?: string } => {
    if (required && (!field_value || field_value.trim() === '')) {
      return {
        is_valid: false,
        error_message: format_error_message(label || type, 'required')
      };
    }

    if (!field_value || field_value.trim() === '') {
      return { is_valid: true }; // שדה ריק זה תקין אם הוא לא חובה
    }

    switch (type) {
      case 'id':
        return {
          is_valid: validate_israeli_id(field_value),
          error_message: validate_israeli_id(field_value) ? undefined : get_text('invalid_id_number')
        };
      
      case 'phone':
        return {
          is_valid: validate_israeli_phone(field_value),
          error_message: validate_israeli_phone(field_value) ? undefined : get_text('invalid_phone_number')
        };
      
      case 'email':
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          is_valid: email_regex.test(field_value),
          error_message: email_regex.test(field_value) ? undefined : 'כתובת אימייל לא תקינה'
        };
      
      case 'number':
        const is_number = !isNaN(Number(field_value)) && field_value !== '';
        return {
          is_valid: is_number,
          error_message: is_number ? undefined : get_text('invalid_amount')
        };
      
      case 'text':
      default:
        return { is_valid: true };
    }
  };

  const validation_result = validate_field(value);
  const has_error = show_validation && !validation_result.is_valid;

  // קביעת סוג השדה ב-HTML
  const get_input_type = () => {
    switch (type) {
      case 'id':
      case 'phone':
        return 'text';
      case 'number':
        return 'number';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  };

  // עיצוב מותאם לפי מצב האימות
  const input_class = [
    'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-right transition-colors',
    has_error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-israeli-blue focus:border-israeli-blue',
    disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white',
    className
  ].join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={get_input_type()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={input_class}
          dir="rtl"
        />
        
        {/* אייקון סטטוס אימות */}
        {show_validation && value && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {validation_result.is_valid ? (
              <span className="text-green-500 text-sm">✓</span>
            ) : (
              <span className="text-red-500 text-sm">✗</span>
            )}
          </div>
        )}
      </div>

      {/* הודעת שגיאה */}
      {has_error && validation_result.error_message && (
        <p className="text-sm text-red-600 text-right">
          {validation_result.error_message}
        </p>
      )}
    </div>
  );
};

// רכיב עבור אימות מספר תעודת זהות
export const IsraeliIdField: React.FC<Omit<ValidatedFieldProps, 'type'>> = (props) => (
  <ValidatedField {...props} type="id" placeholder="000000000" />
);

// רכיב עבור אימות מספר טלפון
export const IsraeliPhoneField: React.FC<Omit<ValidatedFieldProps, 'type'>> = (props) => (
  <ValidatedField {...props} type="phone" placeholder="050-000-0000" />
);

// רכיב עבור סכום כסף
export const CurrencyField: React.FC<Omit<ValidatedFieldProps, 'type'> & { 
  min?: number; 
  max?: number; 
}> = ({ min = 0, max, ...props }) => (
  <div className="relative">
    <ValidatedField {...props} type="number" />
    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
      ₪
    </span>
  </div>
);

// Hook לאימות טופס שלם
export const use_form_validation = (fields: Record<string, { value: string; type: ValidatedFieldProps['type']; required?: boolean }>) => {
  const validate_form = (): { is_valid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    let is_valid = true;

    Object.entries(fields).forEach(([field_name, field_config]) => {
      // Basic validation without unused variable
      
      // כאן נוכל להשתמש באותה לוגיקת אימות
      // לצורך הדוגמה, נבצע אימות בסיסי
      if (field_config.required && !field_config.value.trim()) {
        errors[field_name] = format_error_message(field_name, 'required');
        is_valid = false;
      } else if (field_config.value.trim()) {
        switch (field_config.type) {
          case 'id':
            if (!validate_israeli_id(field_config.value)) {
              errors[field_name] = get_text('invalid_id_number');
              is_valid = false;
            }
            break;
          case 'phone':
            if (!validate_israeli_phone(field_config.value)) {
              errors[field_name] = get_text('invalid_phone_number');
              is_valid = false;
            }
            break;
        }
      }
    });

    return { is_valid, errors };
  };

  return { validate_form };
};

// רכיב להצגת סיכום שגיאות
interface ValidationSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errors, 
  className = '' 
}) => {
  const error_entries = Object.entries(errors);
  
  if (error_entries.length === 0) {
    return null;
  }

  return (
    <div className={`bg-red-50 border border-red-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-red-400">⚠</span>
        </div>
        <div className="mr-3">
          <h3 className="text-sm font-medium text-red-800">
            נמצאו שגיאות בטופס
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <ul className="list-disc pr-5 space-y-1">
              {error_entries.map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidatedField;