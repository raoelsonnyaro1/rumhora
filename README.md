# Rumhora — thème WordPress

Thème sur mesure pour le site Rumhora. ACF Pro, GSAP, Sass + Tailwind,
Barba.js. Dérivé du starter [Underscores](https://underscores.me/).

## Installation

```bash
cd wp-content/themes/rumhora
npm install
composer install   # optionnel : outils de lint PHP
npm run build      # génère dist/styles.css et dist/main.js
```

Puis activer le thème dans WordPress (Apparence > Thèmes).

> `dist/` doit exister et contenir `styles.css` + `main.js` pour que le site
> s'affiche correctement. `functions.php` ne les enqueue que s'ils sont
> présents, donc un thème activé sans build s'affiche sans style plutôt que de
> provoquer une erreur PHP.

## Développement

```bash
npm run dev     # watch Sass + Tailwind + esbuild
```

| Commande | Rôle |
|---|---|
| `npm run build` | build complet (CSS + JS) |
| `npm run build:css` | Sass → `dist/temp.css` → Tailwind → `dist/styles.css` |
| `npm run build:js` | esbuild `src/js/main.js` → `dist/main.js` |
| `npm run icons` | police d'icônes depuis `img/icon/*.svg` |
| `composer lint:php` | erreurs de syntaxe PHP |
| `composer lint:wpcs` | WordPress Coding Standards |
| `composer make-pot` | `languages/rumhora.pot` |

## Extensions requises

| Extension | Rôle | Obligatoire |
|---|---|---|
| **ACF Pro** | tous les contenus éditables, page d'options | oui |
| Polylang Pro (ou WPML) | bilingue FR/EN | oui (phase 4) |
| Complianz (ou Axeptio) | consentement cookies, gating du widget OpenTable | oui avant mise en ligne |
| WebP Converter for Media | conversion WebP automatique (`rs_get_webp_url()`) | recommandé |
| Rank Math (ou Yoast) | SEO, données structurées `Restaurant` / `Menu` | recommandé |

Le thème ne dépend d'aucune de ces extensions pour **fonctionner** : sans ACF
les composants retombent sur leurs valeurs par défaut, sans plugin multilingue
le sélecteur de langue ne s'affiche simplement pas.

## Architecture

```
acf-json/            groupes de champs ACF (versionnés, auto-synchronisés)
assets/
  fonts/             .woff2 des polices de marque
  sass/              sources Sass — _variables.scss + style.scss + components/
dist/                assets compilés, VERSIONNÉS (la prod ne build pas)
img/                 logos, favicon, img/icon/ = sources de la police d'icônes
inc/
  components/        composants réutilisables rs_*
  components/form/   composants de formulaire
js/                  scripts WordPress hors bundle (navigation, customizer)
src/js/              sources JavaScript — point d'entrée main.js
template-parts/      partials WordPress standards
```

## Composants disponibles

| Fonction | Rôle |
|---|---|
| `rs_hero()` | hero plein écran, séquence d'entrée animée |
| `rs_galerie()` | slider Swiper (vignettes desktop, flèches mobile) |
| `rs_carousel()` | carrousel d'images légendées |
| `rs_video()` | vidéo (fichier ou YouTube) lue à l'entrée dans le viewport |
| `rs_faq()` | accordéon |
| `rs_contact_cta()` | photo + titre en overlay, texte, bouton |
| `rs_social_icons()` | icônes réseaux sociaux (3 variantes) |
| `rs_mobile_menu()` | overlay du menu plein écran |
| `rs_form_field()` | champ de formulaire à libellé flottant |

Chacun documente ses arguments dans son en-tête de fichier.
`page-exemple.php` les assemble à titre de démonstration.

## Palette

| Token | Hex | Rôle |
|---|---|---|
| `$rouge` / `dark` | `#8C2D34` | fond sombre dominant |
| `$beige` / `cream` | `#F4EDE4` | fond clair dominant |
| `$jaune` / `accent` | `#C6A75E` | accent chaud, CTA |
| `$texte` / `on-dark` | `#D8CFC4` | texte sur fond sombre |
| `$gris` / `muted` | `#A89B95` | texte secondaire, bordures |

Déclarée dans `assets/sass/_variables.scss` **et** `tailwind.config.js` — les
deux doivent rester synchronisés.

## Personnalisation initiale

Les placeholders restants sont listés en fin de [CLAUDE.md](CLAUDE.md) :
polices (`assets/fonts/` + bloc `@font-face` dans `style.scss`), logos
(`img/*.svg`), échelles typographiques, et les Options du Thème côté admin.

## Licence

GPL-2.0-or-later. Underscores, (C) 2012-2020 Automattic, Inc.
