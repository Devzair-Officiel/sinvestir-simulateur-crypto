import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent } from '../format-money';

describe('formatCurrency', () => {
  it('formate un montant positif en EUR français', () => {
    const result = formatCurrency(1234.56);
    // Intl fr-FR utilise des espaces insécables — on vérifie la structure
    expect(result).toMatch(/1.*234.*56/);
    expect(result).toContain('€');
  });

  it('formate un montant négatif', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
    expect(result).toContain('€');
  });

  it('formate zéro', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('€');
  });

  it('formate un gros montant avec séparateurs', () => {
    const result = formatCurrency(1234567.89);
    expect(result).toMatch(/1.*234.*567.*89/);
    expect(result).toContain('€');
  });
});

describe('formatPercent', () => {
  it('formate un ratio positif (0.5 → ~50 %)', () => {
    const result = formatPercent(0.5);
    expect(result).toMatch(/50/);
    expect(result).toContain('%');
  });

  it('formate un ratio négatif (−0.3 → ~30 %)', () => {
    const result = formatPercent(-0.3);
    expect(result).toMatch(/30/);
    expect(result).toContain('%');
  });

  it('formate zéro', () => {
    const result = formatPercent(0);
    expect(result).toContain('0');
    expect(result).toContain('%');
  });
});
