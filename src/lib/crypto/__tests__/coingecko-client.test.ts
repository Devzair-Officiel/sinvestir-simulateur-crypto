import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCoinGeckoProvider } from '../coingecko-client';
import { ProviderError } from '../provider';

function utc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

const VALID_RESPONSE = {
  prices: [
    [1704067200000, 38500.12],
    [1704153600000, 39100.55],
    [1704240000000, 39800.0],
  ],
};

describe('createCoinGeckoProvider', () => {
  const provider = createCoinGeckoProvider('test-key');

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('crypto hors allowlist → ProviderError not-supported (pas de fetch)', async () => {
    const fetchMock = vi.mocked(fetch);

    await expect(
      provider.getMarketChart({
        cryptoId: 'dogecoin' as never,
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      }),
    ).rejects.toThrow(ProviderError);

    try {
      await provider.getMarketChart({
        cryptoId: 'dogecoin' as never,
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      });
    } catch (err) {
      expect((err as ProviderError).kind).toBe('not-supported');
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('réponse 200 valide → tableau de MarketPoint', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    const result = await provider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-01-03'),
    });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ timestamp: 1704067200000, price: 38500.12 });
  });

  it(`envoie l'API key dans le header x-cg-demo-api-key`, async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    await provider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-01-03'),
    });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const headers = callArgs[1]?.headers as Record<string, string>;
    expect(headers['x-cg-demo-api-key']).toBe('test-key');
  });

  it('HTTP 429 → ProviderError upstream', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('rate limited', { status: 429, statusText: 'Too Many Requests' }),
    );

    try {
      await provider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-03'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('upstream');
    }
  });

  it('HTTP 500 → ProviderError upstream', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('server error', { status: 500, statusText: 'Internal Server Error' }),
    );

    try {
      await provider.getMarketChart({
        cryptoId: 'ethereum',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-03'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('upstream');
    }
  });

  it('réponse non-JSON → ProviderError invalid-response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('not json at all', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );

    try {
      await provider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-03'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('invalid-response');
    }
  });

  it('réponse JSON invalide (schéma) → ProviderError invalid-response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ prices: 'not an array' }), { status: 200 }),
    );

    try {
      await provider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-03'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('invalid-response');
    }
  });

  it('erreur réseau → ProviderError upstream', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    try {
      await provider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-03'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('upstream');
    }
  });

  it('abort (timeout) → ProviderError timeout', async () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    try {
      await provider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-03'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('timeout');
    }
  });

  it(`construit l'URL avec les bons paramètres (from/to en secondes)`, async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    await provider.getMarketChart({
      cryptoId: 'ethereum',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-06-30'),
    });

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('/coins/ethereum/market_chart/range');
    expect(calledUrl).toContain('vs_currency=eur');
    // 2024-01-01T00:00:00Z = 1704067200
    expect(calledUrl).toContain('from=1704067200');
    // 2024-06-30T00:00:00Z = 1719705600
    expect(calledUrl).toContain('to=1719705600');
  });
});
