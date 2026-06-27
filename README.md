# Simulateur Crypto — Suite S'investir

Transposition du [simulateur crypto S'investir](https://sinvestir.fr/simulateur-crypto-monnaie/) en composant **Next.js autonome, responsive et intégrable**, aligné sur l'identité visuelle de la suite [simulateurs.sinvestir.fr](https://simulateurs.sinvestir.fr/).

> **Démo en ligne** : [sinvestir-simulateur-crypto-tau.vercel.app](https://sinvestir-simulateur-crypto-tau.vercel.app)
> **Mode embed** : [sinvestir-simulateur-crypto-tau.vercel.app/embed](https://sinvestir-simulateur-crypto-tau.vercel.app/embed)

---

## Objectif

Reprendre la **logique fonctionnelle** du simulateur crypto existant — sélection d'un actif, montant, fréquence, période, DCA vs versement unique, calcul de la plus-value sur données historiques — et la faire entrer dans l'**écosystème produit** des simulateurs S'investir, plutôt que de recopier la page d'origine.

Le rendu est pensé comme un **composant réutilisable**, prêt à vivre dans la suite Next.js existante ou à être embarqué proprement dans une page externe.

---

## Stack

| Choix | Raison |
|---|---|
| **Next.js (App Router) + TypeScript strict** | Aligné sur votre stack interne ; reprise et intégration sans friction. |
| **Tailwind CSS v4** | Tokens de design extraits directement du CSS live de `simulateurs.sinvestir.fr` → fidélité visuelle maîtrisée, pas approximée. |
| **Vercel** | Déploiement natif Next.js, identique à vos simulateurs. Zéro configuration. |
| **Kraken API (publique)** | Historique complet depuis 2018, sans clé. Source isolée derrière une interface — remplaçable sans toucher au reste. |
| **Zod** | Validation stricte des entrées formulaire et route API. |
| **Vitest** | Tests unitaires sur les fonctions de calcul financier. |

Pas de base de données : le périmètre ne le justifie pas. La persistance (capture de lead, cache de prix) est proposée en piste d'évolution.

---

## Source des données

Les prix historiques sont récupérés via l'**API publique Kraken** (endpoint OHLC hebdomadaire, paires XXBTZEUR et XETHZEUR). Aucune clé API requise.

> CoinGecko Demo API a été évalué en premier mais restreint l'accès aux 365 derniers jours sur son tier gratuit — insuffisant pour un backtesting sur plusieurs années. Kraken fournit un historique complet depuis 2018 sans authentification.

Un **fallback local** (données hebdomadaires 2018 → 2026 intégrées en dur) garantit que la démo reste fonctionnelle même sans accès réseau. La source de données est isolée derrière une interface `CryptoPriceProvider` : remplacer Kraken par une API interne ou un cache Supabase ne touche qu'un seul fichier.

---

## Fonctionnalités

- Sélection de la cryptomonnaie (BTC, ETH)
- Versement unique **ou** DCA (hebdomadaire / mensuel)
- Période personnalisée (date de début / fin, depuis janvier 2018)
- Résultats : total investi, valeur finale, gain/perte (€ et %), nombre de versements, prix moyen d'achat, quantité accumulée
- Graphique : valeur du portefeuille vs montant cumulé investi (recharts)
- Résumé pédagogique en langage clair
- Avertissement risque en **composant de premier plan** (pas un bas de page discret)
- **Mode embed** pour intégration iframe dans une page externe
- **Fallback automatique** si l'API est indisponible → la démo ne casse jamais

---

## Architecture

```
src/
  app/
    page.tsx                 # page complète (header, intro, contexte)
    embed/page.tsx           # version nue, pensée pour iframe
    api/crypto/route.ts      # proxy Kraken : validation Zod, cache 1h
  components/simulator/
    CryptoSimulator.tsx      # orchestrateur UI (rendu pur)
    useSimulation.ts         # hook : fetch + sélection stratégie + état
    SimulationForm.tsx       # formulaire avec validation Zod client
    ResultSummary.tsx        # KPI cards + résumé pédagogique
    PerformanceChart.tsx     # graphique recharts
    Disclaimer.tsx           # avertissement réglementaire
  lib/
    crypto/
      provider.ts            # interface CryptoPriceProvider + schémas Zod
      kraken-client.ts       # implémentation Kraken (OHLC, AbortController 8s)
      fallback-data.ts       # séries BTC/ETH hebdomadaires 2018-2026
    simulation/
      calculate-dca.ts       # stratégie DCA (fonctions pures, testées)
      calculate-lump-sum.ts  # stratégie versement unique (fonctions pures, testées)
      format-money.ts        # Intl.NumberFormat fr-FR
      date-utils.ts          # génération des échéances, UTC strict
  types/
    simulation.ts            # unions discriminées, SimulationStrategy, SimulationResult
```

**Principe directeur** : la logique métier ne touche jamais le JSX. Les calculs (`lib/simulation`) sont des fonctions pures, indépendantes de l'UI et de la source de données.

---

## Logique de calcul

- **Versement unique** : montant saisi = total investi. Quantité = montant ÷ prix à la date de début ; valeur finale = quantité × prix à la date de fin.
- **DCA** : montant saisi = montant **par versement**. À chaque échéance, quantité += montant ÷ prix du jour. Total investi = montant × nb versements ; prix moyen d'achat = total investi ÷ quantité totale.

L'ambiguïté « montant total » vs « montant par versement » est levée explicitement dans l'interface via un label dynamique, pour éviter toute lecture erronée des résultats.

---

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run lint     # 0 erreur
npm run build    # build de production
npm test         # 69 tests Vitest
```

Aucune variable d'environnement requise : l'API Kraken est publique. En cas d'indisponibilité réseau, le fallback local prend automatiquement le relais.

---

## Mode embed

Le simulateur est conçu pour être embarqué via iframe sur n'importe quelle page :

```html
<iframe
  src="https://sinvestir-simulateur-crypto-tau.vercel.app/embed"
  width="100%"
  height="720"
  style="border:0; border-radius:16px;"
  title="Simulateur Crypto S'investir"
></iframe>
```

La route `/embed` rend le même composant sans header ni contexte de page. La CSP `frame-ancestors` est configurée pour autoriser l'embed sur `sinvestir.fr`, `simulateurs.sinvestir.fr` et `*.vercel.app` uniquement.

---

## Partis pris techniques

- **SOLID appliqué** : `CryptoPriceProvider` et `SimulationStrategy` sont des interfaces — ouverts à l'extension, fermés à la modification. Ajouter une source de prix ou un mode de calcul = un nouveau fichier, zéro modification de l'existant.
- **Validation systématique** : Zod sur les entrées formulaire *et* sur la route API (input *et* réponse upstream — *parse, don't assume*).
- **Sécurité embed** : `frame-ancestors` CSP plutôt que `X-Frame-Options: DENY` pour contrôler précisément les origines autorisées sans bloquer l'iframe.
- **Fallback garanti** : le proxy bascule automatiquement sur les données locales sur timeout (8s), erreur upstream ou rate-limit — la démo ne casse jamais pendant une évaluation.
- **Server Components par défaut** : `"use client"` uniquement sur les parties interactives (formulaire, graphique). Idiome App Router.
- **Calculs financiers testés** : fonctions pures avec 69 tests Vitest couvrant les cas nominaux et les cas limites (prix nul, NaN, période vide, fin < début, clamp de fin de mois).

---

## Limites connues

- Les données démarrent au 04/01/2018 (premier point Kraken hebdomadaire). Le formulaire borne la date de début en conséquence.
- La couverture live est volontairement limitée à BTC et ETH pour garantir une démo fiable dans le temps imparti. Les autres actifs peuvent être ajoutés via le mapping provider sans modifier la logique métier.
- Données hebdomadaires uniquement. L'endpoint OHLC public Kraken plafonne à 720 chandelles d'historique, ce qui permet de couvrir ~14 ans en hebdomadaire mais seulement ~2 ans en quotidien — insuffisant pour la plage 2018→aujourd'hui visée par le simulateur. Suffisant pour un DCA hebdomadaire ou mensuel.
- DCA quotidien désactivé pour la même raison. Activer cette fréquence nécessite une source de données journalières historiques : clé API payante (Kraken Pro, CoinGecko Demo+, etc.) ou snapshot embarqué dans le repo.
- Les résultats sont des simulations rétrospectives, non prédictives.

---

## Améliorations proposées

Pistes orientées métier pour la suite, formulées sans présumer de ce qui existe déjà côté interne.

- **Capture de lead sur les simulateurs.** Le simulateur crypto d'origine (sur WordPress) ne capture aucun contact. Une option « recevez le rapport de votre simulation » branchée sur votre CRM (HubSpot) transformerait l'audience des simulateurs en leads mesurables, sans dégrader l'UX. C'est l'amélioration la plus directement liée à votre modèle de média.
- **Tracking d'usage.** Mesurer le taux de complétion, les paramètres les plus saisis et les clics CTA alimenterait un dashboard de pilotage — utile pour prioriser les évolutions de la suite.
- **Mutualisation, si ce n'est pas déjà en place.** Votre suite a déjà une forte cohérence visuelle ; si un design system et un moteur de calcul communs (intérêts composés, DCA, inflation, frais, crédit, crypto) ne sont pas encore formalisés, les centraliser derrière une interface unique accélérerait l'ajout de nouveaux simulateurs. Ce projet est déjà structuré dans cet esprit (provider et stratégies derrière des interfaces).
- **Prix spot temps réel (optionnel).** Pour les simulations se terminant à la date du jour, le ticker Kraken (`/0/public/Ticker`) ou son WebSocket permettrait de valoriser au prix de la minute plutôt qu'au dernier point hebdomadaire — et d'afficher un cours en direct en en-tête. Volontairement hors périmètre du MVP (backtesting historique).

---

## Avertissement

Les résultats sont des **simulations rétrospectives** fondées sur des données historiques. Ils ne constituent ni une prévision ni une recommandation d'investissement. Les crypto-actifs sont très volatils et comportent un risque de perte en capital. Les performances passées ne préjugent pas des performances futures.
