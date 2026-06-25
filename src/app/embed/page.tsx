import CryptoSimulator from '@/components/simulator/CryptoSimulator';

export default function EmbedPage() {
  return (
    <main className="min-h-screen bg-surface py-6 text-white">
      <CryptoSimulator mode="embed" />
    </main>
  );
}
