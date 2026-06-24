import { describe, it, expect } from 'vitest';
import {
  toUTCMidnight,
  generatePaymentDates,
  findLastPointBefore,
} from '../date-utils';

// ── toUTCMidnight ───────────────────────────────────────────

describe('toUTCMidnight', () => {
  it('normalise une date à minuit UTC', () => {
    const d = new Date('2024-03-15T14:30:45.123Z');
    const result = toUTCMidnight(d);
    expect(result.toISOString()).toBe('2024-03-15T00:00:00.000Z');
  });

  it('ne modifie pas la date originale', () => {
    const d = new Date('2024-03-15T14:30:00Z');
    const original = d.getTime();
    toUTCMidnight(d);
    expect(d.getTime()).toBe(original);
  });

  it('date déjà à minuit UTC reste identique', () => {
    const d = new Date('2024-06-01T00:00:00.000Z');
    expect(toUTCMidnight(d).getTime()).toBe(d.getTime());
  });
});

// ── generatePaymentDates ────────────────────────────────────

describe('generatePaymentDates', () => {
  // -- cadences de base --

  it('daily — dates quotidiennes entre start et end inclus', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-04T00:00:00Z');
    const dates = generatePaymentDates(start, end, 'daily');

    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(dates[1].toISOString()).toBe('2024-01-02T00:00:00.000Z');
    expect(dates[2].toISOString()).toBe('2024-01-03T00:00:00.000Z');
    expect(dates[3].toISOString()).toBe('2024-01-04T00:00:00.000Z');
  });

  it('weekly — dates hebdomadaires', () => {
    const start = new Date('2024-01-01T00:00:00Z');
    const end = new Date('2024-01-22T00:00:00Z');
    const dates = generatePaymentDates(start, end, 'weekly');

    expect(dates).toHaveLength(4); // Jan 1, 8, 15, 22
    expect(dates[0].toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(dates[1].toISOString()).toBe('2024-01-08T00:00:00.000Z');
    expect(dates[2].toISOString()).toBe('2024-01-15T00:00:00.000Z');
    expect(dates[3].toISOString()).toBe('2024-01-22T00:00:00.000Z');
  });

  it('monthly — dates mensuelles standard', () => {
    const start = new Date('2024-01-15T00:00:00Z');
    const end = new Date('2024-04-15T00:00:00Z');
    const dates = generatePaymentDates(start, end, 'monthly');

    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString()).toBe('2024-01-15T00:00:00.000Z');
    expect(dates[1].toISOString()).toBe('2024-02-15T00:00:00.000Z');
    expect(dates[2].toISOString()).toBe('2024-03-15T00:00:00.000Z');
    expect(dates[3].toISOString()).toBe('2024-04-15T00:00:00.000Z');
  });

  // -- clamp fin de mois --

  it('monthly — clamp 31 jan → 29 fév année bissextile, reprise 31 mars', () => {
    const start = new Date('2024-01-31T00:00:00Z'); // 2024 = bissextile
    const end = new Date('2024-03-31T00:00:00Z');
    const dates = generatePaymentDates(start, end, 'monthly');

    expect(dates).toHaveLength(3);
    expect(dates[0].toISOString()).toBe('2024-01-31T00:00:00.000Z');
    expect(dates[1].toISOString()).toBe('2024-02-29T00:00:00.000Z');
    expect(dates[2].toISOString()).toBe('2024-03-31T00:00:00.000Z');
  });

  it('monthly — clamp 31 jan → 28 fév année non-bissextile, reprise 31 mars', () => {
    const start = new Date('2023-01-31T00:00:00Z'); // 2023 = non-bissextile
    const end = new Date('2023-03-31T00:00:00Z');
    const dates = generatePaymentDates(start, end, 'monthly');

    expect(dates).toHaveLength(3);
    expect(dates[0].toISOString()).toBe('2023-01-31T00:00:00.000Z');
    expect(dates[1].toISOString()).toBe('2023-02-28T00:00:00.000Z');
    expect(dates[2].toISOString()).toBe('2023-03-31T00:00:00.000Z');
  });

  // -- bornes --

  it('start = end — une seule date', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    const dates = generatePaymentDates(date, date, 'monthly');

    expect(dates).toHaveLength(1);
    expect(dates[0].toISOString()).toBe('2024-06-15T00:00:00.000Z');
  });

  it('end < start — tableau vide', () => {
    const start = new Date('2024-06-15T00:00:00Z');
    const end = new Date('2024-01-01T00:00:00Z');
    const dates = generatePaymentDates(start, end, 'monthly');

    expect(dates).toHaveLength(0);
  });
});

// ── findLastPointBefore ─────────────────────────────────────

describe('findLastPointBefore', () => {
  const items = [
    { timestamp: 100 },
    { timestamp: 200 },
    { timestamp: 300 },
    { timestamp: 400 },
    { timestamp: 500 },
  ];

  it('retourne le point exact quand il existe', () => {
    expect(findLastPointBefore(items, 300)).toEqual({ timestamp: 300 });
  });

  it('retourne le dernier point <= target entre deux points', () => {
    expect(findLastPointBefore(items, 250)).toEqual({ timestamp: 200 });
  });

  it('retourne null si target est avant tout point', () => {
    expect(findLastPointBefore(items, 50)).toBeNull();
  });

  it('retourne le dernier point si target est après tout', () => {
    expect(findLastPointBefore(items, 600)).toEqual({ timestamp: 500 });
  });

  it('retourne null pour une série vide', () => {
    expect(findLastPointBefore([], 100)).toBeNull();
  });

  it('retourne le seul élément si timestamp <= target', () => {
    expect(findLastPointBefore([{ timestamp: 100 }], 100)).toEqual({
      timestamp: 100,
    });
  });

  it('retourne null si le seul élément est > target', () => {
    expect(findLastPointBefore([{ timestamp: 200 }], 100)).toBeNull();
  });
});
