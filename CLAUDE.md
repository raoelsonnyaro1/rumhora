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
| `$rouge` / `dark` | `#8C2D34` | fond sombre dominant (header, footer, overlays) |
| `$beige` / `cream` | `#F4EDE4` | fond clair dominant |
| `$jaune` / `accent` | `#C6A75E` | accent chaud, CTA, détails |
| `$texte` / `on-dark` | `#D8CFC4` | texte et éléments posés **sur** un fond sombre |
| `$gris` / `muted` | `#A89B95` | texte secondaire, bordures discrètes |

Les deux jeux de noms pointent vers les mêmes valeurs : `bg-rouge` et `bg-dark`
sont équivalents côté markup. **Préférer le rôle sémantique** (`dark`, `cream`,
`accent`) pour tout ce qui est réutilisable — le nom de marque ne se justifie
que lorsqu'une teinte précise est voulue pour elle-même.

Pour du texte sur fond sombre, `text-on-dark` (`#D8CFC4`) est plus juste que
`text-cream` (`#F4EDE4`, un blanc plus franc) — le footer et le hero utilisent
encore `text-cream`, à arbitrer sur la maquette.

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
| `.text-reveal`, `h1`, `h2`, `h3` | révélation ligne par ligne (SplitText) |
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

Le thème est livré en starter : plusieurs éléments sont des **placeholders**
explicitement marqués, à remplacer avec les assets de la maquette XD. La
palette, elle, est déjà celle du projet (voir le tableau plus haut).

- `assets/sass/style.scss` — `@font-face` (bloc commenté) et échelles typo
- `assets/fonts/` — déposer les `.woff2`
- `img/logo*.svg`, `img/favicon.svg` — logos
- Options du Thème (ACF) — adresse, téléphone, réseaux, `rid` OpenTable
- `page-exemple.php` — template de démo, à dupliquer puis supprimer
