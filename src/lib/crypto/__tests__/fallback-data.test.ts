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
    expect(result.length).toBeGreaterThan(40); // ~52 semaines + ancrage
    // Le premier point peut être un ancrage strictement antérieur à startDate.
    // Tous les autres points sont dans la fenêtre.
    expect(result[0].timestamp).toBeLessThanOrEqual(utc('2024-12-31').getTime());
    for (let i = 1; i < result.length; i++) {
      expect(result[i].timestamp).toBeGreaterThanOrEqual(utc('2024-01-01').getTime());
      expect(result[i].timestamp).toBeLessThanOrEqual(utc('2024-12-31').getTime());
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

  it('filtre correctement par plage de dates (+ ancrage)', async () => {
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2020-06-01'),
      endDate: utc('2020-06-30'),
    });
    // Juin 2020 = ~4 semaines de données + 1 ancrage hors fenêtre
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.length).toBeLessThanOrEqual(6);
    // Le premier point peut être l'ancrage (timestamp < startDate)
    expect(result[0].timestamp).toBeLessThanOrEqual(utc('2020-06-30').getTime());
    for (let i = 1; i < result.length; i++) {
      expect(result[i].timestamp).toBeGreaterThanOrEqual(utc('2020-06-01').getTime());
      expect(result[i].timestamp).toBeLessThanOrEqual(utc('2020-06-30').getTime());
    }
  });

  it('ancrage : préfixe le dernier point ≤ startDate hors fenêtre', async () => {
    // 2020-01-01 (mercredi) — pas de point hebdo dessus.
    // Série hebdo alignée jeudi : ancrage attendu = 2019-12-26 (1577318400000, 6401.1 €).
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2020-01-01'),
      endDate: utc('2020-01-31'),
    });
    expect(result[0]).toEqual({ timestamp: 1577318400000, price: 6401.1 });
    expect(result[0].timestamp).toBeLessThan(utc('2020-01-01').getTime());
  });

  it('startDate pile sur un point : pas de doublon, ancrage = ce point', async () => {
    // 2018-01-04 (premier point exact de la série BTC).
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2018-01-04'),
      endDate: utc('2018-02-01'),
    });
    const matches = result.filter((p) => p.timestamp === utc('2018-01-04').getTime());
    expect(matches).toHaveLength(1);
    expect(result[0].timestamp).toBe(utc('2018-01-04').getTime());
  });

  it('startDate avant le tout premier point : pas d\'ancrage, série tronquée', async () => {
    // 2017-12-01 — antérieur au premier point (2018-01-04).
    const result = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2017-12-01'),
      endDate: utc('2018-01-31'),
    });
    expect(result[0].timestamp).toBe(utc('2018-01-04').getTime());
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
