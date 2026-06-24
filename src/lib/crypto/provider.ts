import { z } from 'zod';
import type { CryptoId, MarketPoint } from '@/types/simulation';
import { CRYPTO_IDS } from '@/types/simulation';

// ── Zod schemas ────────────────────────────────────────────

export const MarketPointSchema = z.object({
  timestamp: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
});

export const MarketChartResultSchema = z.object({
  points: z.array(MarketPointSchema),
});

export type MarketChartResult = z.infer<typeof MarketChartResultSchema>;

// ── Paramètres d'appel provider ────────────────────────────

export interface MarketChartParams {
  cryptoId: CryptoId;
  startDate: Date;
  endDate: Date;
}

// ── Allowlist Set (lookup O(1)) ────────────────────────────

export const CRYPTO_ALLOWLIST: ReadonlySet<string> = new Set<string>(CRYPTO_IDS);

// ── Erreur typée (LSP : même classe pour tous les providers)

export class ProviderError extends Error {
  override readonly name = 'ProviderError';

  constructor(
    public readonly kind:
      | 'not-supported'
      | 'upstream'
      | 'timeout'
      | 'invalid-response'
      | 'missing-config',
    message: string,
  ) {
    super(message);
  }
}

// ── Interface provider (DIP) ───────────────────────────────

export interface CryptoPriceProvider {
  getMarketChart(params: MarketChartParams): Promise<MarketPoint[]>;
}
