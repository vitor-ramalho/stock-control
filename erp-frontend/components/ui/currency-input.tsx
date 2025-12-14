'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onValueChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = 0, onValueChange, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Format number to BRL currency
    const formatToBRL = (num: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num);
    };

    // Update local value when external value changes (only if not focused)
    React.useEffect(() => {
      if (!isFocused) {
        setLocalValue(value.toString());
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;

      // Remove all non-numeric characters except comma and dot
      input = input.replace(/[^\d,\.]/g, '');

      // Replace comma with dot for decimal
      input = input.replace(',', '.');

      // Prevent multiple dots
      const parts = input.split('.');
      if (parts.length > 2) {
        input = parts[0] + '.' + parts.slice(1).join('');
      }

      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        input = parts[0] + '.' + parts[1].substring(0, 2);
      }

      setLocalValue(input);

      // Parse and send numeric value
      const numericValue = parseFloat(input) || 0;
      onValueChange?.(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number without formatting
      setLocalValue(value.toString());
      // Select all for easy editing
      setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Keep the numeric value
      const numericValue = parseFloat(localValue) || 0;
      setLocalValue(numericValue.toString());
    };

    // Display formatted or raw value
    const displayValue = isFocused ? localValue : formatToBRL(parseFloat(localValue) || 0);

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="R$ 0,00"
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
