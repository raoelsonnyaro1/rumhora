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

Déclarée dans `assets/sass/_variables.scss` **et** `tailwind.config.js` — les
deux doivent rester synchronisés.

## Personnalisation initiale

Palette, polices (Montserrat + Playfair Display) et logos sont déjà ceux du
projet. Restent à renseigner côté admin : les Options du Thème (adresse,
téléphone, réseaux sociaux, lien de réservation) et les contenus ACF de chaque
page. Voir la fin de [CLAUDE.md](CLAUDE.md) pour les éléments encore
provisoires (favicon notamment).

## Licence

GPL-2.0-or-later. Underscores, (C) 2012-2020 Automattic, Inc.
