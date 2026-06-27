'use client';

import SimulationForm from './SimulationForm';
import ResultSummary from './ResultSummary';
import PerformanceChart from './PerformanceChart';
import Disclaimer from './Disclaimer';
import { useSimulation } from './useSimulation';

// ── Props ──────────────────────────────────────────────────

interface Props {
  mode: 'full' | 'embed';
}

// ── Composant ──────────────────────────────────────────────

export default function CryptoSimulator({ mode }: Props) {
  const { state, run, retry } = useSimulation();

  return (
    <div className={mode === 'full' ? 'mx-auto max-w-6xl px-4' : 'mx-auto max-w-5xl px-4'}>
      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <SimulationForm onSubmit={run} loading={state.phase === 'loading'} />

        <div className="flex min-h-[200px] items-start">
          {state.phase === 'idle' && (
            <p className="self-center text-sm text-ink-muted">
              Renseignez les paramètres et lancez la simulation.
            </p>
          )}

          {state.phase === 'loading' && (
            <div className="flex w-full items-center justify-center self-center">
              <svg className="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {state.phase === 'error' && (
            <div className="self-center text-center">
              <p className="text-sm text-orange-400">{state.message}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 text-sm text-accent underline underline-offset-2 hover:text-white"
              >
                Réessayer
              </button>
            </div>
          )}

          {state.phase === 'success' && (
            <ResultSummary
              result={state.result}
              cryptoId={state.lastParams.cryptoId}
              mode={state.lastParams.mode}
              frequency={state.lastParams.frequency}
              startDate={state.lastParams.startDate}
              endDate={state.lastParams.endDate}
            />
          )}
        </div>
      </section>

      {state.phase === 'success' && (
        <div className="mt-6">
          <PerformanceChart timeline={state.result.timeline} />
        </div>
      )}

      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  );
}
