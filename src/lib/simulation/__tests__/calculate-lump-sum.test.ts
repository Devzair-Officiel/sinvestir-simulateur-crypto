import { describe, it, expect } from 'vitest';
import { lumpSumStrategy } from '../calculate-lump-sum';
import type { MarketPoint, LumpSumParams } from '@/types/simulation';

function utc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function makeParams(
  overrides: Partial<LumpSumParams> = {},
): LumpSumParams {
  return {
    mode: 'lump-sum',
    cryptoId: 'bitcoin',
    amount: 1000,
    startDate: utc('2024-01-01'),
    endDate: utc('2024-01-04'),
    ...overrides,
  };
}

describe('lumpSumStrategy', () => {
  it('cas nominal — prix double → performance +100 %', () => {
    // Achat à 100 € le 01/01, vente à 200 € le 04/01
    // quantité = 1000 / 100 = 10
    // valeur finale = 10 × 200 = 2000
    // gain = 1000, perf = +100 %
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
      { timestamp: utc('2024-01-02').getTime(), price: 120 },
      { timestamp: utc('2024-01-03').getTime(), price: 150 },
      { timestamp: utc('2024-01-04').getTime(), price: 200 },
    ];

    const result = lumpSumStrategy.run(makeParams(), prices);

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    expect(result.totalInvested).toBe(1000);
    expect(result.totalQuantity).toBe(10);
    expect(result.finalValue).toBe(2000);
    expect(result.gainLoss).toBe(1000);
    expect(result.performance).toBe(1); // +100 %
    expect(result.paymentCount).toBe(1);
    expect(result.averageBuyPrice).toBe(100);
    expect(result.timeline).toHaveLength(4);
  });

  it('timeline — invested constant, value suit le prix', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
      { timestamp: utc('2024-01-02').getTime(), price: 150 },
    ];

    const result = lumpSumStrategy.run(
      makeParams({ endDate: utc('2024-01-02') }),
      prices,
    );
    if (result.status !== 'success') return;

    // quantité = 1000 / 100 = 10
    // jour 1 : value = 10 × 100 = 1000 (= invested, on vient d'acheter)
    // jour 2 : value = 10 × 150 = 1500
    expect(result.timeline[0]).toEqual({
      timestamp: utc('2024-01-01').getTime(),
      invested: 1000,
      value: 1000,
    });
    expect(result.timeline[1].value).toBe(1500);
  });

  it('série vide → erreur no-price-data', () => {
    const result = lumpSumStrategy.run(makeParams(), []);
    expect(result).toMatchObject({
      status: 'error',
      code: 'no-price-data',
    });
  });

  it('pas de prix avant start → erreur no-price-data', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-05').getTime(), price: 200 },
    ];
    const result = lumpSumStrategy.run(makeParams(), prices);
    expect(result).toMatchObject({
      status: 'error',
      code: 'no-price-data',
    });
  });

  it('prix 0 au start → erreur no-price-data', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 0 },
    ];
    const result = lumpSumStrategy.run(
      makeParams({ endDate: utc('2024-01-01') }),
      prices,
    );
    expect(result).toMatchObject({
      status: 'error',
      code: 'no-price-data',
    });
  });

  it('prix Infinity au start → erreur no-price-data', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: Infinity },
    ];
    const result = lumpSumStrategy.run(
      makeParams({ endDate: utc('2024-01-01') }),
      prices,
    );
    expect(result).toMatchObject({
      status: 'error',
      code: 'no-price-data',
    });
  });

  // Contrat moteur : si le provider ne fournit aucun point d'ancrage (cas
  // limite où startDate précède le tout premier point de la série entière),
  // le moteur reste strict et lève une erreur explicite — pas de premier
  // prix après implicite, qui créerait un achat fantôme silencieux.
  // En production : le formulaire borne min="2018-01-04" (premier point
  // de la série fallback) ET le provider préfixe systématiquement le point
  // d'ancrage quand il existe, donc ce chemin n'est atteint que par appel
  // direct au moteur avec une startDate antérieure à toute donnée.
  it('aucun point d\'ancrage fourni → erreur explicite', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2018-01-04').getTime(), price: 12399 },
      { timestamp: utc('2018-01-11').getTime(), price: 9250 },
    ];
    const result = lumpSumStrategy.run(
      makeParams({
        startDate: utc('2018-01-01'),
        endDate: utc('2018-01-11'),
      }),
      prices,
    );
    expect(result).toMatchObject({
      status: 'error',
      code: 'no-price-data',
    });
  });

  it('endDate < startDate → erreur invalid-date-range', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
    ];
    const result = lumpSumStrategy.run(
      makeParams({ startDate: utc('2024-01-10'), endDate: utc('2024-01-01') }),
      prices,
    );
    expect(result).toMatchObject({
      status: 'error',
      code: 'invalid-date-range',
    });
  });
});
