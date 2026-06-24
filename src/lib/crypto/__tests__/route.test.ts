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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  // ── Kraken OK → 200 ───────────────────────────────────

  it('Kraken 200 → retourne les points', async () => {
    const krakenResponse = {
      error: [],
      result: {
        XXBTZEUR: [
          [1704067200, '42000.0', '43000.0', '41000.0', '42500.0', '42200.0', '1000.0', 5000],
          [1704672000, '42500.0', '44000.0', '42000.0', '43800.0', '43100.0', '900.0', 4500],
        ],
        last: 1704672000,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(krakenResponse), { status: 200 }),
    );

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.points).toHaveLength(2);
    expect(body.points[0]).toEqual({ timestamp: 1704067200000, price: 42500 });
  });

  // ── Kraken échoue → fallback ───────────────────────────

  it('Kraken 500 → fallback bitcoin (données en dur)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('error', { status: 500, statusText: 'Internal Server Error' }),
    );

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    // Fallback BTC existe → 200
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.points.length).toBeGreaterThan(0);
  });

  it('Kraken timeout → fallback', async () => {
    const abortError = new DOMException('aborted', 'AbortError');
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(200);
  });

  it('solana (pas dans Kraken ni fallback) → 503', async () => {
    // Kraken rejette solana (not-supported), fallback aussi
    const res = await GET(
      makeRequest({ id: 'solana', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.status).toBe(503);
  });

  it('Cache-Control header présent sur réponse 200', async () => {
    const krakenResponse = {
      error: [],
      result: {
        XXBTZEUR: [
          [1704067200, '42000.0', '43000.0', '41000.0', '42500.0', '42200.0', '1000.0', 5000],
        ],
        last: 1704067200,
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(krakenResponse), { status: 200 }),
    );

    const res = await GET(
      makeRequest({ id: 'bitcoin', from: '2024-01-01', to: '2024-06-01' }),
    );
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
  });
});
