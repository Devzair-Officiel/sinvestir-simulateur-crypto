const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formate un montant en euros français (ex : « 1 234,56 € »). */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/** Formate un ratio décimal en pourcentage (0.5 → « 50,00 % »). */
export function formatPercent(ratio: number): string {
  return percentFormatter.format(ratio);
}
