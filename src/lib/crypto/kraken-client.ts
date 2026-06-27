import { z } from 'zod';
import type { CryptoId, MarketPoint } from '@/types/simulation';
import type { CryptoPriceProvider, MarketChartParams } from './provider';
import { ProviderError } from './provider';

// ── Configuration ──────────────────────────────────────────

const KRAKEN_BASE = 'https://api.kraken.com/0/public/OHLC';
const TIMEOUT_MS = 8_000;
const INTERVAL_WEEKLY = 10080; // minutes
const INTERVAL_WEEKLY_SECONDS = INTERVAL_WEEKLY * 60; // 604 800 s

// ── Mapping CryptoId → paire Kraken ────────────────────────

const KRAKEN_PAIRS: ReadonlyMap<CryptoId, string> = new Map([
  ['bitcoin', 'XXBTZEUR'],
  ['ethereum', 'XETHZEUR'],
]);

// ── Schéma de validation de la réponse Kraken ──────────────
// OHLC renvoie { error: [], result: { [pair]: [[time, o, h, l, close, vwap, vol, count], ...], last: N } }
// Chaque candle : [number, string, string, string, string, string, string, number]

const KrakenOhlcRowSchema = z.tuple([
  z.number(),  // time (Unix s)
  z.string(),  // open
  z.string(),  // high
  z.string(),  // low
  z.string(),  // close (index 4)
  z.string(),  // vwap
  z.string(),  // volume
  z.number(),  // count
]);

const KrakenResponseSchema = z.object({
  error: z.array(z.string()),
  result: z.record(z.string(), z.unknown()),
});

// ── Provider Kraken ────────────────────────────────────────

export const krakenProvider: CryptoPriceProvider = {
  async getMarketChart(params: MarketChartParams): Promise<MarketPoint[]> {
    const pair = KRAKEN_PAIRS.get(params.cryptoId);

    if (!pair) {
      throw new ProviderError(
        'not-supported',
        `Crypto « ${params.cryptoId} » non supportée par Kraken.`,
      );
    }

    // since= est exclusif côté Kraken : on recule d'une semaine pour
    // récupérer la chandelle d'ancrage (dernier point ≤ startDate). Le
    // moteur lump-sum en a besoin pour fixer le prix d'achat.
    const since =
      Math.floor(params.startDate.getTime() / 1000) - INTERVAL_WEEKLY_SECONDS;
    const endMs = params.endDate.getTime();

    const url = `${KRAKEN_BASE}?pair=${pair}&interval=${INTERVAL_WEEKLY}&since=${since}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new ProviderError('timeout', 'Kraken timeout (8 s).');
      }
      throw new ProviderError(
        'upstream',
        `Erreur réseau Kraken : ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new ProviderError(
        'upstream',
        `Kraken ${response.status} ${response.statusText}`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ProviderError('invalid-response', 'Réponse Kraken non-JSON.');
    }

    const envelope = KrakenResponseSchema.safeParse(body);
    if (!envelope.success) {
      throw new ProviderError(
        'invalid-response',
        'Réponse Kraken ne correspond pas au schéma attendu.',
      );
    }

    if (envelope.data.error.length > 0) {
      throw new ProviderError(
        'upstream',
        `Kraken error: ${envelope.data.error.join(', ')}`,
      );
    }

    const pairData = envelope.data.result[pair];
    if (!pairData) {
      throw new ProviderError(
        'invalid-response',
        `Paire « ${pair} » absente de la réponse Kraken.`,
      );
    }

    const rows = z.array(KrakenOhlcRowSchema).safeParse(pairData);
    if (!rows.success) {
      throw new ProviderError(
        'invalid-response',
        'Données OHLC Kraken ne correspondent pas au schéma attendu.',
      );
    }

    const points: MarketPoint[] = rows.data.map((row) => ({
      timestamp: row[0] * 1000,
      price: parseFloat(row[4]),
    }));

    return points.filter((p) => p.timestamp <= endMs);
  },
};
