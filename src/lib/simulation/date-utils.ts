import type { DcaFrequency } from '@/types/simulation';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Normalise une date à minuit UTC (supprime h/m/s/ms).
 * Ne modifie pas l'objet reçu.
 */
export function toUTCMidnight(date: Date): Date {
  const d = new Date(date.getTime());
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Génère les dates de versement entre `start` et `end` (bornes incluses)
 * selon la fréquence donnée. Toutes les dates sont normalisées à minuit UTC.
 *
 * Pour `monthly`, le jour cible est celui de `start`. Si ce jour dépasse
 * le dernier jour du mois cible, il est clampé au dernier jour du mois,
 * puis reprend le jour cible dès que le mois le permet.
 */
export function generatePaymentDates(
  start: Date,
  end: Date,
  frequency: DcaFrequency,
): Date[] {
  const startUTC = toUTCMidnight(start);
  const endTs = toUTCMidnight(end).getTime();

  if (endTs < startUTC.getTime()) return [];

  const dates: Date[] = [];
  const targetDay = startUTC.getUTCDate();
  const startMonth = startUTC.getUTCMonth();
  const startYear = startUTC.getUTCFullYear();

  for (let i = 0; ; i++) {
    let next: Date;

    switch (frequency) {
      case 'daily':
        next = new Date(startUTC.getTime() + i * MS_PER_DAY);
        break;

      case 'weekly':
        next = new Date(startUTC.getTime() + i * 7 * MS_PER_DAY);
        break;

      case 'monthly': {
        const totalMonths = startMonth + i;
        const year = startYear + Math.floor(totalMonths / 12);
        const month = totalMonths % 12;
        const lastDayOfMonth = new Date(
          Date.UTC(year, month + 1, 0),
        ).getUTCDate();
        const day = Math.min(targetDay, lastDayOfMonth);
        next = new Date(Date.UTC(year, month, day));
        break;
      }
    }

    if (next.getTime() > endTs) break;
    dates.push(next);
  }

  return dates;
}

/**
 * Recherche binaire : retourne le dernier élément dont `timestamp ≤ target`,
 * ou `null` si aucun. Les éléments doivent être triés par `timestamp` croissant.
 */
export function findLastPointBefore<T extends { timestamp: number }>(
  items: T[],
  target: number,
): T | null {
  if (items.length === 0) return null;

  let low = 0;
  let high = items.length - 1;
  let result: T | null = null;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    if (items[mid].timestamp <= target) {
      result = items[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return result;
}
