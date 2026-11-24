export function normalizeCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeCnpj(value);

  if (cnpj.length !== 14) {
    return false;
  }

  if (/^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  const digits = cnpj.split('').map(Number);

  const calcDigit = (base: number[], factors: number[]): number => {
    const sum = base.reduce((acc, digit, index) => acc + digit * factors[index], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const firstFactor = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondFactor = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const firstDigit = calcDigit(digits.slice(0, 12), firstFactor);
  const secondDigit = calcDigit(digits.slice(0, 13), secondFactor);

  return firstDigit === digits[12] && secondDigit === digits[13];
}
