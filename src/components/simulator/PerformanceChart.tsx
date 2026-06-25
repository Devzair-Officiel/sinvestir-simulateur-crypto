'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimelinePoint } from '@/types/simulation';
import { formatCurrency } from '@/lib/simulation/format-money';

// ── Props ──────────────────────────────────────────────────

interface Props {
  timeline: TimelinePoint[];
}

// ── Formateurs ─────────────────────────────────────────────

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });

function fmtYAxis(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M €`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k €`;
  return `${v} €`;
}

// ── Composant ──────────────────────────────────────────────

export default function PerformanceChart({ timeline }: Props) {
  if (timeline.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-white/6 bg-surface-soft sm:h-96">
        <p className="text-sm text-ink-muted">
          Données insuffisantes pour afficher le graphique.
        </p>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="Graphique de performance : évolution de la valeur du portefeuille et du montant investi cumulé sur la période sélectionnée"
      className="h-64 rounded-xl border border-white/6 bg-surface-soft p-4 sm:h-96"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={timeline}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={fmtDate}
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtYAxis}
            tick={{ fill: '#9CA3AF', fontSize: 11 }}
            width={60}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-white/10 bg-surface-soft px-3 py-2 text-xs shadow-lg">
                  <p className="mb-1 font-medium text-ink">{fmtDate(Number(label))}</p>
                  {payload.map((entry) => (
                    <p key={String(entry.dataKey)} className="text-ink-muted">
                      {entry.dataKey === 'invested' ? 'Investi' : 'Valeur'} :{' '}
                      <span className="text-ink">{formatCurrency(Number(entry.value ?? 0))}</span>
                    </p>
                  ))}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="invested"
            stroke="#1098F7"
            fill="rgba(16,152,247,0.18)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#FFFFFF"
            fill="transparent"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
