import { isValidCnpj, normalizeCnpj } from './cnpj.util';

describe('cnpj.util', () => {
  it('normalizes cnpj by removing punctuation', () => {
    expect(normalizeCnpj('12.345.678/0001-95')).toBe('12345678000195');
  });

  it('validates a known valid cnpj', () => {
    expect(isValidCnpj('11.444.777/0001-61')).toBe(true);
  });

  it('rejects invalid repeated digits cnpj', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
  });

  it('rejects invalid check digits cnpj', () => {
    expect(isValidCnpj('11.444.777/0001-62')).toBe(false);
  });
});
