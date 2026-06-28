'use client';

import { useState } from 'react';
import { z } from 'zod';
import type { CryptoId, InvestmentMode, DcaFrequency } from '@/types/simulation';
import {
  CRYPTO_START_DATES,
  CRYPTO_START_LABELS,
  getCryptoLabel,
  getCryptoName,
} from '@/lib/crypto/crypto-metadata';

// Sous-ensemble exposé dans l'UI. L'allowlist Zod (types/simulation.ts)
// reste plus large pour rester extensible côté provider sans toucher au form.
const UI_CRYPTO_IDS = ['bitcoin', 'ethereum'] as const satisfies readonly CryptoId[];
const UI_FREQUENCIES = ['weekly', 'monthly'] as const satisfies readonly DcaFrequency[];

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

const FREQ_LABELS: Record<(typeof UI_FREQUENCIES)[number], string> = {
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
    cryptoId: z.enum(UI_CRYPTO_IDS),
    mode: z.enum(['lump-sum', 'dca'] as const),
    amount: z.number().finite().positive('Le montant doit être supérieur à 0'),
    frequency: z.enum(UI_FREQUENCIES),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide'),
  })
  .refine((d) => d.startDate < d.endDate, {
    message: 'La date de début doit précéder la date de fin',
    path: ['startDate'],
  })
  .superRefine((d, ctx) => {
    if (d.startDate < CRYPTO_START_DATES[d.cryptoId]) {
      const name = getCryptoName(d.cryptoId);
      const date = CRYPTO_START_LABELS[d.cryptoId];
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: `Les données ${name} démarrent le ${date}. Choisissez une date à partir du ${date}.`,
      });
    }
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

  // Quand la crypto change, on remonte automatiquement la date de début si
  // elle tombe avant la fenêtre disponible pour la nouvelle crypto.
  const setCryptoId = (id: CryptoId) => {
    setForm((prev) => {
      const minStart = CRYPTO_START_DATES[id];
      return {
        ...prev,
        cryptoId: id,
        startDate: prev.startDate < minStart ? minStart : prev.startDate,
      };
    });
  };

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
        <select value={form.cryptoId} onChange={(e) => setCryptoId(e.target.value as CryptoId)} className={INPUT}>
          {UI_CRYPTO_IDS.map((id) => <option key={id} value={id}>{getCryptoLabel(id)}</option>)}
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
        <div className="relative">
          <input
            type="number"
            min={1}
            step="any"
            value={Number.isNaN(form.amount) ? '' : form.amount}
            onChange={(e) => set('amount', e.target.valueAsNumber)}
            placeholder="100"
            aria-invalid={!!errors.amount || undefined}
            className={`${INPUT} pr-9`}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-muted"
          >
            €
          </span>
        </div>
        {errors.amount && <span className="text-xs text-red-400">{errors.amount}</span>}
      </label>

      {/* Fréquence — désactivée en versement unique */}
      <label className={`flex flex-col gap-1.5${isLump ? ' opacity-50' : ''}`}>
        <span className="text-xs font-medium text-ink-muted">Fréquence</span>
        <select value={form.frequency} onChange={(e) => set('frequency', e.target.value as DcaFrequency)}
          disabled={isLump} className={INPUT}>
          {UI_FREQUENCIES.map((v) => (
            <option key={v} value={v}>{FREQ_LABELS[v]}</option>
          ))}
        </select>
      </label>

      {/* Date de début */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-ink-muted">Date de début</span>
        <input type="date" min={CRYPTO_START_DATES[form.cryptoId]} max={form.endDate} value={form.startDate}
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
