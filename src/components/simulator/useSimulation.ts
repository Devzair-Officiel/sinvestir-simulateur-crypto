import { useCallback, useRef, useState } from 'react';
import type { FormValues } from './SimulationForm';
import type { CryptoId, DcaFrequency, InvestmentMode, MarketPoint, SimulationResult } from '@/types/simulation';
import { toUTCMidnight } from '@/lib/simulation/date-utils';
import { dcaStrategy } from '@/lib/simulation/calculate-dca';
import { lumpSumStrategy } from '@/lib/simulation/calculate-lump-sum';

// ── Types d'état ───────────────────────────────────────────

export interface SubmittedParams {
  cryptoId: CryptoId;
  mode: InvestmentMode;
  frequency: DcaFrequency;
  startDate: string;
  endDate: string;
}

export type SimulatorState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'success'; result: Extract<SimulationResult, { status: 'success' }>; lastParams: SubmittedParams };

// ── Hook ───────────────────────────────────────────────────

export function useSimulation() {
  const [state, setState] = useState<SimulatorState>({ phase: 'idle' });
  const lastFv = useRef<FormValues | null>(null);

  const run = useCallback(async (fv: FormValues) => {
    lastFv.current = fv;
    setState({ phase: 'loading' });

    // 1. Fetch prices from /api/crypto
    let points: MarketPoint[];
    try {
      const qs = new URLSearchParams({ id: fv.cryptoId, from: fv.startDate, to: fv.endDate });
      const res = await fetch(`/api/crypto?${qs}`);
      if (!res.ok) {
        const msg =
          res.status === 503
            ? 'Les données pour cette crypto ne sont pas disponibles actuellement. Essayez Bitcoin ou Ethereum.'
            : 'Une erreur est survenue. Veuillez réessayer.';
        setState({ phase: 'error', message: msg });
        return;
      }
      const json = (await res.json()) as { points: MarketPoint[] };
      points = json.points;
    } catch {
      setState({
        phase: 'error',
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      });
      return;
    }

    // 2. Build params (string dates → UTC Date)
    const startDate = toUTCMidnight(new Date(`${fv.startDate}T00:00:00.000Z`));
    const endDate = toUTCMidnight(new Date(`${fv.endDate}T00:00:00.000Z`));

    // 3. Run strategy
    const result =
      fv.mode === 'dca'
        ? dcaStrategy.run(
            { mode: 'dca', cryptoId: fv.cryptoId, amount: fv.amount, frequency: fv.frequency, startDate, endDate },
            points,
          )
        : lumpSumStrategy.run(
            { mode: 'lump-sum', cryptoId: fv.cryptoId, amount: fv.amount, startDate, endDate },
            points,
          );

    if (result.status === 'error') {
      const msg =
        result.code === 'invalid-date-range'
          ? 'La plage de dates est invalide.'
          : 'Aucune donnée de prix disponible pour cette période.';
      setState({ phase: 'error', message: msg });
      return;
    }

    setState({
      phase: 'success',
      result,
      lastParams: {
        cryptoId: fv.cryptoId,
        mode: fv.mode,
        frequency: fv.frequency,
        startDate: fv.startDate,
        endDate: fv.endDate,
      },
    });
  }, []);

  const retry = useCallback(() => {
    if (lastFv.current) run(lastFv.current);
  }, [run]);

  return { state, run, retry };
}
