import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CRYPTO_IDS } from '@/types/simulation';
import { krakenProvider } from '@/lib/crypto/kraken-client';
import { fallbackProvider } from '@/lib/crypto/fallback-data';
import { ProviderError } from '@/lib/crypto/provider';

// ── Validation des query params ────────────────────────────

const QuerySchema = z.object({
  id: z.enum(CRYPTO_IDS),
  from: z.string().date(),
  to: z.string().date(),
}).refine(
  (d) => new Date(d.from) < new Date(d.to),
  { message: 'from doit être antérieur à to.' },
).refine(
  (d) => new Date(d.to) <= new Date(),
  { message: 'to ne peut pas être dans le futur.' },
).refine(
  (d) => {
    const diffMs = new Date(d.to).getTime() - new Date(d.from).getTime();
    const fifteenYearsMs = 15 * 365.25 * 24 * 60 * 60 * 1000;
    return diffMs <= fifteenYearsMs;
  },
  { message: 'La plage ne peut pas dépasser 15 ans.' },
);

// ── Handler GET ────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = QuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides.' },
      { status: 400 },
    );
  }

  const { id, from, to } = parsed.data;
  const startDate = new Date(`${from}T00:00:00.000Z`);
  const endDate = new Date(`${to}T00:00:00.000Z`);

  // ── Essai Kraken → fallback ──────────────────────────────

  try {
    const points = await krakenProvider.getMarketChart({
      cryptoId: id,
      startDate,
      endDate,
    });

    return NextResponse.json(
      { points },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
      },
    );
  } catch {
    // Kraken échoue (not-supported, upstream, timeout, invalid-response) → fallback
  }

  // ── Fallback ─────────────────────────────────────────────

  try {
    const points = await fallbackProvider.getMarketChart({
      cryptoId: id,
      startDate,
      endDate,
    });

    return NextResponse.json(
      { points },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
      },
    );
  } catch (err: unknown) {
    if (err instanceof ProviderError && err.kind === 'not-supported') {
      return NextResponse.json(
        { error: 'Crypto non disponible.' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'Service temporairement indisponible.' },
      { status: 503 },
    );
  }
}
