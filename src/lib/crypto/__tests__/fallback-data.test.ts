import { describe, it, expect } from 'vitest';
import { fallbackProvider } from '../fallback-data';
import { ProviderError } from '../provider';

function utc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

describe('fallbackProvider', () => {
  it('crypto non supportée → ProviderError not-supported', async () => {
    await expect(
      fallbackProvider.getMarketChart({
        cryptoId: 'solana',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-12-31'),
      }),
    ).rejects.toThrow(ProviderError);

    try {
      await fallbackProvider.getMarketChart({
        cryptoId: 'solana',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-12-31'),
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('not-supported');
    }
  });

  it(`bitcoin retourne un tableau (vide pour l'instant)`, async () => {
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-12-31'),
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it(`ethereum retourne un tableau (vide pour l'instant)`, async () => {
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'ethereum',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-12-31'),
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('filtre les points par plage de dates', async () => {
    // Ce test deviendra pertinent quand les données seront remplies.
    // Pour l'instant, il vérifie que le filtrage ne casse pas sur un tableau vide.
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2020-06-01'),
      endDate: utc('2020-06-30'),
    });
    expect(result).toEqual([]);
  });
});
