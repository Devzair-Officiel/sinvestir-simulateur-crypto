import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/crypto/route';
import { NextRequest } from 'next/server';

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/crypto');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe('GET /api/crypto', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Pas de clé API → fallback direct
    vi.stubEnv('COINGECKO_API_KEY', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  // ── Validation des entrées ─────────────────────────────

  it('id manquant → 400', async () => {
    const res = await GET(makeRequest({ from: '2024-01-01', to: '2024-06-01' }));
    expect(res.status).toBe(400);
  });

  it('id hors allowlist → 400', async () => {
    const res = await GET(
      makeRequest({ id: 'dogecoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(400);
  });

  it('from invalide → 400', async () => {
    const res = await GET(
      makeRequest({ id: 'bitcoin', from: 'not-a-date', to: '2024-06-01' }),
    );
    expect(res.status).toBe(400);
  });

  it('from > to → 400', async () => {
    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-06-01', to: '2024-01-01' }),
    );
    expect(res.status).toBe(400);
  });

  it('to dans le futur → 400', async () => {
    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2099-01-01' }),
    );
    expect(res.status).toBe(400);
  });

  it('plage > 10 ans → 400', async () => {
    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2010-01-01', to: '2025-01-01' }),
    );
    expect(res.status).toBe(400);
  });

  // ── Fallback (pas de clé API) ──────────────────────────

  it('bitcoin sans clé API → 200 avec fallback (tableau vide pour l instant)', async () => {
    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('points');
    expect(Array.isArray(body.points)).toBe(true);
  });

  it('solana sans clé API, pas de fallback → 503', async () => {
    const res = await GET(
      makeRequest({ id: 'solana', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(503);
  });

  it('Cache-Control header présent sur réponse 200', async () => {
    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });

  // ── Avec clé API (CoinGecko mock) ─────────────────────

  it('CoinGecko 200 → retourne les points', async () => {
    vi.stubEnv('COINGECKO_API_KEY', 'real-key');

    const mockPrices = {
      prices: [
        [1704067200000, 38500],
        [1704153600000, 39100],
      ],
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockPrices), { status: 200 }),
    );

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.points).toHaveLength(2);
    expect(body.points[0]).toEqual({ timestamp: 1704067200000, price: 38500 });
  });

  it('CoinGecko 500 → fallback', async () => {
    vi.stubEnv('COINGECKO_API_KEY', 'real-key');

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('error', { status: 500, statusText: 'Internal Server Error' }),
    );

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    // Fallback sur bitcoin → 200 (vide pour l'instant)
    expect(res.status).toBe(200);
  });

  it('CoinGecko timeout → fallback', async () => {
    vi.stubEnv('COINGECKO_API_KEY', 'real-key');

    const abortError = new DOMException('aborted', 'AbortError');
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(200);
  });
});
