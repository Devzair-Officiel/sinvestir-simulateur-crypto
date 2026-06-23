# Design — Simulateurs S'investir

> Source de vérité pour la phase UI. Remplace `AUDIT_DESIGN.md` (audit image, estimations) et `DESIGN_TOKENS.md` (relevés DevTools).
> Objectif : reprendre le thème visuel de `simulateurs.sinvestir.fr` pour intégrer un simulateur crypto cohérent avec la suite d'outils existante.

---

## 1. Fiabilité des valeurs

Les couleurs, la police et la classe du bouton primaire sont **issues des DevTools live** de `simulateurs.sinvestir.fr` et du SVG du logo. Le reste (radius, spacing, échelle typo, layout) provient de l'audit visuel et reste un guide de référence, pas une mesure exacte.

Stack du site : **Nuxt + Tailwind v4 + Nuxt UI**. Conséquence pratique : l'échelle typo et le `--spacing` sont les défauts Tailwind, repris gratuitement par ton projet Next + Tailwind.

---

## 2. ADN visuel

Dashboard financier **dark premium** :

- fond bleu nuit quasi noir ;
- cards en navy profond ;
- contraste blanc / gris bleuté ;
- accent bleu vif `#1098F7` (focus, données graphique) ;
- CTA bleu profond `#0049C6` (pill, font-light) ;
- or **réservé au logo** ;
- composants arrondis, propres, sobres ;
- impression SaaS / fintech / outil patrimonial ;
- peu de décoration, priorité à la lisibilité des résultats.

**À éviter** : fond blanc ; couleurs crypto flashy ; style « trading app » agressif ; gradients multicolores ; boutons orange ou vert par défaut ; effets 3D / glassmorphism trop visibles ; **or sur les boutons ou les courbes du graphe** (le site ne le fait pas — c'est exclusif au logo).

---

## 3. Palette confirmée

### Surfaces et texte

| Usage | Token | Hex | Origine DevTools |
|---|---|---|---|
| Fond principal | `--surface` | `#080C16` | `--color-surface` |
| Surface (cards) | `--surface-soft` | `#0F172A` | `--color-surface-soft` |
| Surface élevée (panneaux) | `--surface-elevated` | `#00173F` | `--color-surface-elevated` |
| Texte principal | `--text-primary` | `#FFFFFF` | `--color-text` |
| Texte atténué | `--text-muted` | `#9CA3AF` | `--color-text-muted` |
| Texte microcopy | `--text-faint` | `#69758C` | Échelle locale, fond sombre |

### Marque et interactions

| Usage | Token | Hex | Origine |
|---|---|---|---|
| **CTA / bouton primaire** | `--cta` | `#0049C6` | Classe `violet-blue` du site |
| **Accent / focus** | `--accent` | `#1098F7` | `--color-ring` |
| Bordure subtile | `--border-subtle` | `rgba(255,255,255,0.06)` | — |
| Bordure visible | `--border` | `rgba(255,255,255,0.10)` | — |
| Bordure focus | `--border-focus` | `#1098F7` | `--color-ring` |
| Or marque (plat) | `--gold` | `#E2BD2A` | Logo SVG, point médian du dégradé |
| Or marque (dégradé) | `--gold-gradient` | voir ci-dessous | Logo SVG `<linearGradient>` |

### Graphique

| Série | Token | Hex |
|---|---|---|
| Montant investi (cyan) | `--chart-invested` | `#1098F7` |
| Valeur du portefeuille | `--chart-portfolio` | `#FFFFFF` (ou trait gold ponctuel) |
| Zone sous courbe (bleu) | `--chart-area` | `rgba(16, 152, 247, 0.18)` |
| Grille | `--chart-grid` | `rgba(255,255,255,0.06)` |
| Axes | `--chart-axis` | `#9CA3AF` |

> **Règle d'or** : l'or est dans le **logo SVG uniquement**, sous forme de dégradé métallique. Aucun or ailleurs sur le site. Sur ton simulateur, ne pas l'utiliser sur les boutons, les courbes principales, les KPI. Tolérable : un seul trait or sur la courbe « valeur finale » si tu veux un clin d'œil de marque, sinon famille bleue + blanc.

---

## 4. Tokens CSS prêts à coller

```css
:root {
  color-scheme: dark;

  /* Surfaces & texte (DevTools) */
  --surface: #080C16;
  --surface-soft: #0F172A;
  --surface-elevated: #00173F;
  --text-primary: #FFFFFF;
  --text-muted: #9CA3AF;
  --text-faint: #69758C;
  --text-on-primary: #FFFFFF;

  /* Marque & interactions (DevTools) */
  --cta: #0049C6;
  --cta-hover-filter: brightness(1.1);
  --accent: #1098F7;
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);
  --border-focus: #1098F7;

  /* Or — réservé au logo */
  --gold: #E2BD2A;
  --gold-gradient: linear-gradient(105deg,
    #D6AA00 0%, #E4C031 33%, #FFEA8F 49%, #E7C53D 52%,
    #D6AB02 68%, #FFEA8F 82%, #E2BD2A 100%);

  /* Graphique */
  --chart-invested: #1098F7;
  --chart-portfolio: #FFFFFF;
  --chart-area: rgba(16, 152, 247, 0.18);
  --chart-grid: rgba(255, 255, 255, 0.06);
  --chart-axis: #9CA3AF;

  /* Forme */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 9999px;

  /* Ombres */
  --shadow-card: 0 18px 60px rgba(0, 0, 0, 0.35);
  --shadow-soft: 0 12px 40px rgba(0, 0, 0, 0.22);
}

body {
  background: var(--surface);
  color: var(--text-primary);
}
```

---

## 5. Typographie

**Lexend** (Google Font, confirmé via `@font-face` du site), avec `font-feature-settings: "ss01" "ss02"` pour les variantes stylistiques observées.

```ts
// app/layout.tsx
import { Lexend } from 'next/font/google';
const lexend = Lexend({ subsets: ['latin'], variable: '--font-lexend' });

// <html lang="fr" className={lexend.variable}>
```

```css
html {
  font-family: var(--font-lexend), ui-sans-serif, system-ui, sans-serif;
  font-feature-settings: "ss01" on, "ss02" on;
}
```

### Échelle typographique

| Élément | Taille | Weight | Line-height | Commentaire |
|---|---:|---:|---:|---|
| Titre page | 32–40px | 700 | 1.1 | « Simulateur crypto » |
| Titre simulateur | 26–32px | 700 | 1.15 | — |
| Titre section | 18–22px | 600 | 1.25 | « Vos résultats » |
| Titre card | 15–17px | 600 | 1.3 | KPI / simulateurs |
| Label input | 12–13px | 500 | 1.2 | Gris bleuté |
| Texte courant | 14–15px | 400 | 1.5 | Descriptions |
| Microcopy | 11–12px | 400 | 1.4 | Aide, disclaimer, légendes |
| Valeur KPI | 22–30px | 700 | 1.1 | Montants, résultat final |

### Style texte

Titres courts, très lisibles, pas trop gros. Labels et descriptions en `--text-muted`. Montants en blanc pur. Accents colorés réservés aux graphiques et badges.

---

## 6. Radius et formes

```ts
const radius = {
  input: '12px',
  button: '12px',   // exception : CTA primaire = pill (9999px)
  card: '16px',
  panel: '20px',
  pill: '9999px',
};
```

| Composant | Radius |
|---|---:|
| Bouton primaire (CTA) | **9999px (pill)** |
| Bouton secondaire / ghost | 12px |
| Input / Select | 12px |
| Card standard | 16px |
| Grand panel graphique | 20px |
| Badge / chip | 9999px |
| Icône dans card | 9999px |

---

## 7. Cards

### Card standard

```css
.card {
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
}
```

### Card KPI

```css
.kpi-card {
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--border-subtle);
  padding: 18px;
}
.kpi-label { color: var(--text-muted); font-size: 12px; }
.kpi-value { color: var(--text-primary); font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
```

### Card type catalogue (hover)

```css
.simulator-card {
  border-radius: 16px;
  background: var(--surface-soft);
  border: 1px solid var(--border-subtle);
  padding: 24px;
  transition: border-color .2s ease, transform .2s ease, background .2s ease;
}
.simulator-card:hover {
  transform: translateY(-2px);
  background: var(--surface-elevated);
  border-color: var(--border);
}
```

---

## 8. Inputs

Sombres, sobres, unité ou suffixe lisible.

```css
.input-wrapper { display: flex; flex-direction: column; gap: 8px; }
.input-label   { color: var(--text-muted); font-size: 12px; font-weight: 500; }

.input {
  height: 44px;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.88);   /* --surface-soft + transparence */
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0 14px;
  outline: none;
}
.input::placeholder { color: var(--text-faint); }

.input:focus {
  border-color: var(--border-focus);    /* #1098F7 */
  box-shadow: 0 0 0 3px rgba(16, 152, 247, 0.20);
}
```

**Select / dropdown** : même style, hauteur 44–48px, flèche discrète.

**Sliders** (si utilisés) : track sombre, progression bleue `--accent`, thumb blanc ou bleu. Aucun rouge/vert.

---

## 9. Boutons

### Primaire — **pill**, **font-light**

Le bouton primaire du site est **pill** (`rounded-full`), en **`font-light`**, fond plat `#0049C6`, texte blanc, transition `brightness` au survol. C'est la signature visuelle des CTA de S'investir.

```css
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
  height: 44px;
  padding: 0 24px;
  border-radius: var(--radius-pill);
  background: var(--cta);
  color: var(--text-on-primary);
  border: 1px solid var(--cta);
  font-weight: 300;
  font-size: 14px;
  transition: filter 400ms ease, transform .15s ease;
  outline: none;
}
.btn-primary:hover { filter: var(--cta-hover-filter); }
.btn-primary:disabled { opacity: .5; pointer-events: none; }
```

### Secondaire — radius standard

```css
.btn-secondary {
  height: 44px;
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.92);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn-secondary:hover {
  background: var(--surface-soft);
  border-color: var(--border-strong);
}
```

### Ghost

```css
.btn-ghost {
  color: var(--text-muted);
  background: transparent;
  border-radius: 10px;
}
.btn-ghost:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.04);
}
```

---

## 10. Graphiques

Style : fond sombre, grille discrète, labels gris bleuté, **famille bleue + blanc**. Pas d'or sur les séries (réservé au logo).

```ts
const chartColors = {
  invested:   '#1098F7',                       // accent / bleu vif
  portfolio:  '#FFFFFF',                       // blanc — ou trait gold ponctuel
  areaBlue:   'rgba(16, 152, 247, 0.18)',
  grid:       'rgba(255, 255, 255, 0.06)',
  axis:       '#9CA3AF',
};
```

### Pour le simulateur crypto

- **Montant investi** : `--chart-invested` (bleu vif).
- **Valeur du portefeuille** : blanc — ou `--gold` *ponctuellement* si tu veux un clin d'œil de marque.
- **Plus-value** : blanc, badge `--accent` discret si positif.
- **Moins-value** : orange doux uniquement si nécessaire (jamais rouge agressif).
- **Comparaison DCA vs versement unique** (optionnelle) : deux nuances de bleu — pas bleu + gold.

---

## 11. Layout

### Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ Header / Logo / titre court                                 │
├─────────────────────────────────────────────────────────────┤
│ Titre : Simulateur Crypto                                   │
│ Texte : Simulez une stratégie d'investissement historique   │
├───────────────────────────────┬─────────────────────────────┤
│ Card paramètres               │ Card résultats              │
│ - Crypto                      │ - Total investi             │
│ - Montant                     │ - Valeur finale             │
│ - Fréquence                   │ - Plus-value                │
│ - Date début / fin            │ - Performance %             │
│ - Bouton Simuler              │                             │
├───────────────────────────────┴─────────────────────────────┤
│ Grand panel graphique                                       │
├─────────────────────────────────────────────────────────────┤
│ Disclaimer pédagogique                                      │
└─────────────────────────────────────────────────────────────┘
```

### Mobile

```
Titre
Intro courte
Card paramètres
Bouton Simuler
Card résultats
Graphique
Résumé pédagogique
Disclaimer
```

---

## 12. Spacing

| Usage | Valeur |
|---|---:|
| Padding page desktop | 32–48px |
| Padding page mobile | 16–20px |
| Gap entre sections | 24–32px |
| Padding card | 20–24px |
| Gap champs formulaire | 16px |
| Gap KPI | 12–16px |
| Hauteur input | 44–48px |
| Hauteur bouton | 44–48px |

---

## 13. Effets visuels

### Fond de page (halos sobres)

```css
.page-background {
  background:
    radial-gradient(circle at 20% 0%,  rgba(16, 152, 247, 0.10), transparent 32%),
    radial-gradient(circle at 80% 20%, rgba(0, 73, 198, 0.08),  transparent 28%),
    var(--surface);
}
```

### Card glow (très léger)

```css
.card-glow {
  box-shadow:
    0 18px 60px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

À éviter : glow trop visible, blur fort, ombres blanches, borders contrastées, gradient or sur boutons.

---

## 14. tailwind.config.ts

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-lexend)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#080C16',
          soft: '#0F172A',
          elevated: '#00173F',
        },
        ink: {
          DEFAULT: '#FFFFFF',
          muted: '#9CA3AF',
          faint: '#69758C',
        },
        cta: '#0049C6',
        accent: '#1098F7',
        gold: '#E2BD2A',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
      boxShadow: {
        card: '0 18px 60px rgba(0,0,0,0.35)',
        soft: '0 12px 40px rgba(0,0,0,0.22)',
      },
    },
  },
};

export default config;
```

---

## 15. Exemple de card (Tailwind)

```tsx
<div className="rounded-lg border border-white/10 bg-surface-soft p-6 shadow-card">
  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-elevated">
    <Icon className="h-5 w-5 text-accent" />
  </div>
  <h3 className="text-base font-semibold text-white">Simulateur crypto</h3>
  <p className="mt-2 text-sm leading-6 text-ink-muted">
    Simulez une stratégie d'investissement historique en versement unique ou programmé.
  </p>
</div>
```

---

## 16. Exemple de page Next.js cohérente

```tsx
export default function CryptoSimulatorPage() {
  return (
    <main className="min-h-screen bg-surface text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <p className="mb-3 text-sm font-medium text-accent">Simulateurs S'investir</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Simulateur crypto
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted md:text-base">
            Simulez une stratégie d'investissement historique en cryptomonnaie et
            comparez un versement unique à une approche progressive.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-white/10 bg-surface-soft p-6 shadow-card">
            {/* Formulaire */}
          </section>
          <section className="rounded-lg border border-white/10 bg-surface-soft p-6 shadow-card">
            {/* Résultats + graphique */}
          </section>
        </div>
      </section>
    </main>
  );
}
```

---

## 17. Logo S'investir (or)

Le logo combine un « S » doré en dégradé et le mot « SIMULATEURS » en blanc. À reproduire **exclusivement avec le SVG fourni** (ou un import du fichier), jamais redessiné à la main : la subtilité du dégradé métallique est ce qui le rend authentique.

```css
.brand-gold-text {
  background: var(--gold-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

À utiliser **uniquement sur le logo**, jamais sur un titre de page ni un bouton.

---

## 18. Différenciation à montrer

1. Respecter le dark dashboard, les cards navy, les boutons bleus en pill et l'or réservé au logo.
2. Composant `CryptoSimulator` réutilisable, pas une page figée.
3. Mode `embed` sobre, sans header complet.
4. Résultats pédagogiques, pas seulement numériques.
5. Disclaimer d'investissement clair, traité comme composant visible.
6. Partis pris documentés dans le README.
7. Aucune surenchère graphique crypto.

---

## 19. Checklist visuelle avant livraison

- [ ] Police **Lexend** chargée via `next/font/google`.
- [ ] Fond principal `#080C16`, pas noir pur visible partout.
- [ ] Cards `#0F172A` arrondies (16px) avec bordure `white/10`.
- [ ] **Bouton primaire pill, fond `#0049C6`, font-light**, hover brightness.
- [ ] Focus visible bleu `#1098F7` sur tous les inputs.
- [ ] Or **réservé au logo** — aucun or sur les boutons, ni sur les courbes principales.
- [ ] Texte principal blanc / secondaire `#9CA3AF`.
- [ ] Graphique lisible sur fond sombre, séries cyan/blanc.
- [ ] Responsive mobile propre (375 / 768 / 1280).
- [ ] Aucun vert/rouge agressif.
- [ ] README explique que le design reprend les standards S'investir.

---

## 20. Résumé rapide pour Claude Code

```txt
Créer un simulateur crypto Next.js/TypeScript/Tailwind aligné avec le design
des simulateurs S'investir : dark dashboard premium, police Lexend (next/font),
fond #080C16, cards #0F172A, panneaux #00173F, bordures white/10, accent
focus #1098F7. Bouton primaire = pill (rounded-full), font-light, fond plat
#0049C6, hover brightness-110. Or #E2BD2A réservé au logo SVG uniquement —
jamais sur les boutons ni sur les courbes du graphe. Radius 12-20px. Cards
arrondies, inputs sombres (44px), KPI en cards, graphique sur fond navy avec
séries cyan / blanc. Responsive desktop/mobile + mode embed minimal.
```
