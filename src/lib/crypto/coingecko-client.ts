import { z } from 'zod';
import type { MarketPoint } from '@/types/simulation';
import type { CryptoPriceProvider, MarketChartParams } from './provider';
import { CRYPTO_ALLOWLIST, ProviderError } from './provider';

// ── Configuration ──────────────────────────────────────────

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 8_000;

// ── Schéma de validation de la réponse CoinGecko ───────────
// /coins/{id}/market_chart/range renvoie { prices: [[timestamp, price], ...] }

const CoinGeckoMarketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});

// ── Provider CoinGecko ─────────────────────────────────────

export function createCoinGeckoProvider(apiKey: string): CryptoPriceProvider {
  return {
    async getMarketChart(params: MarketChartParams): Promise<MarketPoint[]> {
      // Allowlist check (anti-SSRF)
      if (!CRYPTO_ALLOWLIST.has(params.cryptoId)) {
        throw new ProviderError(
          'not-supported',
          `Crypto « ${params.cryptoId} » hors allowlist.`,
        );
      }

      const fromSec = Math.floor(params.startDate.getTime() / 1000);
      const toSec = Math.floor(params.endDate.getTime() / 1000);

      const url = `${COINGECKO_BASE}/coins/${params.cryptoId}/market_chart/range?vs_currency=eur&from=${fromSec}&to=${toSec}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            ...(apiKey ? { 'x-cg-demo-api-key': apiKey } : {}),
          },
          signal: controller.signal,
        });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          throw new ProviderError('timeout', 'CoinGecko timeout (8 s).');
        }
        throw new ProviderError(
          'upstream',
          `Erreur réseau CoinGecko : ${err instanceof Error ? err.message : String(err)}`,
        );
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        throw new ProviderError(
          'upstream',
          `CoinGecko ${response.status} ${response.statusText}`,
        );
      }

      // Parse + validate
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        throw new ProviderError(
          'invalid-response',
          'Réponse CoinGecko non-JSON.',
        );
      }

      const parsed = CoinGeckoMarketChartSchema.safeParse(body);
      if (!parsed.success) {
        throw new ProviderError(
          'invalid-response',
          'Réponse CoinGecko ne correspond pas au schéma attendu.',
        );
      }

      return parsed.data.prices.map(([timestamp, price]) => ({
        timestamp,
        price,
      }));
    },
  };
}
