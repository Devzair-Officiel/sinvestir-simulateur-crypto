import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { krakenProvider } from '../kraken-client';
import { ProviderError } from '../provider';

function utc(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

const VALID_RESPONSE = {
  error: [],
  result: {
    XXBTZEUR: [
      [1704067200, '42000.0', '43000.0', '41000.0', '42500.0', '42200.0', '1000.0', 5000],
      [1704672000, '42500.0', '44000.0', '42000.0', '43800.0', '43100.0', '900.0', 4500],
      [1705276800, '43800.0', '45000.0', '43000.0', '44200.0', '44000.0', '800.0', 4000],
    ],
    last: 1705276800,
  },
};

const ETH_RESPONSE = {
  error: [],
  result: {
    XETHZEUR: [
      [1704067200, '2200.0', '2300.0', '2100.0', '2250.0', '2220.0', '5000.0', 3000],
    ],
    last: 1704067200,
  },
};

describe('krakenProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('crypto non supportée (solana) → ProviderError not-supported, pas de fetch', async () => {
    const fetchMock = vi.mocked(fetch);

    try {
      await krakenProvider.getMarketChart({
        cryptoId: 'solana',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('not-supported');
    }

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('réponse 200 valide BTC → tableau de MarketPoint', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    const result = await krakenProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-02-01'),
    });

    expect(result).toHaveLength(3);
    // close = index 4 = '42500.0', time * 1000
    expect(result[0]).toEqual({ timestamp: 1704067200000, price: 42500 });
    expect(result[1]).toEqual({ timestamp: 1704672000000, price: 43800 });
  });

  it('réponse 200 valide ETH → utilise la bonne paire', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(ETH_RESPONSE), { status: 200 }),
    );

    const result = await krakenProvider.getMarketChart({
      cryptoId: 'ethereum',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-02-01'),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ timestamp: 1704067200000, price: 2250 });
  });

  it(`construit l'URL avec pair, interval=10080 et since en secondes`, async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }),
    );

    await krakenProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-06-30'),
    });

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(calledUrl).toContain('pair=XXBTZEUR');
    expect(calledUrl).toContain('interval=10080');
    // 2024-01-01T00:00:00Z = 1704067200
    expect(calledUrl).toContain('since=1704067200');
  });

  it('filtre les points au-delà de endDate', async () => {
    const responseWithFuture = {
      error: [],
      result: {
        XXBTZEUR: [
          [1704067200, '42000.0', '43000.0', '41000.0', '42500.0', '42200.0', '1000.0', 5000],
          // Ce point est au-delà de endDate (2024-01-08 = 1704672000)
          [1705276800, '43800.0', '45000.0', '43000.0', '44200.0', '44000.0', '800.0', 4000],
        ],
        last: 1705276800,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(responseWithFuture), { status: 200 }),
    );

    const result = await krakenProvider.getMarketChart({
      cryptoId: 'bitcoin',
      startDate: utc('2024-01-01'),
      endDate: utc('2024-01-08'),
    });

    // Seul le premier point (1704067200 * 1000 <= 2024-01-08)
    expect(result).toHaveLength(1);
  });

  it('HTTP 500 → ProviderError upstream', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('server error', { status: 500, statusText: 'Internal Server Error' }),
    );

    try {
      await krakenProvider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('upstream');
    }
  });

  it('Kraken error non-vide → ProviderError upstream', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: ['EGeneral:Too many requests'], result: {} }),
        { status: 200 },
      ),
    );

    try {
      await krakenProvider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('upstream');
    }
  });

  it('réponse non-JSON → ProviderError invalid-response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('not json', { status: 200 }),
    );

    try {
      await krakenProvider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('invalid-response');
    }
  });

  it('réponse JSON invalide (schéma) → ProviderError invalid-response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ wrong: 'shape' }), { status: 200 }),
    );

    try {
      await krakenProvider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
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
      await krakenProvider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
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
      await krakenProvider.getMarketChart({
        cryptoId: 'bitcoin',
        startDate: utc('2024-01-01'),
        endDate: utc('2024-01-31'),
      });
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ProviderError);
      expect((err as ProviderError).kind).toBe('timeout');
    }
  });
});
