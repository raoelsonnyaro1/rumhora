# CLAUDE.md

Guidance pour Claude Code (claude.ai/code) quand il travaille sur ce dépôt.

## Le projet

Thème WordPress sur mesure pour **Rumhora** (restaurant / bar à rhum), dérivé
du starter Underscores (_s) et de l'architecture du thème `htr`. Site bilingue
FR/EN, réservation via widget OpenTable.

Pages prioritaires : Accueil, Menus, Privatisations, Contact, Book a table.
Phase 2 prévue : Story, Gallery, Events. Le planning détaillé (périmètre,
dépendances client, risques) vit dans `_planning-rhumora.md`, à la racine de
l'installation WordPress — pas dans le thème.

## Stack

- **CSS** : Sass/SCSS (design system maison) **puis** Tailwind en couche
  d'utilitaires. L'ordre compte, voir « Chaîne de build » plus bas.
- **JavaScript** : ES6+ bundlé par esbuild. GSAP (+ ScrollTrigger, SplitText)
  pour les animations, Barba.js pour les transitions de page, Lenis pour le
  smooth scroll, Swiper pour les sliders.
- **Contenus** : ACF Pro, champs versionnés en JSON dans `acf-json/`.
- **Librairies externes** : chargées par CDN (GSAP, Barba, Swiper, Flatpickr,
  lazysizes), enqueuées dans le bon ordre par `rumhora_enqueue_scripts()`.
  Seul Lenis est bundlé depuis npm.

## Commandes

### Build
- `npm install` — à faire en premier
- `npm run build` — compile CSS + JS pour la production
- `npm run dev` / `npm run watch` — watch sur Sass, Tailwind et esbuild
- `npm run build:css` — Sass → `dist/temp.css` → Tailwind → `dist/styles.css`
- `npm run build:js` — esbuild `src/js/main.js` → `dist/main.js`
- `npm run icons` — regénère la police d'icônes depuis `img/icon/*.svg`

### PHP
- `composer install` — dépendances de dev (obligatoire avant les lint)
- `composer lint:php` — erreurs de syntaxe
- `composer lint:wpcs` — WordPress Coding Standards
- `composer make-pot` — génère `languages/rumhora.pot`

## Chaîne de build CSS — à savoir avant d'écrire du CSS

`assets/sass/style.scss` est compilé par Sass, **puis** le résultat passe dans
la CLI Tailwind qui résout les `@tailwind`. Tailwind place toutes ses
utilitaires — surtout les variantes responsives `md:` / `lg:` — **à la toute
fin** du CSS produit.

Conséquence : une règle écrite dans `assets/sass/` qui doit l'emporter sur un
utilitaire Tailwind de même spécificité a besoin d'un `!important` (voir les
overrides `100svh` en bas de `style.scss`). Ce n'est pas une négligence, c'est
une contrainte de l'ordre de compilation.

Les couleurs sont déclarées **deux fois**, et doivent rester synchronisées :
- `assets/sass/_variables.scss` — pour les partials SCSS
- `tailwind.config.js` (`theme.extend.colors`) — pour les classes du markup

## Palette

| Token | Hex | Rôle |
|---|---|---|
| `$base` / `page` | `#140506` | fond de page |
| `$depth-1` / `depth-1` | `#2A0F12` | surfaces posées sur le fond (cartes, sections) |
| `$depth-2` / `depth-2` | `#3A1F1A` | variante plus claire |
| `$light` / `light` | `#F5EFE6` | surface claire (blocs inversés) |
| `$heading` / `heading` | `#F4EDE4` | titres |
| `$body-text` / `body-text` | `#D8CFC4` | texte courant |
| `$secondary` / `secondary` | `#A89B95` | texte secondaire |
| `$neutral` / `neutral` | `#8A7F7A` | mentions discrètes, séparateurs |
| `$gold` / `gold` | `#C6A75E` | filets, CTA, mot mis en avant |
| `$accent` / `accent` | `#B11827` | rouge vif, signaux forts |
| `$soft-accent` / `soft-accent` | `#8C2D34` | rouge sourd (fougère du logo) |

**`#D6AF2E` (« Gold — don't use ») est écarté par le design** : volontairement
absent de `_variables.scss` et de `tailwind.config.js`, et le commentaire qui
l'explique est en `//` (non émis par Sass). `grep -i d6af2e dist/styles.css`
doit donc toujours rendre 0 — toute occurrence signale un vrai usage.

Alias sémantiques disponibles en plus : `dark`, `surface`, `surface-alt`,
`on-dark`, `muted`.

Seule entorse aux noms du design : « Base » est exposé en Tailwind sous `page`
et non `base`. Tailwind génère `text-*` depuis `fontSize` ET `textColor` ; une
couleur `base` produirait un second `.text-base` qui ajouterait `color:#140506`
à tous les usages de `text-base` comme **taille** de police.

## Typographie

| Usage | Police | Taille |
|---|---|---|
| Titres `h1` / `h2` | Playfair Display Regular | `clamp(40px, 5vw, 128px)` |
| Sous-titres `h3` | Playfair Display Regular | `clamp(22px, 2.6vw, 38px)` |
| Texte courant `p` | Montserrat **Light (300)** | `clamp(15px, 1.15vw, 29.33px)` |
| Navigation, boutons | Playfair Display Regular | 15–17px |
| Surtitres (`.eyebrow`) | Montserrat 500 | 12px, `letter-spacing: 0.2em` |
| Métadonnées de carte | Montserrat 500/600 | 12–18px |

### ⚠ La maquette Adobe XD est en POINTS, pas en pixels

XD affiche ses valeurs en **pt**. Conversion : `px = pt × 4/3`. Ça ne concerne
pas que la typographie — toutes les cotes relevées sur la maquette y passent.

| Lu dans XD | À écrire en CSS | Où |
|---|---|---|
| Titres 96 pt | **128 px** | `h1, h2` (style.scss) |
| Descriptions 22 pt | **29.33 px** | `p` (style.scss) |
| Marges de section 125 pt | **166.67 px** | `$pad-desktop` (_text-media.scss) |

Exception : `$radius-media` (arrondi des cadres photo) vaut **25px**, valeur
arrêtée directement à l'écran et non relevée dans XD — elle n'est pas à
convertir.

## Gouttières latérales

Relevées sur la maquette : **10.8 % de la largeur**. Déclarées une seule fois,
en variable CSS `--gutter` (style.scss), et appliquées via la classe
`.gutter-x` :

| Largeur | `--gutter` |
|---|---|
| < 768px | `1.25rem` (20px) |
| 768–1023px | `2rem` (32px) |
| ≥ 1024px | `10.8vw` |

Sous `lg` la composition s'empile et 10.8 % d'un téléphone (42px à 390) mangerait
l'écran : les valeurs mobiles d'origine sont conservées. Le saut à 1024 coïncide
avec le passage de la pile à la grille superposée.

**Ne pas remettre `xl:px-14 md:px-8 px-5` dans le markup d'une section** — c'est
ce que `.gutter-x` remplace, et un utilitaire Tailwind émis après le SCSS la
contredirait.

Les composants qui doivent **calculer** à partir de la gouttière lisent
`var(--gutter)` : débord des photos du hero (`calc((var(--gutter) + 2rem) * -1)`)
et marge gauche du carrousel d'événements, qui file jusqu'au bord droit.

Header et footer gardent volontairement une gouttière plus serrée : sur la
maquette, le logo est calé bien plus près du bord que le texte des sections.

Les gabarits hérités du starter (`index.php`, `page.php`, `single.php`,
`archive.php`, `search.php`, `404.php`, `rs_carousel`, `rs_faq`, `rs_galerie`,
`rs_hero`) utilisent encore `md:px-5 px-[10px]` : ils ne font pas partie des
sections validées sur maquette.

Ne jamais reporter tel quel un nombre lu dans XD — c'est l'erreur qui a figé
l'échelle un tiers trop bas pendant plusieurs sections.

`$radius-media` ne vaut que pour les **cadres photo et les cartes**. Les boutons
gardent leur `999px` (pilules et cercles), les champs de formulaire leurs 3-4px,
et l'indicateur de scroll ses 12px : ce sont d'autres familles de formes.

**Le plan de travail de la maquette fait ~2560px de large**, d'où les `5vw`
(128 / 2560) et `1.15vw` (29.33 / 2560) au milieu des clamps. Largeur déduite
en mesurant la maquette : « A Timeless Culinary » vaut 9.004 em en Playfair
Display Regular et occupe ~507px sur l'export 1193px, soit une police de
56.3px, soit 4.7vw — cohérent avec 5vw, et les deux clamps tombent sur la même
largeur de plan de travail indépendamment l'un de l'autre.

Mesuré sur le rendu, sans débordement horizontal à aucune largeur :

| Largeur | Titres | Texte |
|---|---|---|
| 768px | 40px | 15px |
| 1024px | 51px | 15px |
| 1440px | 72px | 16.5px |
| 1920px | 96px | 22px |
| 2560px | **128px** | **29.33px** |

Conséquence à connaître : les plafonds ne sont atteints qu'à 2560px, la largeur
du plan de travail. En dessous, le corps rendu est le même qu'avant la
conversion — ce n'est pas une régression, c'est le propre d'une échelle fluide
calée sur les *proportions* de la maquette plutôt que sur ses valeurs absolues.

Les deux échelles sont déclarées **une seule fois**, sur `h1, h2` et sur `p`
dans `style.scss`. Les titres et descriptions de section (`.hero-title`,
`.hero-lead`, `.text-media__text`…) sont des `h1`/`h2`/`p` et en héritent :
**ne pas y redéfinir `font-size`, `font-weight` ni `line-height`**, et ne pas
y ajouter de surcharge mobile — le plancher du clamp s'en charge. Avant cette
centralisation, les cinq sections avaient chacune leurs valeurs, qui
divergeaient sans raison.

Les libellés courts (`.eyebrow`, `.event-card__date`, `.footer-tagline`…)
gardent, eux, taille et graisse posées explicitement : ils ne suivent pas
l'échelle du texte courant.

## Structure

### Fichiers WordPress
- `functions.php` — setup, enqueue, helpers WebP, walker du menu mobile
- `header.php` / `footer.php` — vivent **en dehors** du container Barba, donc
  persistants entre les pages (voir « Barba » plus bas)
- `inc/` — modules de fonctionnalité
- `inc/components/` — composants réutilisables `rs_*`
- `template-parts/` — partials WordPress standards
- `acf-json/` — groupes de champs ACF, versionnés avec le thème

### Assets
- `assets/sass/` — sources Sass (`style.scss` + `components/`)
- `src/js/` — sources JavaScript (point d'entrée `main.js`)
- `js/` — scripts WordPress hors bundle (`navigation.js`, `customizer.js`)
- `dist/` — assets compilés servis au front, **versionnés** (le serveur de
  prod ne lance pas de build)
- `img/icon/` — SVG sources de la police d'icônes
- `fonts/icons/` — police d'icônes générée par `npm run icons`

## Composants réutilisables

Tout composant (PHP ou SCSS) doit être réutilisable sur plusieurs pages, pas
lié au contenu d'une page précise.

**PHP** : une fonction par fichier, sous `inc/components/`, nommé
`rs-<nom>.php` et préfixé `rs_` à l'intérieur (ex: `inc/components/rs-faq.php`
→ `rs_faq()`). `inc/components.php` est un simple loader qui `require` tous les
fichiers du dossier (un niveau de sous-dossier, ex: `form/`). Un composant
accepte un tableau `$args` avec des valeurs de repli ACF, jamais du contenu
codé en dur pour une page donnée.

**SCSS** : nommer les classes par ce qu'elles font, pas par la section qui les
a introduites (`.superposed-photos`, pas `.rythmes-photos`). Un partial par
composant dans `assets/sass/components/`, importé dans `style.scss`.

Éviter tout nommage spécifique à une page (`accueil-*`, `menus-*`) pour ce qui
est destiné à être réutilisé.

## Animations — déclenchées par des hooks de classe

`src/js/animations.js` ne contient **aucun sélecteur propre à une page**. Pour
animer quelque chose, on pose une classe dans le markup :

| Hook | Effet |
|---|---|
| `.text-reveal`, `h1`, `h2`, `h3` | « blur-in » : les signes se posent floutés, en ordre aléatoire |
| `.reveal` | image qui glisse du bas + fondu |
| `.line-reveal` | ligne qui se dessine de gauche à droite |
| `.slide-up` | montée de 100px au scroll |
| `.fade-in` / `.gsap-fade-in` | fondu + glissement |
| `.list-reveal` | `<li>` révélés un par un |
| `.text-scrub` | remplissage lettre par lettre au fil du scroll |
| `.scroll-parallax-img` | léger parallax |
| `.hover-zoom`, `.card` | zoom au survol |
| `[data-stagger-group]` + `[data-stagger-item]` | cascade sur une série d'items |

Attributs d'ajustement, reconnus sur la plupart de ces hooks :
`data-reveal-start` (seuil en % du viewport), `data-reveal-delay` (secondes),
`data-reveal-mask="right"`, `data-reveal-companion="#sel"`.

### Révélation de texte

SplitText découpe le texte, puis les fragments passent de
`opacity:0 / y:10 / blur(10px)` à leur état final avec un
`stagger: { each: 0.03, from: 'random' }` : le texte se condense à l'écran au
lieu de s'écrire de gauche à droite.

Deux garde-fous, à ne pas retirer sans mesurer :

- **Au-delà de 120 signes, le découpage se fait par MOTS et non par
  caractères** (`SPLIT_BY_CHARS_MAX`). Un paragraphe de 240 signes passe ainsi
  de ~240 à ~32 éléments animés, chacun portant un `filter: blur()` — donc sa
  propre couche de composition. Mesuré : 19 signes → 20 nœuds, 241 → 32.
- **`prefers-reduced-motion: reduce` court-circuite tout** : ni split ni
  animation, le texte s'affiche directement.

Le `will-change` est posé au départ et retiré par le `clearProps` de fin de
tween — un will-change permanent sur des centaines de fragments garderait
autant de couches en mémoire pour toute la vie de la page.

`aria: 'auto'` repose un `aria-label` sur l'élément d'origine et masque les
fragments : sans lui, un titre découpé est épelé lettre par lettre.

**Ajouter une animation** = ajouter une fonction `init*` et l'inscrire dans le
tableau `ANIMATION_INITS`. Chaque init est isolée dans un `try/catch` : en cas
d'erreur, elle doit **forcer la visibilité** de ses cibles plutôt que de les
laisser bloquées à `opacity:0` — c'est la règle la plus importante du fichier,
puisque tous les éléments animés partent cachés.

## Barba.js — ce qui persiste, ce qui est rejoué

Le `<header>` et le `<footer>` sont **hors** du container Barba : ils ne sont
jamais réécrits par la transition AJAX. Tout ce qui y dépend de la langue ou
de la page courante doit être resynchronisé explicitement par
`updatePersistentLayoutLinks()` / `updateLangToggle()` dans `src/js/barba.js`.

Tout composant JS dont le DOM vit **dans** le container doit être réinitialisé
dans le hook `after()` de la transition — sinon il cesse de fonctionner après
la première navigation.

Un `<script>` inline inséré via le HTML d'un container Barba **ne s'exécute
jamais** (le navigateur n'exécute pas les `<script>` posés via `innerHTML`).
Toute logique de page doit donc vivre dans `src/js/`, pas dans un template.

## Git

- Ne pas ajouter de ligne `Co-Authored-By: Claude` (ou similaire) aux messages
  de commit.
- Dépôt : https://github.com/raoelsonnyaro1/rumhora.git

## À faire avant de démarrer l'intégration

Palette, polices et logos sont ceux du projet. Restent provisoires :

- `img/favicon.svg` — placeholder, à exporter depuis le logo
- `page-exemple.php` — template de démonstration, à supprimer une fois les
  vraies pages écrites
- Options du Thème (ACF) — adresse, téléphone, réseaux, `rid` OpenTable, lien
  « Book Table »

Les exports bruts de la maquette (`assets/elements/`, TTF Google Fonts) sont
sur le disque mais exclus du dépôt : ~90 Mo dont rien n'est servi tel quel.
Ce qui est réellement servi vit dans `img/` (WebP) et `assets/fonts/` (woff2).

## Vérifier un rendu sans navigateur

Le site Local tourne derrière le vhost `rhumora.local`, qui ne résout pas
toujours depuis un shell. Chrome en headless sait contourner ça :

```bash
chrome --headless=new --disable-gpu --hide-scrollbars   --window-size=1440,900 --screenshot=out.png   --host-resolver-rules="MAP rhumora.local 127.0.0.1"   --virtual-time-budget=9000 "http://rhumora.local/"
```

⚠ `--window-size` en dessous de **500 px CSS est ignoré** : Chrome rend à 500
et *recadre* l'image à la largeur demandée. Une capture « 390px » montre donc
un faux débordement à droite. Pour vérifier une vraie largeur mobile, mesurer
le DOM (`getBoundingClientRect`, `scrollWidth`) depuis une page de test servie
**depuis le thème** — donc même origine — plutôt que se fier aux pixels.
