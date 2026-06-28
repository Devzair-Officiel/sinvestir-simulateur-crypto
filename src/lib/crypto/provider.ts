import type { CryptoId, MarketPoint } from '@/types/simulation';

// ── Paramètres d'appel provider ────────────────────────────

export interface MarketChartParams {
  cryptoId: CryptoId;
  startDate: Date;
  endDate: Date;
}

// ── Erreur typée (LSP : même classe pour tous les providers)

export class ProviderError extends Error {
  override readonly name = 'ProviderError';

  constructor(
    public readonly kind:
      | 'not-supported'
      | 'upstream'
      | 'timeout'
      | 'invalid-response',
    message: string,
  ) {
    super(message);
  }
}

// ── Interface provider (DIP) ───────────────────────────────

export interface CryptoPriceProvider {
  getMarketChart(params: MarketChartParams): Promise<MarketPoint[]>;
}
