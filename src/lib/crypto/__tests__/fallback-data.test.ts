import { describe, it, expect } from 'vitest';
import {
  fallbackProvider,
  BTC_EUR_WEEKLY,
  ETH_EUR_WEEKLY,
} from '../fallback-data';
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

  it('BTC_EUR_WEEKLY contient 442 entrées (jan 2018 → juin 2026)', () => {
    expect(BTC_EUR_WEEKLY.length).toBe(442);
    // Première entrée : 2018-01-04
    expect(BTC_EUR_WEEKLY[0].timestamp).toBe(1515024000000);
    expect(BTC_EUR_WEEKLY[0].price).toBe(12399);
    // Dernière entrée : 2026-06-18
    expect(BTC_EUR_WEEKLY[441].timestamp).toBe(1781740800000);
  });

  it('ETH_EUR_WEEKLY contient 442 entrées (jan 2018 → juin 2026)', () => {
    expect(ETH_EUR_WEEKLY.length).toBe(442);
    // Première entrée : 2018-01-04
    expect(ETH_EUR_WEEKLY[0].timestamp).toBe(1515024000000);
    expect(ETH_EUR_WEEKLY[0].price).toBe(1031.03);
    // Dernière entrée : 2026-06-18
    expect(ETH_EUR_WEEKLY[441].timestamp).toBe(1781740800000);
  });

  it('bitcoin retourne des données pour 2024', async () => {
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-12-31'),
    });
    expect(result.length).toBeGreaterThan(40); // ~52 semaines
    for (const p of result) {
      expect(p.timestamp).toBeGreaterThanOrEqual(utc('2024-01-01').getTime());
      expect(p.timestamp).toBeLessThanOrEqual(utc('2024-12-31').getTime());
    }
  });

  it('ethereum retourne des données pour 2024', async () => {
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'ethereum',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-12-31'),
    });
    expect(result.length).toBeGreaterThan(40);
  });

  it('filtre correctement par plage de dates', async () => {
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2020-06-01'),
      endDate: utc('2020-06-30'),
    });
    // Juin 2020 = ~4 semaines de données
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
    for (const p of result) {
      expect(p.timestamp).toBeGreaterThanOrEqual(utc('2020-06-01').getTime());
      expect(p.timestamp).toBeLessThanOrEqual(utc('2020-06-30').getTime());
    }
  });

  it('tous les prix sont des nombres finis positifs', () => {
    for (const p of BTC_EUR_WEEKLY) {
      expect(Number.isFinite(p.price)).toBe(true);
      expect(p.price).toBeGreaterThan(0);
    }
    for (const p of ETH_EUR_WEEKLY) {
      expect(Number.isFinite(p.price)).toBe(true);
      expect(p.price).toBeGreaterThan(0);
    }
  });
});
