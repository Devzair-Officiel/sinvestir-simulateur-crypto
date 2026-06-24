import type { MarketPoint } from '@/types/simulation';
import type { CryptoPriceProvider, MarketChartParams } from './provider';
import { ProviderError } from './provider';

// ── Séries de prix en dur (EUR, pas journalier) ────────────
// À remplir avec les snapshots CoinGecko (format : { timestamp, price })

export const BTC_EUR_DAILY: readonly MarketPoint[] = [];

export const ETH_EUR_DAILY: readonly MarketPoint[] = [];

// ── Lookup par cryptoId ────────────────────────────────────

const FALLBACK_SERIES: ReadonlyMap<string, readonly MarketPoint[]> = new Map([
  ['bitcoin', BTC_EUR_DAILY],
  ['ethereum', ETH_EUR_DAILY],
]);

// ── Provider fallback ──────────────────────────────────────

export const fallbackProvider: CryptoPriceProvider = {
  async getMarketChart(params: MarketChartParams): Promise<MarketPoint[]> {
    const series = FALLBACK_SERIES.get(params.cryptoId);

    if (!series) {
      throw new ProviderError(
        'not-supported',
        `Pas de données fallback pour « ${params.cryptoId} ».`,
      );
    }

    const startTs = params.startDate.getTime();
    const endTs = params.endDate.getTime();

    return series.filter(
      (p) => p.timestamp >= startTs && p.timestamp <= endTs,
    );
  },
};
