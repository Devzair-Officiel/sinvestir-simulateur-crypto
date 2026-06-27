/**
 * Audit de robustesse — tests d'observation, pas de spec.
 * Documentent le comportement actuel face aux cas limites identifiés
 * dans la revue. Ne pas modifier sans relire le rapport associé.
 */
import { describe, it, expect } from 'vitest';
import { lumpSumStrategy } from '../calculate-lump-sum';
import { dcaStrategy } from '../calculate-dca';
import type {
  MarketPoint,
  LumpSumParams,
  DcaParams,
} from '@/types/simulation';

function utc(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

function lump(over: Partial<LumpSumParams> = {}): LumpSumParams {
  return {
    mode: 'lump-sum',
    cryptoId: 'bitcoin',
    amount: 1000,
    startDate: utc('2024-01-01'),
    endDate: utc('2024-01-31'),
    ...over,
  };
}

function dca(over: Partial<DcaParams> = {}): DcaParams {
  return {
    mode: 'dca',
    cryptoId: 'bitcoin',
    amount: 100,
    frequency: 'monthly',
    startDate: utc('2024-01-01'),
    endDate: utc('2024-03-01'),
    ...over,
  };
}

// ─── Cas 2 : endDate après le dernier point de données ─────────────

describe('AUDIT cas 2 — endDate après le dernier point', () => {
  const prices: MarketPoint[] = [
    { timestamp: utc('2024-01-01').getTime(), price: 100 },
    { timestamp: utc('2024-01-08').getTime(), price: 200 },
  ];

  it('lump-sum : valeur finale = dernier prix connu', () => {
    const r = lumpSumStrategy.run(
      lump({ endDate: utc('2024-02-01') }), // 24 jours après dernier point
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    // quantité = 1000/100 = 10, finalValue = 10*200 = 2000
    expect(r.totalQuantity).toBe(10);
    expect(r.finalValue).toBe(2000);
  });

  it('DCA weekly : versements après dernier point achetés au prix figé', () => {
    // 4 versements hebdo : 1er jan (100), 8 jan (200), 15 jan (200 figé), 22 jan (200 figé)
    const r = dcaStrategy.run(
      dca({
        frequency: 'weekly',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-22'),
      }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;

    // Versements effectués
    expect(r.paymentCount).toBe(4);
    expect(r.totalInvested).toBe(400);
    // quantité = 100/100 + 100/200 + 100/200 + 100/200 = 1 + 0.5 + 0.5 + 0.5 = 2.5
    expect(r.totalQuantity).toBe(2.5);

    // Comportement corrigé : finalValue = totalQuantity × dernier prix connu avant endDate,
    // symétrique au lump-sum. Indépendant de la timeline (qui s'arrête au 8 jan, dernier point).
    // 2.5 BTC × 200 € = 500 €. Gain = 500 - 400 = 100 €.
    expect(r.finalValue).toBe(500);
    expect(r.gainLoss).toBe(100);
  });
});

// ─── Cas 3 : range dans un même intervalle hebdomadaire ────────────

describe('AUDIT cas 3 — start et end dans un même intervalle weekly', () => {
  const prices: MarketPoint[] = [
    { timestamp: utc('2024-01-07').getTime(), price: 100 },
    { timestamp: utc('2024-01-14').getTime(), price: 200 },
  ];

  it('lump-sum : OK, finalValue cohérente (même prix de référence)', () => {
    const r = lumpSumStrategy.run(
      lump({ startDate: utc('2024-01-08'), endDate: utc('2024-01-13') }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    // findLastPointBefore(jan8) = jan7 (100). findLastPointBefore(jan13) = jan7 (100).
    expect(r.totalQuantity).toBe(10);
    expect(r.finalValue).toBe(1000); // = amount, gain = 0
    expect(r.timeline).toHaveLength(0); // pas de point dans la fenêtre
  });

  it('DCA daily : timeline vide mais finalValue cohérente (dernier prix connu)', () => {
    // 6 versements quotidiens du 8 au 13 janvier, tous au prix figé 100 (point du 7).
    const r = dcaStrategy.run(
      dca({
        frequency: 'daily',
        startDate: utc('2024-01-08'),
        endDate: utc('2024-01-13'),
      }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;

    expect(r.paymentCount).toBe(6);
    expect(r.totalInvested).toBe(600);
    expect(r.totalQuantity).toBe(6); // 6 × (100/100)

    // Comportement corrigé : timeline vide (aucun point dans [8, 13]) mais
    // finalValue = totalQuantity × findLastPointBefore(endTs).price = 6 × 100 = 600.
    // L'utilisateur a bien 6 BTC valorisés à 100 €. Gain = 0, perf = 0.
    expect(r.timeline).toHaveLength(0);
    expect(r.finalValue).toBe(600);
    expect(r.gainLoss).toBe(0);
    expect(r.performance).toBe(0);
  });
});

// ─── Cas 4 : endDate == startDate ──────────────────────────────────

describe('AUDIT cas 4 — endDate = startDate (bloqué par form, mais moteur ?)', () => {
  const prices: MarketPoint[] = [
    { timestamp: utc('2024-01-01').getTime(), price: 100 },
  ];

  it('lump-sum : OK, traité comme un achat instantané, gain = 0', () => {
    const r = lumpSumStrategy.run(
      lump({ startDate: utc('2024-01-01'), endDate: utc('2024-01-01') }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    expect(r.totalInvested).toBe(1000);
    expect(r.finalValue).toBe(1000);
    expect(r.timeline).toHaveLength(1);
  });

  it('DCA : 1 versement à la date exacte, OK si point pile dessus', () => {
    const r = dcaStrategy.run(
      dca({ startDate: utc('2024-01-01'), endDate: utc('2024-01-01') }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    expect(r.paymentCount).toBe(1);
    expect(r.finalValue).toBe(100);
  });
});

// ─── Cas 5 : période trop courte pour une échéance DCA ─────────────

describe('AUDIT cas 5 — période courte vs fréquence', () => {
  const prices: MarketPoint[] = [
    { timestamp: utc('2024-01-01').getTime(), price: 100 },
    { timestamp: utc('2024-01-08').getTime(), price: 100 },
  ];

  it('DCA monthly sur 5 jours : 1 versement (la 1re échéance = startDate)', () => {
    const r = dcaStrategy.run(
      dca({
        frequency: 'monthly',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-05'),
      }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    // Première échéance = startDate, jamais 0 versement.
    expect(r.paymentCount).toBe(1);
  });
});

// ─── Cas 6 : précision flottante sur montants extrêmes ─────────────

describe('AUDIT cas 6 — précision flottante', () => {
  const prices: MarketPoint[] = [
    { timestamp: utc('2024-01-01').getTime(), price: 50000 },
    { timestamp: utc('2024-12-01').getTime(), price: 100000 },
  ];

  it('amount = 1e15 € : pas de NaN ni Infinity, ratio exact', () => {
    const r = lumpSumStrategy.run(
      lump({ amount: 1e15, endDate: utc('2024-12-01') }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    expect(Number.isFinite(r.finalValue)).toBe(true);
    expect(r.performance).toBe(1); // +100 %
  });

  it('amount = 0.001 € (centime fractionné) : pas d\'arrondi destructeur', () => {
    const r = lumpSumStrategy.run(
      lump({ amount: 0.001, endDate: utc('2024-12-01') }),
      prices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    expect(r.finalValue).toBeCloseTo(0.002, 6);
  });

  it('DCA daily sur 1 an : précision cumulée OK', () => {
    const dailyPrices: MarketPoint[] = [];
    for (let i = 0; i < 366; i++) {
      const ts = utc('2024-01-01').getTime() + i * 86400000;
      dailyPrices.push({ timestamp: ts, price: 100 + i * 0.1 });
    }
    const r = dcaStrategy.run(
      dca({
        frequency: 'daily',
        amount: 0.1,
        startDate: utc('2024-01-01'),
        endDate: utc('2024-12-31'),
      }),
      dailyPrices,
    );
    expect(r.status).toBe('success');
    if (r.status !== 'success') return;
    // 366 versements de 0.10 € = 36.60 €. Tolérance ε flottant.
    expect(r.totalInvested).toBeCloseTo(36.6, 8);
    expect(Number.isFinite(r.averageBuyPrice)).toBe(true);
  });
});
