'use client';

import { useState } from 'react';
import { z } from 'zod';
import { CRYPTO_IDS } from '@/types/simulation';
import type { CryptoId, InvestmentMode, DcaFrequency } from '@/types/simulation';

// ── Types exportés ─────────────────────────────────────────

export interface FormValues {
  cryptoId: CryptoId;
  mode: InvestmentMode;
  amount: number;
  frequency: DcaFrequency;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

// ── Constantes ─────────────────────────────────────────────

const CRYPTO_LABELS: Record<CryptoId, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  solana: 'Solana (SOL)',
  binancecoin: 'BNB',
  ripple: 'XRP',
  cardano: 'Cardano (ADA)',
};

const FREQ_LABELS: Record<DcaFrequency, string> = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
};

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULTS: FormValues = {
  cryptoId: 'bitcoin',
  mode: 'dca',
  amount: 100,
  frequency: 'monthly',
  startDate: '2020-01-01',
  endDate: TODAY,
};

// ── Validation Zod ─────────────────────────────────────────

const FormSchema = z
  .object({
    cryptoId: z.enum(CRYPTO_IDS),
    mode: z.enum(['lump-sum', 'dca'] as const),
    amount: z.number().finite().positive('Le montant doit être supérieur à 0'),
    frequency: z.enum(['daily', 'weekly', 'monthly'] as const),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  })
  .refine((d) => d.startDate < d.endDate, {
    message: 'La date de début doit précéder la date de fin',
    path: ['startDate'],
  });

type FieldErrors = Partial<Record<keyof FormValues, string>>;

const INPUT =
  'h-11 w-full min-w-0 truncate rounded-md bg-surface-soft border border-white/10 px-3.5 text-sm text-ink outline-none focus:border-accent';

// ── Composant ──────────────────────────────────────────────

interface Props {
  onSubmit: (values: FormValues) => void;
  loading: boolean;
}

export default function SimulationForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<FormValues>(DEFAULTS);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = FormSchema.safeParse(form);
    if (!result.success) {
      const errs: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit(result.data as FormValues);
  }

  const isLump = form.mode === 'lump-sum';

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {/* Cryptomonnaie */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">Cryptomonnaie</span>
        <select value={form.cryptoId} onChange={(e) => set('cryptoId', e.target.value as CryptoId)} className={INPUT}>
          {CRYPTO_IDS.map((id) => <option key={id} value={id}>{CRYPTO_LABELS[id]}</option>)}
        </select>
      </label>

      {/* Mode */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">Mode d&apos;investissement</span>
        <select value={form.mode} onChange={(e) => set('mode', e.target.value as InvestmentMode)} className={INPUT}>
          <option value="lump-sum">Versement unique</option>
          <option value="dca">Investissement programmé (DCA)</option>
        </select>
      </label>

      {/* Montant — label dynamique selon mode */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">
          {isLump ? 'Montant total (€)' : 'Montant par versement (€)'}
        </span>
        <input
          type="number"
          min={1}
          step="any"
          value={Number.isNaN(form.amount) ? '' : form.amount}
          onChange={(e) => set('amount', e.target.valueAsNumber)}
          placeholder="100"
          aria-invalid={!!errors.amount || undefined}
          className={INPUT}
        />
        {errors.amount && <span className="text-xs text-red-400">{errors.amount}</span>}
      </label>

      {/* Fréquence — désactivée en versement unique */}
      <label className={`flex flex-col gap-1.5${isLump ? ' opacity-50' : ''}`}>
        <span className="text-xs font-medium text-ink-muted">Fréquence</span>
        <select value={form.frequency} onChange={(e) => set('frequency', e.target.value as DcaFrequency)}
          disabled={isLump} className={INPUT}>
          {(['daily', 'weekly', 'monthly'] as const).map((v) => (
            <option key={v} value={v}>{FREQ_LABELS[v]}</option>
          ))}
        </select>
      </label>

      {/* Date de début */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">Date de début</span>
        <input type="date" min="2018-01-01" max={form.endDate} value={form.startDate}
          onChange={(e) => set('startDate', e.target.value)} aria-invalid={!!errors.startDate || undefined} className={INPUT} />
        {errors.startDate && <span className="text-xs text-red-400">{errors.startDate}</span>}
      </label>

      {/* Date de fin */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">Date de fin</span>
        <input type="date" min={form.startDate} max={TODAY} value={form.endDate}
          onChange={(e) => set('endDate', e.target.value)} aria-invalid={!!errors.endDate || undefined} className={INPUT} />
        {errors.endDate && <span className="text-xs text-red-400">{errors.endDate}</span>}
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2 sm:col-span-2">
        <button type="submit" disabled={loading}
          className="inline-flex items-center gap-2 h-11 rounded-full bg-cta px-6 text-sm font-light text-white transition-all duration-300 hover:brightness-[1.1] disabled:opacity-50 disabled:pointer-events-none">
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading ? 'Simulation en cours\u2026' : 'Simuler'}
        </button>
        <button type="button" onClick={() => { setForm(DEFAULTS); setErrors({}); }}
          className="h-11 rounded-md bg-[rgba(15,23,42,0.92)] px-5 text-sm text-ink border border-white/10 transition-colors hover:bg-surface-soft hover:border-white/16">
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
