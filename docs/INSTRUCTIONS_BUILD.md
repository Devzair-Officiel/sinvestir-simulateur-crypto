# Instructions de build — Test technique S'investir (Simulateur Crypto)

But : produire un livrable qui coche **chaque consigne du test**, dans l'esprit « demi-journée » (simple, propre, fiable, démontrable). Ce document se suit à la main ou se donne tel quel à Claude Code comme brief d'implémentation.

---

## 0. Les consignes du test, traduites en contraintes

| Consigne du test | Ce que ça impose concrètement |
|---|---|
| Démo en ligne fonctionnelle (Vercel) | URL live cliquable, manipulable, qui ne casse **jamais** pendant l'évaluation. |
| Fidélité au design `simulateurs.sinvestir.fr` | Tokens (couleurs, typo, radius, composants) extraits du vrai site, pas approximés à l'œil. |
| Autonome et intégrable | Composant réutilisable + route `/embed` + exemple iframe. |
| Responsive | Affichage propre desktop **et** mobile, vérifié. |
| Code propre + README | TS strict, métier hors JSX, nommage clair, repo rangé, README sérieux. |
| Stack compatible **ou** choix justifié | Next.js/Vercel = aligné ; justification écrite dans le README. |
| Suggestions d'amélioration | 3 propositions concrètes orientées métier dans le formulaire Tally. |

Règle générale : **livrer simple, propre, fiable, démontrable.** Pas de complexité gratuite, pas d'IA ajoutée « parce que le poste parle d'IA ».

---

## 1. Setup & déploiement « day-zero »

```bash
npx create-next-app@latest sinvestir-simulateur-crypto \
  --typescript --tailwind --app --src-dir --eslint
cd sinvestir-simulateur-crypto
```

- Activer le mode **strict** dans `tsconfig.json` (`"strict": true`).
- `git init`, premier commit, push sur GitHub.
- Importer le repo dans Vercel → **obtenir l'URL live immédiatement**, puis itérer dessus. (On déploie tôt et souvent : c'est le livrable central, on le sécurise en premier.)
- Pas de Docker (Vercel build Next.js nativement). Pas de Supabase dans ce build.

---

## 2. Tokens de design (fidélité visuelle)

Sur `simulateurs.sinvestir.fr`, inspecter et relever :

- couleurs : fond, **gold de marque**, texte principal/secondaire, bordures, états de succès/perte ;
- typographie : `font-family`, échelle de tailles, graisses ;
- `border-radius`, ombres, espacements ;
- style des **cards**, **inputs**, **boutons**.

Reporter dans `tailwind.config.ts` (`theme.extend.colors / fontFamily / borderRadius`). Mentionner la démarche dans le README (« tokens repris de votre suite »). C'est ce qui transforme « j'ai essayé de faire pareil » en « j'ai repris votre système ».

---

## 3. Types & logique de calcul (le cœur — fonctions pures)

`types/simulation.ts` :

```ts
export type Frequency = "once" | "daily" | "weekly" | "monthly";
export type CryptoId = "bitcoin" | "ethereum" | "solana" | "binancecoin" | "ripple" | "cardano";

export interface SimulationParams {
  crypto: CryptoId;
  mode: "lump-sum" | "dca";
  amount: number;        // lump-sum = total investi ; dca = montant PAR versement
  frequency: Frequency;
  startDate: string;     // ISO
  endDate: string;       // ISO
}

export interface MarketPoint { date: string; price: number; } // prix en EUR

export interface SimulationResult {
  totalInvested: number;
  finalValue: number;
  profit: number;            // finalValue - totalInvested
  performancePct: number;    // profit / totalInvested * 100
  contributions: number;     // nombre de versements
  averageBuyPrice: number;   // totalInvested / quantity
  quantity: number;          // crypto accumulée
  timeline: { date: string; invested: number; value: number }[]; // pour le graphe
}
```

**`calculate-lump-sum.ts`** : `quantity = amount / prix(startDate)` ; à chaque point de la période, `value = quantity * prix(point)` ; `finalValue = quantity * prix(endDate)` ; `totalInvested = amount` ; `contributions = 1` ; `averageBuyPrice = prix(startDate)`.

**`calculate-dca.ts`** : générer les dates de versement selon `frequency` entre `startDate` et `endDate` ; pour chacune, mapper sur le **point de prix le plus proche**, `quantity += amount / prix` ; `totalInvested = amount * contributions` ; `averageBuyPrice = totalInvested / quantity` ; `finalValue = quantity * prix(endDate)`. La `timeline` cumule `invested` et `value` à chaque pas.

Ajouter **2–3 tests unitaires** sur ces fonctions (un scénario lump-sum, un scénario DCA) : sur un outil financier, des calculs vérifiables valent plus que n'importe quelle animation.

**OCP — les deux modes derrière une même interface.** Plutôt que des `if (mode === …)` éparpillés, exposer une `SimulationStrategy` commune ; `lump-sum` et `dca` en sont deux implémentations. Ajouter un mode demain (value-averaging…) = une nouvelle classe, zéro modification de l'existant. C'est aussi ce qui prépare le « moteur de simulation commun » proposé en suggestions.

```ts
export interface SimulationStrategy {
  run(params: SimulationParams, prices: MarketPoint[]): SimulationResult;
}
```

**Robustesse numérique** (un calcul faux passe inaperçu mais coule le test) : garde contre la **division par zéro** (prix manquant ou nul, quantité nulle), rejet de `NaN`/`Infinity`, gestion des **points de prix absents** sur une date, et arrondi **uniquement à l'affichage** (la précision reste pleine dans le calcul).

> Règle non négociable : **DCA = montant par versement**, **versement unique = montant total**. À refléter dans le label du champ montant.

---

## 4. Provider de données + fallback

`lib/crypto/provider.ts` :

```ts
export interface MarketChartParams { crypto: CryptoId; from: string; to: string; }
export interface CryptoPriceProvider {
  getMarketChart(params: MarketChartParams): Promise<MarketPoint[]>;
}
```

- `kraken-client.ts` : appelle `https://api.kraken.com/0/public/OHLC?pair={pair}&interval=10080&since={unix}` (API publique, pas de clé), **via la route serveur `app/api/crypto/route.ts`** (le proxy valide les entrées et met en cache avec `revalidate`). Ne jamais appeler Kraken depuis le client.
- `fallback-data.ts` : séries **BTC et ETH** en dur (points mensuels réalistes sur 2018→aujourd'hui). Bascule automatique si l'appel échoue, ralentit ou rate-limit.

**Durcissement du proxy `/api/crypto` (à ne pas négliger — c'est ta seule surface exposée) :**

- **Allowlist stricte** des `crypto` : l'id est injecté dans le chemin upstream `/coins/{id}/…`. Ne jamais y passer une valeur brute du client → mapper l'enum `CryptoId` vers une table d'ids connus. C'est la parade SSRF / injection de chemin.
- **Validation au bord avec Zod** : valider le payload entrant (crypto ∈ enum, dates ISO, `from < to`, pas de date future, plage bornée). Rejeter en `400` avant tout appel upstream.
- **Parser la réponse upstream** : ne pas faire confiance à la forme de la réponse Kraken, la valider avec Zod aussi (*parse, don't assume*) avant de l'exploiter.
- **Timeout + abort** : `AbortController` sur le `fetch` (ex. 8 s) pour qu'un upstream lent ne bloque pas la requête → sinon fallback.
- **429 géré explicitement** : sur rate-limit, basculer proprement sur le fallback, jamais propager l'erreur brute au client.

À écrire dans le README : *« Source isolée derrière un provider pour remplacer facilement Kraken par une API interne, Supabase ou un cache maison ; un fallback local garantit une démo fonctionnelle même en cas d'indisponibilité API. »*

---

## 5. UI (composants courts, métier hors JSX)

- **`SimulationForm.tsx`** : select crypto, choix du mode, champ montant à **label dynamique** (« Montant total » / « Montant par versement »), fréquence (désactivée en mode unique), dates début/fin, bouton **Simuler**, bouton **Réinitialiser**. Validation : dates invalides bloquées, montant > 0. **Exemple prérempli** : Bitcoin, 100 €/mois, janvier 2020 → aujourd'hui.
- **`ResultSummary.tsx`** : les chiffres clés + un **résumé en langage clair** : « Avec ces paramètres, vous auriez investi X €. La valeur simulée serait de Y €, soit une performance de Z %. »
- **`PerformanceChart.tsx`** : deux courbes (valeur du portefeuille vs montant cumulé investi). `recharts` suffit.
- **`Disclaimer.tsx`** : avertissement risque, visible, en premier plan.
- **`ScenarioCards.tsx`** (optionnel) : versement unique vs DCA côte à côte.
- États : **loading**, **erreur propre** (message lisible, pas de stack), dates invalides bloquées.
- Format des montants : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.

**Layout desktop** : titre + intro courte → formulaire à gauche, résultats + graphique + résumé à droite → avertissement en bas pleine largeur.
**Layout mobile** : titre → formulaire → bouton Simuler → résultats → graphique → avertissement (empilé).

---

## 6. Mode embed (intégrabilité)

- `app/page.tsx` → `<CryptoSimulator mode="full" />` (header, intro, contexte).
- `app/embed/page.tsx` → `<CryptoSimulator mode="embed" />` (nu, sans header, pour iframe).
- Snippet iframe documenté dans le README.

---

## 7. Architecture (SOLID), sécurité & qualité

### SOLID, appliqué à CETTE codebase

- **SRP** — une raison de changer par module. `calculate-*` calcule, `kraken-client` récupère, `format-money` formate, les composants affichent, les hooks orchestrent. **Aucune logique métier dans le JSX.**
- **OCP** — extensions sans modification : nouvelle source de prix = nouvelle implémentation de `CryptoPriceProvider` ; nouveau mode de calcul = nouvelle `SimulationStrategy`. On n'édite pas l'existant.
- **LSP** — toute implémentation du provider (`kraken`, `fallback`, future API interne) est **substituable** : même contrat, même forme de retour, mêmes sémantiques d'erreur. Le fallback honore l'interface à l'identique pour s'insérer de façon transparente.
- **ISP** — interfaces minimales : `CryptoPriceProvider` n'expose que `getMarketChart` ; props de composants étroites et ciblées, pas de « god props ».
- **DIP** — l'UI et le moteur dépendent de **l'abstraction** (`CryptoPriceProvider`, `SimulationStrategy`), jamais de Kraken en dur. Le provider concret est injecté depuis un point de composition (factory), pas importé au fond d'un composant.

### Sécurité — checklist concrète

- **Validation systématique au bord** (Zod) : tout input — formulaire ET route API — est parsé/validé avant usage. `unknown` en entrée, type sûr en sortie.
- **Allowlist** des cryptos (l'id part dans l'URL upstream) → pas d'injection de chemin / SSRF.
- **Pas de secret côté client** : Kraken API publique, pas de clé. Si une future source nécessite un secret, le garder côté serveur uniquement (jamais `NEXT_PUBLIC_`, jamais dans le bundle ni les logs).
- **Embed maîtrisé, pas bloqué** : le piège, c'est `X-Frame-Options: DENY` qui casserait l'iframe. À la place, **CSP `frame-ancestors`** scopé aux domaines autorisés (`sinvestir.fr`, `simulateurs.sinvestir.fr`, `*.vercel.app` pour la démo) dans `next.config`. Tu autorises l'embed *où il faut*, tu refuses ailleurs.

```js
// next.config — en-têtes de sécurité (extrait)
headers: async () => [{
  source: "/(.*)",
  headers: [
    { key: "Content-Security-Policy",
      value: "frame-ancestors 'self' https://sinvestir.fr https://simulateurs.sinvestir.fr https://*.vercel.app;" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  ],
}]
```

- **Pas de `dangerouslySetInnerHTML`** : React échappe par défaut, aucune interpolation de donnée non fiable dans le DOM.
- **Erreurs non bavardes** : jamais de stack ni de message upstream renvoyé au client ; erreur typée + bascule fallback.
- **Anti-abus du proxy** : cache agressif (`revalidate`) pour réduire les appels upstream ; rate-limit simple par IP en bonus (mentionné comme évolution si non implémenté).
- **Hygiène des dépendances** : peu de deps, versions épinglées, `npm audit` clean, rien d'abandonné.

### Conventions modernes & propres

- **TypeScript strict**, zéro `any` (préférer `unknown` + narrowing), **unions discriminées** pour les modes et résultats.
- **Server Components par défaut**, `"use client"` réservé aux parties interactives (formulaire, graphe). Idiome App Router actuel.
- **Fonctions pures + immutabilité** dans tout `lib/simulation` ; aucun effet de bord.
- **Config d'environnement typée et validée** au démarrage (Zod) — fail-fast si une var manque.
- **ESLint + Prettier**, nommage cohérent, composants courts (~150 lignes max), unités composables.
- Format monétaire centralisé via `Intl.NumberFormat('fr-FR', …)`.

### Portes de qualité (avant de rendre)

- `npm run lint` ✅, `npm run build` ✅, tests `vitest` ✅.
- Accessibilité : `label` sur chaque champ, `aria-*` utiles, contrastes corrects.
- Responsive vérifié à **375 / 768 / 1280 px**.

---

## 8. README + Loom + Vercel final

- Poser le `README.md` fourni à la racine (remplacer l'URL de démo).
- Redéployer, vérifier l'URL live **et** `/embed`.
- **Loom (5 min)** :
  1. *30 s* — présentation : « J'ai abordé ce test comme une transposition produit intégrable, pas une simple maquette. »
  2. *1 min* — démo : simulation Bitcoin DCA, résultats, responsive.
  3. *1 min* — architecture : composants, lib simulation, provider crypto.
  4. *1 min* — intégrabilité : `/embed` + exemple iframe.
  5. *1 min* — suggestions d'amélioration.

---

## 9. Ordre de priorité (ne pas dévier)

1. Identité visuelle (tokens) — 2. Calcul qui fonctionne — 3. Graphique — 4. Responsive — 5. `/embed` — 6. Fallback API — 7. Nettoyage du code — 8. README — 9. Déploiement Vercel — 10. Loom.

Le cœur du test : **ça marche, c'est propre, ça ressemble à leur suite, c'est intégrable.** Tout le reste est secondaire.

---

## 10. Checklist de conformité finale

- [ ] Démo Vercel live, cliquable, manipulable
- [ ] Tourne même si l'API Kraken est indisponible (fallback testé)
- [ ] Design fidèle aux tokens de `simulateurs.sinvestir.fr`
- [ ] Versement unique + DCA (quotidien/hebdo/mensuel) corrects
- [ ] Tous les résultats clés affichés + résumé pédagogique
- [ ] Graphique valeur vs investi
- [ ] Avertissement risque visible
- [ ] `/embed` + snippet iframe fonctionnels
- [ ] Responsive 375 / 768 / 1280
- [ ] `npm run lint` et `npm run build` passent
- [ ] Inputs validés (Zod) côté form **et** côté route API
- [ ] Allowlist des cryptos validée côté serveur (anti-SSRF)
- [ ] `frame-ancestors` autorise l'embed sur les bons domaines uniquement
- [ ] Garde-fous numériques (division par zéro, NaN, prix manquants)
- [ ] Provider et stratégies de calcul derrière leurs interfaces (SOLID)
- [ ] README à jour (URL démo remplacée)
- [ ] Repo rangé, métier séparé de l'UI
- [ ] Loom enregistré
- [ ] 3 suggestions saisies dans le formulaire Tally

---

## 11. À mettre dans le formulaire Tally (regard de partenaire)

Trois propositions concrètes, formulées par le métier — pas par la techno :

1. **Design system commun aux simulateurs** : mutualiser cards, inputs, sliders, graphiques et disclaimers pour une cohérence et une vélocité accrues sur toute la suite.
2. **Moteur de simulation partagé** : intérêts composés, DCA, inflation, frais, crédit, crypto derrière une logique de calcul unique, testée et réutilisable.
3. **Tracking d'usage** : taux de complétion, paramètres les plus saisis, clics CTA, erreurs API → de la matière directe pour un dashboard de pilotage (et, en option, une capture de lead vers HubSpot pour transformer l'audience des simulateurs en leads mesurables).

Ces axes collent à vos vraies missions : outils internes, automatisation, dashboards, logique produit.
