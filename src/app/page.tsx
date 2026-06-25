import CryptoSimulator from '@/components/simulator/CryptoSimulator';

export default function Home() {
  return (
    <main className="page-background min-h-screen text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <p className="mb-3 text-sm font-medium text-accent">
            Simulateurs S&apos;investir
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Simulateur Crypto
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted md:text-base">
            Simulez une stratégie d&apos;investissement historique en
            cryptomonnaie et comparez un versement unique à une approche
            progressive (DCA).
          </p>
        </header>

        <CryptoSimulator mode="full" />
      </div>
    </main>
  );
}
