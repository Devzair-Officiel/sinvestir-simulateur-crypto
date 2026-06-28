import type { CryptoId } from '@/types/simulation';

// ── Métadonnées centralisées par crypto ────────────────────
// Source de vérité unique pour les libellés et bornes de couverture
// historique. Ajouter une crypto = ajouter une entrée dans chaque map.

export const CRYPTO_LABELS: Record<CryptoId, { name: string; ticker: string }> = {
  bitcoin:     { name: 'Bitcoin',  ticker: 'BTC' },
  ethereum:    { name: 'Ethereum', ticker: 'ETH' },
  solana:      { name: 'Solana',   ticker: 'SOL' },
  binancecoin: { name: 'BNB',      ticker: 'BNB' },
  ripple:      { name: 'XRP',      ticker: 'XRP' },
  cardano:     { name: 'Cardano',  ticker: 'ADA' },
};

// Premier point disponible (Kraken hebdomadaire) par crypto. Sert à
// borner dynamiquement le champ « date de début » et à valider en Zod.
export const CRYPTO_START_DATES: Record<CryptoId, string> = {
  bitcoin:     '2013-09-05', // premier point Kraken BTC/EUR
  ethereum:    '2015-08-06', // premier point Kraken ETH/EUR
  solana:      '2015-08-06',
  binancecoin: '2015-08-06',
  ripple:      '2015-08-06',
  cardano:     '2015-08-06',
};

// Dates en français lisible — utilisées dans les messages d'erreur et
// l'UI informative.
export const CRYPTO_START_LABELS: Record<CryptoId, string> = {
  bitcoin:     '5 septembre 2013',
  ethereum:    '6 août 2015',
  solana:      '6 août 2015',
  binancecoin: '6 août 2015',
  ripple:      '6 août 2015',
  cardano:     '6 août 2015',
};

// ── Helpers ────────────────────────────────────────────────

/** « Bitcoin (BTC) » */
export function getCryptoLabel(id: CryptoId): string {
  const { name, ticker } = CRYPTO_LABELS[id];
  return `${name} (${ticker})`;
}

/** « Bitcoin » */
export function getCryptoName(id: CryptoId): string {
  return CRYPTO_LABELS[id].name;
}
