# Simulateur Crypto — Suite S'investir

Transposition du [simulateur crypto S'investir](https://sinvestir.fr/simulateur-crypto-monnaie/) en composant **Next.js autonome, responsive et intégrable**, aligné sur l'identité visuelle de la suite [simulateurs.sinvestir.fr](https://simulateurs.sinvestir.fr/).

> **Démo en ligne** : https://VOTRE-DEMO.vercel.app
> **Mode embed** : https://VOTRE-DEMO.vercel.app/embed

---

## Objectif

Reprendre la **logique fonctionnelle** du simulateur crypto existant — sélection d'un actif, montant, fréquence, période, DCA vs versement unique, calcul de la plus-value sur données historiques — et la faire entrer dans l'**écosystème produit** des simulateurs S'investir, plutôt que de recopier la page d'origine.

Le rendu est pensé comme un **composant réutilisable**, prêt à vivre dans la suite Next.js existante ou à être embarqué proprement dans une page externe.

---

## Stack

| Choix | Raison |
|---|---|
| **Next.js (App Router) + TypeScript** | Aligné sur votre stack interne ; reprise et intégration sans friction. |
| **Tailwind CSS** | Tokens de design extraits de votre suite → fidélité visuelle maîtrisée. |
| **Vercel** | Déploiement natif Next.js, identique à vos simulateurs. |
| **Provider crypto isolé** | Source de données derrière une interface (CoinGecko aujourd'hui, API interne ou cache demain). |

Pas de base de données : le périmètre ne le justifie pas. La persistance (capture de lead, cache de prix) est proposée en piste d'évolution, pas embarquée ici.

---

## Fonctionnalités

- Sélection de la cryptomonnaie (BTC, ETH, SOL, BNB, XRP, ADA)
- Versement unique **ou** DCA (quotidien / hebdomadaire / mensuel)
- Période personnalisée (date de début / fin)
- Résultats : total investi, valeur finale, plus/moins-value (€), performance (%), nombre de versements, prix moyen d'achat, quantité accumulée
- Graphique : valeur du portefeuille vs montant cumulé investi
- Résumé pédagogique en langage clair
- Avertissement risque traité comme **composant de premier plan**, pas comme un bas de page
- **Mode embed** pour intégration iframe
- **Fallback local** si l'API est indisponible → la démo fonctionne toujours

---

## Architecture

```
src/
  app/
    page.tsx                 # page complète (header, intro, contexte)
    embed/page.tsx           # version nue, pensée pour iframe
    api/crypto/route.ts      # proxy CoinGecko : masque la clé, met en cache
  components/simulator/
    CryptoSimulator.tsx      # composant racine, mode "full" | "embed"
    SimulationForm.tsx
    ResultSummary.tsx
    PerformanceChart.tsx
    ScenarioCards.tsx
    Disclaimer.tsx
  lib/
    crypto/
      provider.ts            # interface CryptoPriceProvider
      coingecko-client.ts    # implémentation CoinGecko
      fallback-data.ts       # jeu de données local BTC / ETH
    simulation/
      calculate-dca.ts       # fonctions pures, testables
      calculate-lump-sum.ts
      format-money.ts
      date-utils.ts
  types/
    simulation.ts
```

Principe directeur : **la logique métier ne touche jamais le JSX**. Les calculs (`lib/simulation`) sont des fonctions pures, indépendantes de l'UI et de la source de données. La récupération des prix passe par une interface `CryptoPriceProvider` — remplacer CoinGecko par une API interne ne change qu'un fichier.

---

## Logique de calcul

- **Versement unique** : le montant saisi est le **total investi**. Quantité = montant ÷ prix à la date de début ; valeur finale = quantité × prix à la date de fin.
- **DCA** : le montant saisi est investi **à chaque échéance**. À chaque date de versement, quantité += montant ÷ prix du jour. Total investi = montant × nombre de versements ; prix moyen d'achat = total investi ÷ quantité totale.

L'ambiguïté « montant total » vs « montant par versement » est levée explicitement dans l'interface, pour éviter toute lecture erronée des résultats.

---

## Lancer le projet

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run lint     # passe sans erreur
npm run build    # passe sans erreur
```

Variable d'environnement optionnelle (sinon fallback automatique) :

```bash
# .env.local
COINGECKO_API_KEY=...   # clé démo CoinGecko, lue uniquement côté serveur
```

---

## Mode embed

Le simulateur est conçu pour être embarqué tel quel via iframe :

```html
<iframe
  src="https://VOTRE-DEMO.vercel.app/embed"
  width="100%"
  height="720"
  style="border:0; border-radius:16px;"
  title="Simulateur Crypto S'investir"
></iframe>
```

La route `/embed` rend le même composant sans header ni contexte de page : peu de dépendances, intégration propre.

---

## Partis pris

- Séparation stricte entre **UI**, **calculs** et **récupération des données** (SRP).
- Source de prix et modes de calcul derrière des **interfaces** (`CryptoPriceProvider`, `SimulationStrategy`) : ouverts à l'extension, fermés à la modification (OCP/DIP). Remplacer CoinGecko ou ajouter un mode ne touche pas l'existant.
- Composant principal réutilisable (`mode="full"` / `mode="embed"`).
- **Validation systématique des entrées** (formulaire et route API), **secrets côté serveur uniquement**, embed contrôlé par `frame-ancestors`.
- Fallback local pour garantir une démo fonctionnelle même API indisponible.
- TypeScript strict, fonctions de calcul pures et testées, garde-fous numériques.
- Avertissement pédagogique en composant visible, dans l'esprit réglementaire de votre univers.
- Montant DCA clarifié (par versement) pour éviter toute confusion sur les résultats.

---

## Limites connues

- Périmètre volontairement réduit à un MVP, dans l'esprit « demi-journée ».
- Les données dépendent de l'API et de sa disponibilité (d'où le fallback local).
- Les résultats sont des simulations rétrospectives, non prédictives.

---

## Améliorations proposées

Pistes pensées pour la **suite de simulateurs**, au-delà du test :

- **Design system commun** à tous les simulateurs : cards, inputs, sliders, graphiques, disclaimers mutualisés.
- **Moteur de simulation partagé** : intérêts composés, DCA, inflation, frais, crédit, crypto derrière une même logique de calcul.
- **Tracking d'usage** : taux de complétion, paramètres les plus utilisés, clics CTA, erreurs API → matière à dashboard de pilotage.
- **Capture de lead optionnelle** (« recevoir le rapport de ma simulation ») branchée sur HubSpot, avec persistance Supabase ou cache de prix côté serveur.
- Comparaison multi-cryptos et export PDF / CSV.

---

## Avertissement

Les résultats sont des **simulations rétrospectives** fondées sur des données historiques. Ils ne constituent ni une prévision, ni une recommandation d'investissement. Les crypto-actifs sont très volatils et comportent un risque de perte en capital. Les performances passées ne préjugent pas des performances futures.