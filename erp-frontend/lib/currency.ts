/**
 * Format number to Brazilian Real (BRL) currency
 */
export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

/**
 * Parse currency string to number
 * Handles formats like: "R$ 1.234,56" or "1234.56" or "1234,56"
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  
  // Remove R$, spaces, and dots (thousand separator)
  let cleaned = value
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '');
  
  // Replace comma with dot (decimal separator)
  cleaned = cleaned.replace(',', '.');
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format number input as user types (for controlled inputs)
 * Example: user types "12345" -> displays "R$ 123,45"
 */
export function formatCurrencyInput(value: string): string {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Convert to cents
  const cents = parseInt(numbers, 10);
  
  // Convert to reais
  const reais = cents / 100;
  
  return formatCurrency(reais);
}

/**
 * Get numeric value from formatted currency input
 */
export function getCurrencyValue(formattedValue: string): number {
  return parseCurrency(formattedValue);
}
