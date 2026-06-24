import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Vérifie qu'aucun chunk client du build ne contient la chaîne
 * "COINGECKO_API_KEY". Ce test nécessite un build préalable (`npm run build`).
 * Il est skipped si le dossier .next/static/chunks n'existe pas.
 */
describe('bundle leak check', () => {
  it('aucun chunk client ne contient COINGECKO_API_KEY', async () => {
    const chunksDir = join(process.cwd(), '.next', 'static', 'chunks');

    let files: string[];
    try {
      files = await readdir(chunksDir, { recursive: true });
    } catch {
      // Pas de build → on skip (le test sera pertinent en CI)
      return;
    }

    const jsFiles = files.filter((f) => f.endsWith('.js'));

    for (const file of jsFiles) {
      const content = await readFile(join(chunksDir, file), 'utf-8');
      expect(
        content.includes('COINGECKO_API_KEY'),
        `Le chunk "${file}" contient COINGECKO_API_KEY — fuite de clé côté client !`,
      ).toBe(false);
    }
  });
});
