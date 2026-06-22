# CLAUDE.md — Simulateur Crypto S'investir

## Contexte

Transposer le simulateur crypto de S'investir en **composant Next.js autonome, responsive et intégrable**, aux couleurs et standards de la suite `simulateurs.sinvestir.fr`. Livrable : démo Vercel + repo Git + README.
Plan de build séquencé et scope détaillé : `docs/INSTRUCTIONS_BUILD.md`. Ce fichier-ci ne contient que les règles permanentes.

## Stack (ne pas dévier)

- Next.js (App Router) + TypeScript **strict**
- Tailwind CSS — tokens repris de `simulateurs.sinvestir.fr`
- npm — déploiement Vercel
- `recharts` (graphe), `zod` (validation), `vitest` (tests)
- **PAS** de Docker, **PAS** de Supabase, **PAS** de base de données

## Commandes

- `npm run dev` — développement local
- `npm run lint` — doit passer sans erreur avant tout rendu
- `npm run build` — doit passer sans erreur avant tout rendu
- `npm test` — Vitest (logique de calcul)

## Layout du projet

```
src/
  app/
    page.tsx               # mode "full"
    embed/page.tsx         # mode "embed" (iframe)
    api/crypto/route.ts    # proxy CoinGecko (masque la clé, cache)
  components/simulator/
    CryptoSimulator.tsx    # racine, mode "full" | "embed"
    SimulationForm.tsx  ResultSummary.tsx  PerformanceChart.tsx
    ScenarioCards.tsx   Disclaimer.tsx
  lib/
    crypto/      provider.ts  coingecko-client.ts  fallback-data.ts
    simulation/  calculate-dca.ts  calculate-lump-sum.ts  format-money.ts  date-utils.ts
  types/         simulation.ts
```

## Architecture — SOLID (non négociable)

- **SRP** : calcul / récupération de données / formatage / UI strictement séparés. **JAMAIS de logique métier dans le JSX.**
- **DIP** : l'UI et le moteur dépendent des abstractions `CryptoPriceProvider` et `SimulationStrategy`, jamais de CoinGecko en dur. Le provider concret est injecté depuis un point de composition (factory).
- **OCP** : nouvelle source de prix = nouvelle implémentation du provider ; nouveau mode de calcul = nouvelle stratégie. On n'édite pas l'existant.
- **LSP** : toute implémentation de provider (coingecko, fallback) est substituable — même contrat, même forme de retour, mêmes sémantiques d'erreur.
- **ISP** : interfaces minimales, props de composants étroites.

## Règles métier — calcul (revérifier à chaque modif)

- **Versement unique** : `amount` = total investi. quantité = amount / prix(début) ; valeur finale = quantité × prix(fin) ; nb versements = 1.
- **DCA** : `amount` = montant **PAR versement**. À chaque échéance, quantité += amount / prix(date) ; total investi = amount × nb versements ; prix moyen d'achat = total investi / quantité totale.
- Résultats produits : total investi, valeur finale, plus/moins-value (€), performance (%), nb versements, prix moyen d'achat, quantité accumulée, timeline (`invested` + `value` par pas).
- **Garde-fous numériques** : division par zéro, `NaN`/`Infinity`, point de prix manquant → tous gérés. Arrondi **uniquement à l'affichage**, précision pleine dans le calcul.
- Fonctions de calcul **pures**, sans effet de bord, **testées** (Vitest).

## Sécurité (obligatoire)

- Valider **toutes** les entrées avec Zod : formulaire **et** route `/api/crypto`. `unknown` en entrée → type sûr en sortie.
- **Allowlist** stricte des cryptos : l'id part dans l'URL upstream → jamais de valeur brute du client (anti SSRF / injection de chemin).
- Clé API CoinGecko **côté serveur uniquement** (route `/api/crypto`), jamais en `NEXT_PUBLIC_`, jamais loggée.
- Valider **aussi la réponse CoinGecko** avec Zod (*parse, don't assume*).
- `fetch` upstream avec timeout (`AbortController`). 429 / échec / lenteur → bascule sur le fallback local.
- Embed : autoriser via CSP **`frame-ancestors`** (`sinvestir.fr`, `simulateurs.sinvestir.fr`, `*.vercel.app`) dans `next.config`. **NE PAS** utiliser `X-Frame-Options: DENY` (casserait l'iframe).
- Jamais de `dangerouslySetInnerHTML`. Erreurs jamais bavardes côté client (pas de stack, pas de message upstream).

## Conventions de code

- TypeScript strict, **zéro `any`** (préférer `unknown` + narrowing). Unions discriminées pour les modes et résultats.
- **Server Components par défaut** ; `"use client"` seulement sur l'interactif (formulaire, graphe).
- Immutabilité dans `lib/simulation`. Composants courts (~150 lignes max), nommage cohérent.
- Montants : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.
- Config d'environnement typée et validée (Zod), fail-fast si une variable manque.

## Données & fallback

- CoinGecko `/coins/{id}/market_chart/range?vs_currency=eur&from&to`, via `/api/crypto` (cache `revalidate`).
- Allowlist : `bitcoin`, `ethereum`, `solana`, `binancecoin`, `ripple`, `cardano`.
- `fallback-data.ts` : séries BTC/ETH en dur → la démo fonctionne **toujours**, même API indisponible.

## UI / UX

- Formulaire : select crypto, mode, **montant à label dynamique** (« total » / « par versement »), fréquence (désactivée en mode unique), dates début/fin, boutons **Simuler** + **Réinitialiser**.
- Exemple **prérempli** : Bitcoin, 100 €/mois, janvier 2020 → aujourd'hui.
- Résumé pédagogique en langage clair + chiffres clés. Graphe : valeur du portefeuille vs montant cumulé investi.
- **Disclaimer** = composant visible de premier plan : simulation rétrospective, ni prévision ni recommandation, risque de perte en capital.
- États : loading, erreur propre, dates invalides bloquées. Responsive **375 / 768 / 1280**. A11y : labels, `aria-*`, contrastes.
- Deux modes : `<CryptoSimulator mode="full" />` (page `/`) et `mode="embed"` (page `/embed`, sans header).

## Definition of Done

- `npm run lint`, `npm run build`, `npm test` passent.
- Fallback testé **API coupée**. Responsive vérifié. Démo Vercel live + `/embed` fonctionnels.
- Design fidèle aux tokens de `simulateurs.sinvestir.fr`.

## Façon de travailler avec moi

- **Changements minimaux** : ne refactore pas du code non concerné par la tâche.
- Lance `lint` / type-check après chaque modification de code.
- Si tu hésites entre deux approches, **présente les deux et laisse-moi choisir** — ne tranche pas une décision d'archi seul.
- Commits petits et logiques, un par changement cohérent.
