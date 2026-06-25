export default function Disclaimer() {
  return (
    <aside
      role="note"
      aria-label="Avertissement"
      className="rounded-lg border border-white/6 bg-surface-soft p-4"
    >
      <div className="flex gap-3">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs leading-5 text-ink-muted sm:text-sm">
          Cette simulation est rétrospective et repose sur des données
          historiques. Elle ne constitue ni une prévision ni une recommandation
          d&apos;investissement. Les performances passées ne préjugent pas des
          performances futures. Risque de perte en capital.
        </p>
      </div>
    </aside>
  );
}
