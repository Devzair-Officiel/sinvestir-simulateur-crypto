import type { CryptoId, InvestmentMode, SimulationResult } from '@/types/simulation';
import { formatCurrency, formatPercent } from '@/lib/simulation/format-money';

// ── Props ──────────────────────────────────────────────────

interface Props {
  result: SimulationResult & { status: 'success' };
  cryptoId: CryptoId;
  mode: InvestmentMode;
  startDate: string;
  endDate: string;
}

// ── Labels ─────────────────────────────────────────────────

const CRYPTO_NAMES: Record<CryptoId, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  solana: 'Solana',
  binancecoin: 'BNB',
  ripple: 'XRP',
  cardano: 'Cardano',
};

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

// ── Composant ──────────────────────────────────────────────

export default function ResultSummary({ result, cryptoId, mode, startDate, endDate }: Props) {
  const r = result;
  const positive = r.gainLoss >= 0;
  const colorCls = positive ? 'text-accent' : 'text-orange-400';

  const narrative =
    mode === 'dca'
      ? `En investissant ${formatCurrency(r.totalInvested / r.paymentCount)} par versement en ${CRYPTO_NAMES[cryptoId]} de ${fmtDate(startDate)} à ${fmtDate(endDate)}, votre portefeuille vaudrait ${formatCurrency(r.finalValue)}.`
      : `En investissant ${formatCurrency(r.totalInvested)} en ${CRYPTO_NAMES[cryptoId]} en ${fmtDate(startDate)}, votre portefeuille vaudrait ${formatCurrency(r.finalValue)} en ${fmtDate(endDate)}.`;

  const kpis: { label: string; value: string; color?: string }[] = [
    { label: 'Total investi', value: formatCurrency(r.totalInvested) },
    { label: 'Valeur finale', value: formatCurrency(r.finalValue) },
    { label: 'Plus / moins-value', value: `${positive ? '+' : ''}${formatCurrency(r.gainLoss)}`, color: colorCls },
    { label: 'Performance', value: `${positive ? '+' : ''}${formatPercent(r.performance)}`, color: colorCls },
    { label: 'Nb. versements', value: String(r.paymentCount) },
    { label: 'Prix moyen d\u2019achat', value: formatCurrency(r.averageBuyPrice) },
  ];

  return (
    <section aria-label="Résultats de la simulation">
      {/* Phrase narrative */}
      <p className="mb-4 text-sm leading-relaxed text-ink-muted sm:text-base">
        {narrative}
        {' '}
        <span className="text-ink-faint">
          ({r.totalQuantity.toFixed(6)} {CRYPTO_NAMES[cryptoId]} accumulés)
        </span>
      </p>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-white/6 bg-surface-soft p-4"
          >
            <p className="text-xs text-ink-muted">{kpi.label}</p>
            <p className={`mt-1 text-lg font-bold tracking-tight ${kpi.color ?? 'text-ink'}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
