# Plan de développement — Démo Simulateur Crypto S'investir

Principe : **chaque phase se termine sur un commit + un déploiement Vercel qui marche.** Jamais de `main` cassé. La démo est en ligne dès la phase 1, on l'enrichit ensuite. Pilotage Claude Code : on fait **planifier avant de coder**, on valide, il implémente, il **teste et montre le diff**.

Référence : règles dans `CLAUDE.md`, spec dans `docs/INSTRUCTIONS_BUILD.md`, tokens dans `docs/AUDIT_DESIGN.md`.

---

## Phase 0 — Socle ✅ (fait)

Scaffold Next.js + TS strict + Tailwind, `CLAUDE.md` rempli, push GitHub, déploiement Vercel day-zero.

---

## Phase 1 — Thème & coquille visuelle (la démo « ressemble à S'investir » avant tout code métier)

**Objectif** : une page live, vide mais déjà à l'identité S'investir, + les deux routes en place.
**Pré-requis manuel** : vérifier dans les DevTools de `simulateurs.sinvestir.fr` la vraie `font-family`, les hex de fond/surface, le bleu + gold. Corriger `AUDIT_DESIGN.md` si écart.
**À déléguer** : câbler `tailwind.config.ts` (couleurs, fontFamily, radius, shadows de l'audit) + `globals.css` (fond `--background`, effets radiaux sobres) ; squelettes `app/page.tsx` (header + titre + grille 2 colonnes vides) et `app/embed/page.tsx` (nu) ; police via `next/font`.
**Vérifier** : `npm run build` OK ; la page reflète bien le dark dashboard (fond, cards, bleu, gold accent).
**Checkpoint** : commit + deploy. L'URL live a déjà la bonne identité.

---

## Phase 2 — Moteur de calcul (le cœur, sans UI)

**Objectif** : la logique métier juste et testée, totalement découplée.
**À déléguer** (plan mode d'abord) : `types/simulation.ts` ; interface `SimulationStrategy` ; `calculate-lump-sum.ts` + `calculate-dca.ts` ; `format-money.ts` ; `date-utils.ts` (**dates en UTC**) ; tests Vitest.
**Décisions à trancher toi-même** : mapping date de versement → point de prix (le plus proche / premier ≥ date) ; cadence de la `timeline` du graphe (au pas des données prix, p. ex. journalier, avec l'investi qui marche par paliers) ; off-by-one sur le nombre de versements ; prix retenu pour « aujourd'hui ».
**Vérifier** : `npm test` vert ; cas limites couverts (période vide, 1 seul versement, dernier versement = date de fin, point de prix manquant, prix nul, fin < début). Relire la maths DCA à la main.
**Checkpoint** : commit (pas de deploy nécessaire, rien de visible — mais build OK).

---

## Phase 3 — Données + fallback (tôt, car l'UI en dépend)

**Objectif** : une source de prix fiable, qui marche même API coupée.
**À déléguer** : `provider.ts` (interface) ; `fallback-data.ts` (séries BTC/ETH en dur, mensuelles, 2018→auj) **d'abord** ; puis `coingecko-client.ts` + `app/api/crypto/route.ts` (base `https://api.coingecko.com/api/v3`, header `x-cg-demo-api-key` côté serveur, **Zod** sur l'entrée ET la réponse, **allowlist** des cryptos, `AbortController` timeout, 429/échec → fallback, cache `revalidate`).
**Vérifier** : avec la clé absente / API coupée, le provider sert le fallback sans erreur ; avec la clé, il sert le live. Aucune clé dans le bundle client.
**Checkpoint** : commit + deploy.

---

## Phase 4 — UI branchée (simulation de bout en bout)

**Objectif** : on saisit, on simule, on voit le résultat — sur la vraie chaîne.
**À déléguer** : `SimulationForm.tsx` (préremplи Bitcoin, 100 €/mois, janv. 2020 → auj ; label montant dynamique ; fréquence désactivée en mode unique ; Simuler + Réinitialiser ; validation) ; `ResultSummary.tsx` (KPI cards + résumé pédagogique en phrase) ; `PerformanceChart.tsx` (recharts — **une seule définition** : valeur du portefeuille vs investi cumulé ; couleurs : investi cyan, valeur gold) ; `Disclaimer.tsx` ; `CryptoSimulator.tsx` qui injecte stratégie + provider (point de composition).
**Vérifier** : simulation Bitcoin DCA complète, chiffres cohérents, graphe correct, états loading/erreur propres.
**Checkpoint** : commit + deploy. **C'est le MVP livrable.**

---

## Phase 5 — Embed & responsive

**Objectif** : intégrabilité prouvée + propre sur mobile.
**À déléguer** : `mode="embed"` (sans header) sur `/embed` ; `next.config` avec CSP `frame-ancestors` (`sinvestir.fr`, `simulateurs.sinvestir.fr`, `*.vercel.app`) — **pas** `X-Frame-Options: DENY` ; passe responsive 375 / 768 / 1280 ; focus visibles.
**Vérifier** : tester `/embed` dans une vraie `<iframe>` (une page HTML locale suffit) ; mobile sans débordement.
**Checkpoint** : commit + deploy.

---

## Phase 6 — Durcissement & qualité

**Objectif** : cocher la Definition of Done.
**À déléguer / faire** : en-têtes de sécurité (`nosniff`, `Referrer-Policy`) ; a11y (labels, `aria-*`, contrastes) ; `npm run lint` + `npm run build` + `npm test` verts ; `npm audit` ; mettre l'URL réelle dans le README + le snippet iframe.
**Vérifier** : parcourir la checklist §10 de `INSTRUCTIONS_BUILD.md`.
**Checkpoint** : commit + deploy.

---

## Phase 7 — Livrable

**Objectif** : rendre.
**À faire** : **test fallback API coupée** une dernière fois sur la prod ; Loom 5 min (plan §8 du build doc) ; 3 suggestions dans le formulaire Tally ; soumettre démo + repo.

---

## Si le temps manque (esprit demi-journée)

Phases 1 → 4 = **MVP livrable et défendable** (live, à l'identité, calcul juste, données robustes). Phases 5 → 7 = finition. Ne sacrifie jamais le « ça marche / ça ressemble / c'est propre » du cœur pour un bonus.

## Garde-fou Claude Code

À chaque phase : « lis `CLAUDE.md`, propose ton plan, signale tes hypothèses, attends mon feu vert » → puis « implémente, `lint`+`build`+`test`, montre le diff ». Tu relis surtout le **calcul** (phase 2) et les **schémas Zod / allowlist** (phase 3) à la main — c'est là qu'une erreur passe inaperçue.
