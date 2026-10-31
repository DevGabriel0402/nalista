import { describe, expect, it } from 'vitest';
import { detectCategory, formatCurrency, maskCurrency, parseCurrencyInput } from './utils.js';

describe('formatadores de moeda', () => {
  it('converte texto monetário brasileiro para número', () => {
    expect(parseCurrencyInput('R$ 123,45')).toBe(123.45);
  });

  it('aplica máscara de centavos', () => {
    expect(maskCurrency('12345')).toBe('123,45');
  });

  it('formata valores em reais', () => {
    expect(formatCurrency(12.5).replace('\u00a0', ' ')).toBe('R$ 12,50');
  });
});

describe('detecção de categoria', () => {
  it('identifica produtos com acentos', () => {
    expect(detectCategory('pão francês')).toBe('padaria');
    expect(detectCategory('água mineral')).toBe('bebidas');
  });

  it('usa outros para nomes desconhecidos', () => {
    expect(detectCategory('produto personalizado')).toBe('outros');
    expect(detectCategory('')).toBe('outros');
  });
});
