# Audit design — Simulateurs S’investir

> Objectif : reprendre le thème visuel de `simulateurs.sinvestir.fr` pour intégrer un simulateur crypto cohérent avec la suite d’outils existante.

## 1. Niveau de fiabilité des relevés

Les valeurs ci-dessous sont issues :

- de la page publique `simulateurs.sinvestir.fr` ;
- de l’image officielle utilisée sur le site S’investir pour présenter la suite de simulateurs ;
- d’une analyse visuelle et colorimétrique de cette image.

Important : les couleurs ont été mesurées sur une image compressée `.webp`. Elles sont donc fiables pour reproduire l’identité visuelle, mais elles peuvent différer de quelques points RGB par rapport aux tokens CSS exacts du projet original. La typographie exacte et les radius exacts n’ont pas pu être vérifiés dans le CSS source. Les valeurs proposées sont donc des équivalents très proches, à confirmer si tu as accès à DevTools ou au repo.

---

## 2. ADN visuel général

Le design des simulateurs S’investir est un **dashboard financier dark premium** :

- fond bleu nuit très sombre ;
- cartes en navy profond ;
- contraste blanc / gris bleuté ;
- accents bleu électrique ;
- accent gold de marque ;
- graphiques en bleu, cyan, gold et orange ;
- composants arrondis, propres, sobres ;
- impression SaaS / fintech / outil patrimonial ;
- très peu de décoration inutile ;
- priorité à la lisibilité des résultats.

À éviter :

- fond blanc ;
- couleurs crypto trop flashy ;
- style “trading app” agressif ;
- gradients multicolores excessifs ;
- boutons orange ou vert par défaut ;
- effets 3D ou glassmorphism trop visibles.

---

## 3. Palette recommandée

### 3.1 Couleurs principales

| Usage | Token proposé | Hex | Commentaire |
|---|---:|---:|---|
| Fond principal | `--background` | `#000310` | Bleu nuit quasi noir, base du dashboard. |
| Fond alternatif | `--background-soft` | `#010518` | Variante légèrement plus bleutée. |
| Surface principale | `--surface` | `#0D1121` | Couleur dominante des cards. |
| Surface secondaire | `--surface-soft` | `#10172D` | Pour panneaux, zones de résultats, blocs internes. |
| Surface sidebar | `--sidebar` | `#0F1F43` | Bleu nuit plus lisible pour navigation latérale. |
| Surface active | `--surface-active` | `#154178` | État actif discret, surtout navigation ou toggle. |
| Bordure subtile | `--border-subtle` | `rgba(255,255,255,0.06)` | Bordures de cartes et inputs. |
| Bordure visible | `--border` | `rgba(255,255,255,0.10)` | Pour composants importants. |
| Bordure focus | `--border-focus` | `#2E65C1` | Focus input / bouton actif. |

### 3.2 Couleurs de marque et accents

| Usage | Token proposé | Hex | Commentaire |
|---|---:|---:|---|
| Gold marque | `--brand-gold` | `#FDCE49` | Accent gold observé sur les visuels. À utiliser avec parcimonie. |
| Gold doux | `--brand-gold-soft` | `#F8D347` | Variante plus douce pour courbes, badges, highlights. |
| Bleu primaire | `--brand-blue` | `#0444B3` | Boutons principaux / CTA. |
| Bleu primaire hover | `--brand-blue-hover` | `#0B5ED7` | Hover CTA. |
| Bleu actif sombre | `--brand-blue-dark` | `#062869` | Dégradé ou état pressed. |
| Cyan graphique | `--chart-cyan` | `#0F98F7` | Données “capital”, courbes ou points. |
| Orange graphique | `--chart-orange` | `#FF7301` | Données secondaires type intérêts. |
| Bleu zone graphique | `--chart-blue-area` | `#2C5A81` | Remplissage de zone sous courbe. |

### 3.3 Textes

| Usage | Token proposé | Hex | Commentaire |
|---|---:|---:|---|
| Texte principal | `--text-primary` | `#F8FAFC` | Titres, valeurs clés. |
| Texte secondaire | `--text-secondary` | `#AAB3C5` | Labels, descriptions courtes. |
| Texte muted | `--text-muted` | `#69758C` | Microcopy, légendes, placeholders. |
| Texte très discret | `--text-faint` | `#4B5568` | Axes de graphiques, hints secondaires. |
| Texte sur bouton | `--text-on-primary` | `#FFFFFF` | CTA principal. |

---

## 4. Tokens CSS prêts à coller

```css
:root {
  color-scheme: dark;

  --background: #000310;
  --background-soft: #010518;

  --surface: #0d1121;
  --surface-soft: #10172d;
  --surface-muted: #131828;
  --sidebar: #0f1f43;
  --surface-active: #154178;

  --brand-gold: #fdce49;
  --brand-gold-soft: #f8d347;
  --brand-blue: #0444b3;
  --brand-blue-hover: #0b5ed7;
  --brand-blue-dark: #062869;

  --chart-cyan: #0f98f7;
  --chart-orange: #ff7301;
  --chart-blue-area: #2c5a81;

  --text-primary: #f8fafc;
  --text-secondary: #aab3c5;
  --text-muted: #69758c;
  --text-faint: #4b5568;
  --text-on-primary: #ffffff;

  --border-subtle: rgba(255, 255, 255, 0.06);
  --border: rgba(255, 255, 255, 0.10);
  --border-strong: rgba(255, 255, 255, 0.16);
  --border-focus: #2e65c1;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 999px;

  --shadow-card: 0 18px 60px rgba(0, 0, 0, 0.35);
  --shadow-soft: 0 12px 40px rgba(0, 0, 0, 0.22);
}
```

---

## 5. Typographie

Typographie exacte non vérifiée dans le CSS source.

Équivalent recommandé :

```ts
fontFamily: {
  sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
}
```

### Échelle typographique recommandée

| Élément | Taille | Weight | Line-height | Commentaire |
|---|---:|---:|---:|---|
| Titre page | 32–40px | 700 | 1.1 | Exemple : “Simulateur crypto”. |
| Titre simulateur | 26–32px | 700 | 1.15 | Pour la page du simulateur. |
| Titre section | 18–22px | 600 | 1.25 | Exemple : “Vos résultats”. |
| Titre card | 15–17px | 600 | 1.3 | Cartes simulateurs / KPI. |
| Label input | 12–13px | 500 | 1.2 | Gris bleuté. |
| Texte courant | 14–15px | 400 | 1.5 | Descriptions. |
| Microcopy | 11–12px | 400 | 1.4 | Aide, disclaimer, légendes. |
| Valeur KPI | 22–30px | 700 | 1.1 | Montants, résultat final. |

### Style texte observé

- Titres courts, très lisibles, pas trop gros.
- Labels et descriptions en gris bleuté.
- Montants mis en avant en blanc pur ou quasi blanc.
- Accents colorés seulement sur les graphiques, badges ou valeurs clés.

---

## 6. Radius et formes

Les composants ont un arrondi moderne, mais pas exagéré.

| Composant | Radius recommandé | Commentaire |
|---|---:|---|
| Bouton principal | 12px à 999px | Sur certains boutons, rendu presque pill. |
| Input | 10–12px | Champ propre, compact. |
| Card standard | 14–16px | Cartes simulateur / panneaux. |
| Grand panel graphique | 18–22px | Bloc résultats / graphique. |
| Badge / chip | 999px | Toggle, statut, légende. |
| Icône dans card | 999px | Rond ou cercle bordé. |

Recommandation simple pour ton test :

```ts
const radius = {
  input: '12px',
  button: '12px',
  card: '16px',
  panel: '20px',
  pill: '999px',
}
```

---

## 7. Style des cards

### Card standard

Utilisation : formulaire, bloc de résultats, bloc d’explication.

```css
.card {
  border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(16, 23, 45, 0.96), rgba(13, 17, 33, 0.96));
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
}
```

### Card résultat / KPI

```css
.kpi-card {
  border-radius: var(--radius-lg);
  background: rgba(13, 17, 33, 0.92);
  border: 1px solid var(--border-subtle);
  padding: 18px;
}

.kpi-label {
  color: var(--text-secondary);
  font-size: 12px;
}

.kpi-value {
  color: var(--text-primary);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
```

### Card simulateur type catalogue

Pattern observé :

- icône ronde en haut ;
- titre blanc ;
- description courte gris bleuté ;
- fond navy ;
- bordure très subtile ;
- hover légèrement plus clair.

```css
.simulator-card {
  border-radius: 16px;
  background: #0d1121;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 24px;
  transition: border-color .2s ease, transform .2s ease, background .2s ease;
}

.simulator-card:hover {
  transform: translateY(-2px);
  background: #10172d;
  border-color: rgba(255,255,255,0.12);
}
```

---

## 8. Style des inputs

Les inputs doivent être sombres, sobres, avec unité ou suffixe lisible.

```css
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.input {
  height: 44px;
  border-radius: 12px;
  background: rgba(16, 23, 45, 0.88);
  border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-primary);
  padding: 0 14px;
  outline: none;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(46, 101, 193, 0.18);
}
```

### Select / dropdown

Même style que les inputs. Prévoir une hauteur de 44–48px et une flèche discrète.

### Sliders

Si tu utilises des sliders :

- track sombre ;
- progression bleue ;
- thumb blanc ou bleu ;
- pas de rouge/vert crypto.

---

## 9. Style des boutons

### Bouton primaire

```css
.btn-primary {
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(180deg, #0b5ed7, #0444b3);
  color: #ffffff;
  border: 1px solid rgba(255,255,255,0.10);
  font-weight: 600;
  box-shadow: 0 10px 28px rgba(4, 68, 179, 0.28);
}

.btn-primary:hover {
  background: linear-gradient(180deg, #1673f9, #0b5ed7);
}
```

### Bouton secondaire

```css
.btn-secondary {
  height: 44px;
  border-radius: 12px;
  background: rgba(16, 23, 45, 0.92);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(19, 24, 40, 1);
  border-color: var(--border-strong);
}
```

### Bouton ghost / action discrète

```css
.btn-ghost {
  color: var(--text-secondary);
  background: transparent;
  border-radius: 10px;
}

.btn-ghost:hover {
  color: var(--text-primary);
  background: rgba(255,255,255,0.04);
}
```

---

## 10. Graphiques

Style observé :

- fond très sombre ;
- grille discrète ;
- labels gris bleuté ;
- courbes ou zones en bleu ;
- gold utilisé pour scénario secondaire ;
- légendes en bas avec petits points colorés.

### Couleurs séries recommandées

```ts
const chartColors = {
  invested: '#0F98F7',
  portfolio: '#FDCE49',
  feesOrInterest: '#FF7301',
  areaBlue: 'rgba(44, 90, 129, 0.72)',
  grid: 'rgba(255,255,255,0.06)',
  axis: '#69758C',
}
```

### Pour le simulateur crypto

Recommandation :

- `Montant investi` : cyan / bleu clair ;
- `Valeur finale simulée` : gold ;
- `Plus-value` : blanc avec accent gold si positif ;
- `Moins-value` : orange doux, pas rouge agressif ;
- `DCA` et `versement unique` : deux courbes distinctes, bleu et gold.

---

## 11. Layout recommandé pour ton simulateur crypto

### Desktop

```txt
┌─────────────────────────────────────────────────────────────┐
│ Header / Logo / titre court                                 │
├─────────────────────────────────────────────────────────────┤
│ Titre : Simulateur Crypto                                   │
│ Texte : Simulez une stratégie d’investissement historique   │
├───────────────────────────────┬─────────────────────────────┤
│ Card paramètres               │ Card résultats              │
│ - Crypto                      │ - Total investi             │
│ - Montant                     │ - Valeur finale             │
│ - Fréquence                   │ - Plus-value                │
│ - Date début / fin            │ - Performance %             │
│ - Bouton Simuler              │                             │
├───────────────────────────────┴─────────────────────────────┤
│ Grand panel graphique                                        │
├─────────────────────────────────────────────────────────────┤
│ Disclaimer pédagogique                                       │
└─────────────────────────────────────────────────────────────┘
```

### Mobile

```txt
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

| Usage | Valeur recommandée |
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

À utiliser :

```css
.page-background {
  background:
    radial-gradient(circle at 20% 0%, rgba(15, 152, 247, 0.12), transparent 32%),
    radial-gradient(circle at 80% 20%, rgba(253, 206, 73, 0.06), transparent 28%),
    #000310;
}
```

Cartes :

```css
.card-glow {
  box-shadow:
    0 18px 60px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255,255,255,0.04);
}
```

À éviter :

- glow trop visible ;
- blur trop fort ;
- ombres blanches ;
- borders trop contrastées ;
- gradients gold sur tout le bouton.

---

## 14. Tailwind config suggérée

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: '#000310',
        'background-soft': '#010518',
        surface: '#0D1121',
        'surface-soft': '#10172D',
        'surface-muted': '#131828',
        sidebar: '#0F1F43',
        gold: '#FDCE49',
        blue: {
          primary: '#0444B3',
          hover: '#0B5ED7',
          dark: '#062869',
        },
        chart: {
          cyan: '#0F98F7',
          orange: '#FF7301',
          blueArea: '#2C5A81',
        },
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
}

export default config
```

---

## 15. Exemple de classes Tailwind pour une card raccord

```tsx
<div className="rounded-lg border border-white/10 bg-surface p-6 shadow-card">
  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-surface-soft text-gold">
    <Icon className="h-5 w-5" />
  </div>

  <h3 className="text-base font-semibold text-slate-50">
    Simulateur crypto
  </h3>

  <p className="mt-2 text-sm leading-6 text-slate-400">
    Simulez une stratégie d’investissement historique en versement unique ou programmé.
  </p>
</div>
```

---

## 16. Exemple de page Next.js cohérente

```tsx
export default function CryptoSimulatorPage() {
  return (
    <main className="min-h-screen bg-background text-slate-50">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <p className="mb-3 text-sm font-medium text-gold">
            Simulateurs S’investir
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Simulateur crypto
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Simulez une stratégie d’investissement historique en cryptomonnaie et comparez
            un versement unique à une approche progressive.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="rounded-xl border border-white/10 bg-surface p-6 shadow-card">
            {/* Formulaire */}
          </section>

          <section className="rounded-xl border border-white/10 bg-surface p-6 shadow-card">
            {/* Résultats + graphique */}
          </section>
        </div>
      </section>
    </main>
  )
}
```

---

## 17. Points de différenciation à montrer dans ton rendu

Pour faire plus sérieux que les autres candidats :

1. Respecter le dark dashboard, les cards navy, les boutons bleus et l’accent gold.
2. Créer un composant `CryptoSimulator` réutilisable, pas une page figée.
3. Prévoir un mode `embed` sobre, sans header complet.
4. Garder les résultats pédagogiques, pas seulement numériques.
5. Ajouter un disclaimer d’investissement clair.
6. Documenter les partis pris dans le README.
7. Éviter toute surenchère graphique crypto.

---

## 18. Checklist visuelle avant livraison

- [ ] Fond principal bleu nuit, pas noir pur visible partout.
- [ ] Cards arrondies avec bordure subtile.
- [ ] Bouton principal bleu, pas gold.
- [ ] Gold réservé aux accents, valeurs ou courbes importantes.
- [ ] Texte principal blanc / texte secondaire gris bleuté.
- [ ] Graphique lisible sur fond sombre.
- [ ] Responsive mobile propre.
- [ ] Focus visible sur inputs.
- [ ] Aucun vert/rouge agressif inutile.
- [ ] README explique que le design reprend les standards S’investir.

---

## 19. Résumé rapide pour Claude Code

```txt
Créer un simulateur crypto Next.js/TypeScript/Tailwind aligné avec le design des simulateurs S’investir : dark dashboard premium, fond #000310, cards #0D1121, bordures white/10, bouton primaire bleu #0444B3, accent gold #FDCE49, typo Inter/Geist, radius 12-20px. Utiliser des cards arrondies, inputs sombres, résultats en KPI cards, graphique sur fond navy avec séries cyan/gold/orange. Prévoir responsive desktop/mobile et un mode embed minimal. Le gold doit rester un accent, pas la couleur dominante du CTA.
```
