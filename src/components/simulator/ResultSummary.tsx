import type { SimulationResult } from '@/types/simulation';
import { formatCurrency, formatPercent } from '@/lib/simulation/format-money';
import { getCryptoName } from '@/lib/crypto/crypto-metadata';
import type { SubmittedParams } from './useSimulation';

// ── Props ──────────────────────────────────────────────────

interface Props {
  result: Extract<SimulationResult, { status: 'success' }>;
  params: SubmittedParams;
}

// ── Labels ─────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

// Libellé unité pour le compte de versements selon le mode/fréquence.
// "78 mois", "443 semaines", ou "versement unique" pour le lump-sum.
function paymentsLabel(params: SubmittedParams, count: number): string {
  if (params.mode === 'lump-sum') return 'versement unique';
  switch (params.frequency) {
    case 'weekly':  return `${count} semaines`;
    case 'monthly': return `${count} mois`;
    case 'daily':   return `${count} jours`;
  }
}

// ── Composant ──────────────────────────────────────────────

export default function ResultSummary({ result, params }: Props) {
  const r = result;
  const { cryptoId, mode, startDate, endDate } = params;
  const positive = r.gainLoss >= 0;
  const colorCls = positive ? 'text-accent' : 'text-orange-400';
  const periodLabel = paymentsLabel(params, r.paymentCount);
  const cryptoName = getCryptoName(cryptoId);

  const narrative =
    mode === 'dca'
      ? `En investissant ${formatCurrency(r.totalInvested)} en ${cryptoName} en ${periodLabel} (de ${fmtDate(startDate)} à ${fmtDate(endDate)}), votre portefeuille vaudrait ${formatCurrency(r.finalValue)}.`
      : `En investissant ${formatCurrency(r.totalInvested)} en ${cryptoName} en ${fmtDate(startDate)}, votre portefeuille vaudrait ${formatCurrency(r.finalValue)} en ${fmtDate(endDate)}.`;

  const kpis: { label: string; value: string; color?: string }[] = [
    { label: 'Total investi', value: formatCurrency(r.totalInvested) },
    { label: 'Valeur finale', value: formatCurrency(r.finalValue) },
    { label: 'Gain / Perte', value: `${positive ? '+' : ''}${formatCurrency(r.gainLoss)}`, color: colorCls },
    { label: 'Performance', value: `${positive ? '+' : ''}${formatPercent(r.performance)}`, color: colorCls },
    { label: 'Versements', value: periodLabel },
    { label: 'Prix moyen d\u2019achat', value: formatCurrency(r.averageBuyPrice) },
  ];

  return (
    <section aria-label="Résultats de la simulation">
      {/* Phrase narrative */}
      <p className="mb-4 text-sm leading-relaxed text-ink-muted sm:text-base">
        {narrative}
        {' '}
        <span className="text-ink-faint">
          ({r.totalQuantity.toFixed(6)} {cryptoName} accumulés)
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
