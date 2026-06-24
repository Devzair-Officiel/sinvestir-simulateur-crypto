# Plan de développement — Démo Simulateur Crypto S'investir

Principe : **chaque phase se termine sur un commit + un déploiement Vercel qui marche.** Jamais de `main` cassé. La démo est en ligne dès la phase 1, on l'enrichit ensuite. Pilotage Claude Code : on fait **planifier avant de coder**, on valide, il implémente, il **teste et montre le diff**.

Référence : règles dans CLAUDE.md, spec dans docs/INSTRUCTIONS_BUILD.md, charte visuelle dans docs/DESIGN.md

---

## Phase 0 — Socle ✅

- [x] Scaffold Next.js + TS strict + Tailwind
- [x] `CLAUDE.md` rempli
- [x] Push GitHub
- [x] Déploiement Vercel day-zero

---

## Phase 1 — Thème & coquille visuelle ✅

- [x] Tokens DESIGN.md dans `globals.css` (`:root` + `@theme inline` Tailwind v4)
- [x] Police Lexend via `next/font/google` (`--font-lexend`)
- [x] `layout.tsx` : `lang="fr"`, métadonnées S'investir, `font-sans`
- [x] `page.tsx` : squelette mode "full" (header, titre, grille 2 colonnes, bouton CTA pill)
- [x] `embed/page.tsx` : version nue pour iframe (sans header, sans halos)
- [x] Halos de fond sobres (`.page-background`)
- [x] `npm run build` OK
- [x] Docs mises à jour (DESIGN.md §14 corrigé pour Tailwind v4, CLAUDE.md)

---

## Phase 2 — Moteur de calcul (le cœur, sans UI) ✅

- [x] `types/simulation.ts`
- [x] Interface `SimulationStrategy`
- [x] `calculate-lump-sum.ts` + tests
- [x] `calculate-dca.ts` + tests
- [x] `format-money.ts`
- [x] `date-utils.ts` (dates en UTC)
- [x] Cas limites couverts (période vide, 1 versement, prix manquant, prix nul, fin < début)
- [x] `npm test` vert, `npm run build` OK
- Tests : 40 passés en 408 ms

---

## Phase 3 — Données + fallback

- [ ] `provider.ts` (interface `CryptoPriceProvider`)
- [ ] `fallback-data.ts` (séries BTC/ETH en dur, mensuelles, 2018→auj)
- [ ] `coingecko-client.ts` (Zod sur réponse, allowlist, `AbortController` timeout, 429→fallback)
- [ ] `app/api/crypto/route.ts` (proxy serveur, clé masquée, Zod sur entrée, cache `revalidate`)
- [ ] Test fallback API coupée / clé absente
- [ ] Aucune clé dans le bundle client
- [ ] `npm run build` OK

---

## Phase 4 — UI branchée (simulation de bout en bout) — **MVP**

- [ ] `SimulationForm.tsx` (prérempli BTC 100€/mois janv 2020, label dynamique, validation Zod)
- [ ] `ResultSummary.tsx` (KPI cards + résumé pédagogique)
- [ ] `PerformanceChart.tsx` (recharts : investi cyan, valeur blanc)
- [ ] `Disclaimer.tsx`
- [ ] `CryptoSimulator.tsx` (point de composition : injecte stratégie + provider)
- [ ] Simulation BTC DCA de bout en bout, chiffres cohérents
- [ ] États loading / erreur propres
- [ ] `npm run build` + `npm test` OK

---

## Phase 5 — Embed & responsive

- [ ] `mode="embed"` branché sur `/embed` via `<CryptoSimulator>`
- [ ] `next.config` : CSP `frame-ancestors` (sinvestir.fr, simulateurs.sinvestir.fr, *.vercel.app)
- [ ] Test `/embed` dans une vraie `<iframe>`
- [ ] Passe responsive 375 / 768 / 1280
- [ ] Focus visibles sur tous les inputs

---

## Phase 6 — Durcissement & qualité

- [ ] En-têtes de sécurité (`nosniff`, `Referrer-Policy`)
- [ ] A11y (labels, `aria-*`, contrastes)
- [ ] `npm run lint` + `npm run build` + `npm test` verts
- [ ] `npm audit`
- [ ] README : URL réelle + snippet iframe

---

## Phase 7 — Livrable

- [ ] Test fallback API coupée sur la prod
- [ ] Loom 5 min
- [ ] 3 suggestions dans le formulaire Tally
- [ ] Soumettre démo + repo

---

## Si le temps manque (esprit demi-journée)

Phases 1 → 4 = **MVP livrable et défendable** (live, à l'identité, calcul juste, données robustes). Phases 5 → 7 = finition. Ne sacrifie jamais le « ça marche / ça ressemble / c'est propre » du cœur pour un bonus.

## Garde-fou Claude Code

À chaque phase : « lis `CLAUDE.md`, propose ton plan, signale tes hypothèses, attends mon feu vert » → puis « implémente, `lint`+`build`+`test`, montre le diff ». Tu relis surtout le **calcul** (phase 2) et les **schémas Zod / allowlist** (phase 3) à la main — c'est là qu'une erreur passe inaperçue.
