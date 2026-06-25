import type {
  SimulationStrategy,
  TimelinePoint,
} from '@/types/simulation';
import { generatePaymentDates, findLastPointBefore } from './date-utils';

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

interface Payment {
  timestamp: number;
  investedAfter: number;
  quantityAfter: number;
}

export const dcaStrategy: SimulationStrategy<'dca'> = {
  run(params, prices) {
    const { amount, frequency, startDate, endDate } = params;
    const startTs = startDate.getTime();
    const endTs = endDate.getTime();

    if (endTs < startTs) {
      return {
        status: 'error',
        code: 'invalid-date-range',
        message: 'La date de fin est antérieure à la date de début.',
      };
    }

    if (prices.length === 0) {
      return {
        status: 'error',
        code: 'no-price-data',
        message: 'Aucune donnée de prix disponible.',
      };
    }

    // ── Versements ──────────────────────────────────────────
    const paymentDates = generatePaymentDates(startDate, endDate, frequency);

    let totalInvested = 0;
    let totalQuantity = 0;
    let paymentCount = 0;
    const payments: Payment[] = [];

    for (const date of paymentDates) {
      const point = findLastPointBefore(prices, date.getTime());
      if (!point || !isValidPrice(point.price)) continue;

      totalInvested += amount;
      totalQuantity += amount / point.price;
      paymentCount++;

      payments.push({
        timestamp: date.getTime(),
        investedAfter: totalInvested,
        quantityAfter: totalQuantity,
      });
    }

    // ── Timeline au pas des données prix ────────────────────
    const relevantPrices = prices.filter(
      (p) =>
        p.timestamp >= startTs &&
        p.timestamp <= endTs &&
        isValidPrice(p.price),
    );

    const timeline: TimelinePoint[] = [];
    let paymentIdx = 0;
    let currentInvested = 0;
    let currentQuantity = 0;

    for (const p of relevantPrices) {
      while (
        paymentIdx < payments.length &&
        payments[paymentIdx].timestamp <= p.timestamp
      ) {
        currentInvested = payments[paymentIdx].investedAfter;
        currentQuantity = payments[paymentIdx].quantityAfter;
        paymentIdx++;
      }

      timeline.push({
        timestamp: p.timestamp,
        invested: currentInvested,
        value: currentQuantity * p.price,
      });
    }

    // ── Résultat ────────────────────────────────────────────
    const finalValue =
      timeline.length > 0 ? timeline[timeline.length - 1].value : 0;
    const gainLoss = finalValue - totalInvested;
    const performance = totalInvested !== 0 ? gainLoss / totalInvested : 0;
    const averageBuyPrice =
      totalQuantity !== 0 ? totalInvested / totalQuantity : 0;

    return {
      status: 'success',
      totalInvested,
      finalValue,
      gainLoss,
      performance,
      paymentCount,
      averageBuyPrice,
      totalQuantity,
      timeline,
    };
  },
};
