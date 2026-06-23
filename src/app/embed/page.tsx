export default function EmbedPage() {
  return (
    <main className="min-h-screen bg-surface text-white">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-white/10 bg-surface-soft p-6 shadow-card">
            <p className="mb-6 text-sm text-ink-muted">
              Paramètres (phase&nbsp;4)
            </p>
            <button
              type="button"
              className="h-11 rounded-full bg-cta px-6 text-sm font-light text-white transition-[filter] duration-400 hover:brightness-110"
            >
              Simuler
            </button>
          </section>

          <section className="rounded-lg border border-white/10 bg-surface-soft p-6 shadow-card">
            <p className="text-sm text-ink-muted">Résultats (phase&nbsp;4)</p>
          </section>
        </div>
      </div>
    </main>
  );
}
