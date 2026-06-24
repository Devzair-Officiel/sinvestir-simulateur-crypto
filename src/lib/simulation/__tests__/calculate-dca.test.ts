import { describe, it, expect } from 'vitest';
import { dcaStrategy } from '../calculate-dca';
import type { MarketPoint, DcaParams } from '@/types/simulation';

function utc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function makeParams(overrides: Partial<DcaParams> = {}): DcaParams {
  return {
    mode: 'dca',
    cryptoId: 'bitcoin',
    amount: 50,
    frequency: 'monthly',
    startDate: utc('2024-01-01'),
    endDate: utc('2024-03-01'),
    ...overrides,
  };
}

describe('dcaStrategy', () => {
  it('cas nominal — 3 versements vérifiés à la main', () => {
    // Prix : 100, 200, 150 aux 1er jan / fév / mar 2024
    // Montant : 50 € / versement
    // V1 (jan) : 50 / 100  = 0.5
    // V2 (fév) : 50 / 200  = 0.25
    // V3 (mar) : 50 / 150  = 0.33333…
    // quantité totale = 1.08333…
    // investi total  = 150 €
    // prix moyen     = 150 / 1.08333… = 138.4615…
    // valeur finale  = 1.08333… × 150 = 162.50
    // gain           = 12.50
    // performance    = 12.50 / 150 = 0.08333…
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
      { timestamp: utc('2024-02-01').getTime(), price: 200 },
      { timestamp: utc('2024-03-01').getTime(), price: 150 },
    ];

    const result = dcaStrategy.run(makeParams(), prices);

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    expect(result.paymentCount).toBe(3);
    expect(result.totalInvested).toBe(150);
    expect(result.totalQuantity).toBeCloseTo(1.08333, 4);
    expect(result.finalValue).toBeCloseTo(162.5, 2);
    expect(result.gainLoss).toBeCloseTo(12.5, 2);
    expect(result.performance).toBeCloseTo(0.08333, 4);
    expect(result.averageBuyPrice).toBeCloseTo(138.4615, 2);
  });

  it('timeline — invested monte en paliers, value fluctue', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
      { timestamp: utc('2024-01-15').getTime(), price: 120 },
      { timestamp: utc('2024-02-01').getTime(), price: 200 },
    ];

    const result = dcaStrategy.run(
      makeParams({ endDate: utc('2024-02-01') }),
      prices,
    );
    if (result.status !== 'success') return;

    // Jan 1 : 1er versement → invested = 50, quantity = 0.5
    expect(result.timeline[0].invested).toBe(50);
    expect(result.timeline[0].value).toBeCloseTo(50, 2); // 0.5 × 100

    // Jan 15 : pas de versement, même quantity → invested = 50
    expect(result.timeline[1].invested).toBe(50);
    expect(result.timeline[1].value).toBeCloseTo(60, 2); // 0.5 × 120

    // Feb 1 : 2ᵉ versement → invested = 100, quantity = 0.5 + 0.25 = 0.75
    expect(result.timeline[2].invested).toBe(100);
    expect(result.timeline[2].value).toBeCloseTo(150, 2); // 0.75 × 200
  });

  it('1 seul versement — start = end, fréquence monthly', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-06-15').getTime(), price: 50000 },
    ];
    const result = dcaStrategy.run(
      makeParams({
        amount: 100,
        startDate: utc('2024-06-15'),
        endDate: utc('2024-06-15'),
      }),
      prices,
    );

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    expect(result.paymentCount).toBe(1);
    expect(result.totalInvested).toBe(100);
    expect(result.totalQuantity).toBeCloseTo(0.002, 6);
  });

  it('dernier versement pile sur endDate — inclus', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
      { timestamp: utc('2024-02-01').getTime(), price: 100 },
    ];
    const result = dcaStrategy.run(
      makeParams({ endDate: utc('2024-02-01') }),
      prices,
    );

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    expect(result.paymentCount).toBe(2);
    expect(result.totalInvested).toBe(100);
  });

  it('versement avant les données → sauté', () => {
    // Jan : aucune donnée prix avant le 1er fév
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-02-01').getTime(), price: 200 },
      { timestamp: utc('2024-03-01').getTime(), price: 300 },
    ];
    const result = dcaStrategy.run(makeParams(), prices);

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    expect(result.paymentCount).toBe(2); // jan sauté
    expect(result.totalInvested).toBe(100);
  });

  it('prix invalide (négatif, NaN, Infinity) → versement sauté', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: -10 },
      { timestamp: utc('2024-02-01').getTime(), price: NaN },
      { timestamp: utc('2024-03-01').getTime(), price: 200 },
    ];
    const result = dcaStrategy.run(makeParams(), prices);

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    // jan : prix −10 → sauté ; fév : NaN → sauté ; mar : 200 → ok
    expect(result.paymentCount).toBe(1);
    expect(result.totalInvested).toBe(50);
  });

  it('tous les prix invalides → success avec zéro', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: -10 },
      { timestamp: utc('2024-02-01').getTime(), price: 0 },
      { timestamp: utc('2024-03-01').getTime(), price: Infinity },
    ];
    const result = dcaStrategy.run(makeParams(), prices);

    expect(result.status).toBe('success');
    if (result.status !== 'success') return;

    expect(result.paymentCount).toBe(0);
    expect(result.totalInvested).toBe(0);
    expect(result.totalQuantity).toBe(0);
    expect(result.finalValue).toBe(0);
    expect(result.performance).toBe(0);
    expect(result.averageBuyPrice).toBe(0);
    expect(result.timeline).toHaveLength(0);
  });

  it('série vide → erreur no-price-data', () => {
    const result = dcaStrategy.run(makeParams(), []);
    expect(result).toMatchObject({ status: 'error', code: 'no-price-data' });
  });

  it('endDate < startDate → erreur invalid-date-range', () => {
    const prices: MarketPoint[] = [
      { timestamp: utc('2024-01-01').getTime(), price: 100 },
    ];
    const result = dcaStrategy.run(
      makeParams({
        startDate: utc('2024-06-01'),
        endDate: utc('2024-01-01'),
      }),
      prices,
    );
    expect(result).toMatchObject({
      status: 'error',
      code: 'invalid-date-range',
    });
  });
});
