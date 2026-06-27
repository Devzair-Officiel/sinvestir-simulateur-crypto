/**
 * Tests d'intégration : provider fallback → moteur de simulation.
 *
 * On reproduit ici le flux RÉEL (provider qui filtre la fenêtre + ancrage,
 * moteur qui calcule), sans fabriquer de tableau de prix avec un point pile
 * sur startDate. Ces tests auraient attrapé le bug lump-sum si on les avait
 * eus au départ.
 */
import { describe, it, expect } from 'vitest';
import { fallbackProvider } from '@/lib/crypto/fallback-data';
import { lumpSumStrategy } from '../calculate-lump-sum';
import { dcaStrategy } from '../calculate-dca';

function utc(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

describe('Intégration provider fallback → moteur lump-sum', () => {
  it('BTC 2020-01-01 → 2026-06-27 : calcul valide avec ancrage', async () => {
    const startDate = utc('2020-01-01');
    const endDate = utc('2026-06-27');

    const prices = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate,
      endDate,
    });

    // Le provider doit fournir l'ancrage 2019-12-26 (6401.1 €) en tête.
    expect(prices[0].timestamp).toBe(1577318400000);
    expect(prices[0].price).toBe(6401.1);

    const result = lumpSumStrategy.run(
      {
        mode: 'lump-sum',
        cryptoId: 'bitcoin',
        amount: 1000,
        startDate,
        endDate,
      },
      prices,
    );

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    // Prix d'achat = ancrage = 6401.1 €. Quantité = 1000 / 6401.1.
    expect(result.averageBuyPrice).toBe(6401.1);
    expect(result.totalQuantity).toBeCloseTo(1000 / 6401.1, 10);
    expect(result.totalInvested).toBe(1000);

    // Valeur finale > 0, finie, supérieure à l'investi (BTC a fortement monté
    // entre 2019-12 et 2026-06).
    expect(Number.isFinite(result.finalValue)).toBe(true);
    expect(result.finalValue).toBeGreaterThan(1000);
    expect(result.gainLoss).toBeGreaterThan(0);
    expect(result.performance).toBeGreaterThan(0);
  });

  it('BTC startDate = 2018-01-04 (premier point exact) : ancrage = ce point', async () => {
    const startDate = utc('2018-01-04');
    const endDate = utc('2018-03-01');

    const prices = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate,
      endDate,
    });

    // Premier point exactement à startDate, pas de doublon.
    expect(prices[0].timestamp).toBe(startDate.getTime());
    const matches = prices.filter((p) => p.timestamp === startDate.getTime());
    expect(matches).toHaveLength(1);

    const result = lumpSumStrategy.run(
      {
        mode: 'lump-sum',
        cryptoId: 'bitcoin',
        amount: 1000,
        startDate,
        endDate,
      },
      prices,
    );

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;
    expect(result.averageBuyPrice).toBe(12399); // prix du 2018-01-04
  });
});

describe('Intégration provider fallback → moteur DCA', () => {
  it('DCA monthly 2020-01-01 → 2020-06-01 : premier versement préservé (6 versements)', async () => {
    const startDate = utc('2020-01-01');
    const endDate = utc('2020-06-01');

    const prices = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate,
      endDate,
    });

    const result = dcaStrategy.run(
      {
        mode: 'dca',
        cryptoId: 'bitcoin',
        amount: 100,
        frequency: 'monthly',
        startDate,
        endDate,
      },
      prices,
    );

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    // 6 échéances mensuelles : 2020-01-01, 02-01, 03-01, 04-01, 05-01, 06-01.
    // Sans l'ancrage, la 1re échéance aurait été silencieusement perdue.
    expect(result.paymentCount).toBe(6);
    expect(result.totalInvested).toBe(600);
  });

  it('DCA weekly 2020-01-01 → 2020-01-31 : 1er versement préservé', async () => {
    const startDate = utc('2020-01-01');
    const endDate = utc('2020-01-31');

    const prices = await fallbackProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate,
      endDate,
    });

    const result = dcaStrategy.run(
      {
        mode: 'dca',
        cryptoId: 'bitcoin',
        amount: 100,
        frequency: 'weekly',
        startDate,
        endDate,
      },
      prices,
    );

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    // 5 échéances hebdo : 01, 08, 15, 22, 29 janvier. Toutes doivent compter.
    expect(result.paymentCount).toBe(5);
    expect(result.totalInvested).toBe(500);
  });
});
