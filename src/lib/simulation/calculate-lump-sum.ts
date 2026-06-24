import type { SimulationStrategy, MarketPoint } from '@/types/simulation';
import { findLastPointBefore } from './date-utils';

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

export const lumpSumStrategy: SimulationStrategy<'lump-sum'> = {
  run(params, prices) {
    const { amount, startDate, endDate } = params;
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

    const startPoint = findLastPointBefore(prices, startTs);

    if (!startPoint || !isValidPrice(startPoint.price)) {
      return {
        status: 'error',
        code: 'no-price-data',
        message: 'Aucun prix valide trouvé à la date de début.',
      };
    }

    const quantity = amount / startPoint.price;

    // Timeline : tous les points valides entre start et end
    const timeline = prices
      .filter(
        (p) =>
          p.timestamp >= startTs &&
          p.timestamp <= endTs &&
          isValidPrice(p.price),
      )
      .map((p) => ({
        timestamp: p.timestamp,
        invested: amount,
        value: quantity * p.price,
      }));

    // Valeur finale = dernier point valide, fallback au prix d'achat
    const endPoint = findLastPointBefore(prices, endTs);
    const finalPrice =
      endPoint && isValidPrice(endPoint.price)
        ? endPoint.price
        : startPoint.price;

    const finalValue = quantity * finalPrice;
    const gainLoss = finalValue - amount;
    const performance = amount !== 0 ? gainLoss / amount : 0;

    return {
      status: 'success',
      totalInvested: amount,
      finalValue,
      gainLoss,
      performance,
      paymentCount: 1,
      averageBuyPrice: startPoint.price,
      totalQuantity: quantity,
      timeline,
    };
  },
};
