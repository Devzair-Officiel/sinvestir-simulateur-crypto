// ── Allowlist ────────────────────────────────────────────────
export const CRYPTO_IDS = [
  'bitcoin',
  'ethereum',
  'solana',
  'binancecoin',
  'ripple',
  'cardano',
] as const;

export type CryptoId = (typeof CRYPTO_IDS)[number];

// ── Modes & fréquences ──────────────────────────────────────
export type InvestmentMode = 'lump-sum' | 'dca';
export type DcaFrequency = 'daily' | 'weekly' | 'monthly';

// ── Données de marché ───────────────────────────────────────
export interface MarketPoint {
  /** Unix ms, UTC */
  timestamp: number;
  /** Prix en EUR */
  price: number;
}

// ── Paramètres — union discriminée par mode ─────────────────
export type SimulationParams =
  | {
      mode: 'lump-sum';
      cryptoId: CryptoId;
      /** Montant total investi */
      amount: number;
      startDate: Date;
      endDate: Date;
    }
  | {
      mode: 'dca';
      cryptoId: CryptoId;
      /** Montant PAR versement */
      amount: number;
      frequency: DcaFrequency;
      startDate: Date;
      endDate: Date;
    };

export type LumpSumParams = Extract<SimulationParams, { mode: 'lump-sum' }>;
export type DcaParams = Extract<SimulationParams, { mode: 'dca' }>;

// ── Timeline (graphe) ───────────────────────────────────────
export interface TimelinePoint {
  /** Unix ms */
  timestamp: number;
  /** Cumulé investi (EUR) */
  invested: number;
  /** Valeur du portefeuille (EUR) */
  value: number;
}

// ── Résultat — union discriminée par status ─────────────────
export type SimulationResult =
  | {
      status: 'success';
      totalInvested: number;
      finalValue: number;
      /** finalValue − totalInvested (EUR) */
      gainLoss: number;
      /** Ratio décimal : 0.5 = +50 %, −0.3 = −30 % */
      performance: number;
      paymentCount: number;
      /** totalInvested / totalQuantity */
      averageBuyPrice: number;
      totalQuantity: number;
      timeline: TimelinePoint[];
    }
  | {
      status: 'error';
      code: 'invalid-date-range' | 'no-price-data';
      message: string;
    };

// ── Stratégie — interface générique (DIP / OCP) ────────────
export interface SimulationStrategy<Mode extends InvestmentMode> {
  run(
    params: Extract<SimulationParams, { mode: Mode }>,
    prices: MarketPoint[],
  ): SimulationResult;
}
