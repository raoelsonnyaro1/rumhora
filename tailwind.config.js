/**
 * Tailwind sert ici de couche d'utilitaires (layout, espacements, responsive)
 * par-dessus le design system Sass : les couleurs/polices déclarées ci-dessous
 * DOIVENT rester synchronisées avec assets/sass/_variables.scss — c'est ce
 * fichier qui rend `bg-base`, `text-gold`, etc. utilisables côté markup, et
 * _variables.scss qui les rend utilisables dans les partials SCSS.
 *
 * Résolu APRÈS la compilation Sass (voir package.json, build:css), donc
 * `content` doit scanner les PHP et le JS source — pas la CSS compilée.
 */

// ⚠ Miroir de la palette de assets/sass/_variables.scss — à mettre à jour
// ensemble. Les noms sont ceux de la bibliothèque de couleurs de la maquette.
//
// « Gold (don't use) » (#D6AF2E) est volontairement absent : le design l'a
// écarté, et une entrée ici finirait par être utilisée.
//
// Seule exception aux noms du design : « Base » est exposé en `page` et non en
// `base`. Tailwind génère `text-*` à la fois depuis fontSize et textColor ;
// une couleur nommée `base` produirait un second `.text-base` qui ajouterait
// `color: #140506` à toutes les utilisations de `text-base` comme TAILLE de
// police — du texte quasi noir sur fond sombre. Le nom `$base` reste en
// revanche celui du SCSS, où aucune collision n'est possible.
const colors = {
  // Fonds
  page: '#140506',
  'depth-1': '#2A0F12',
  'depth-2': '#3A1F1A',
  light: '#F5EFE6',
  // Textes
  heading: '#F4EDE4',
  'body-text': '#D8CFC4',
  secondary: '#A89B95',
  neutral: '#8A7F7A',
  // Accents
  gold: '#C6A75E',
  accent: '#B11827',
  'soft-accent': '#8C2D34',
};

module.exports = {
  content: [
    './**/*.php',
    './src/js/**/*.js',
    // node_modules/, vendor/ et dist/ exclus : dist/styles.css contient déjà
    // des noms de classes générés, les rescanner ferait gonfler le build à
    // chaque passe (classes conservées parce qu'elles sont présentes dans la
    // sortie précédente, jamais purgées).
    '!./node_modules/**',
    '!./vendor/**',
    '!./dist/**',
  ],
  theme: {
    extend: {
      screens: {
        'h-tall': { raw: '(min-height: 820px)' },
      },
      colors: {
        ...colors,
        // Alias sémantiques, pour les cas où le rôle est plus parlant que la
        // teinte (voir _variables.scss).
        dark: colors.page,
        surface: colors['depth-1'],
        'surface-alt': colors['depth-2'],
        'on-dark': colors['body-text'],
        muted: colors.secondary,
      },
      fontFamily: {
        // Polices variables (voir les @font-face dans assets/sass/style.scss).
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        // Interlettrage large des petits labels en capitales (surtitres de
        // section, slogan).
        wider: '0.12em',
        widest: '0.2em',
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.1)',
        medium: '0 8px 30px rgba(0, 0, 0, 0.15)',
        // Ombre portée des photos superposées du hero : très diffuse et très
        // sombre, pour les détacher du fond presque noir sans halo visible.
        hero: '0 30px 80px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
};
