/**
 * Tailwind sert ici de couche d'utilitaires (layout, espacements, responsive)
 * par-dessus le design system Sass : les couleurs/polices déclarées ci-dessous
 * DOIVENT rester synchronisées avec assets/sass/_variables.scss — c'est ce
 * fichier qui rend `bg-dark`, `text-accent`, etc. utilisables côté markup, et
 * _variables.scss qui les rend utilisables dans les partials SCSS.
 *
 * Résolu APRÈS la compilation Sass (voir package.json, build:css), donc
 * `content` doit scanner les PHP et le JS source — pas la CSS compilée.
 */

// ⚠ Miroir de la palette de assets/sass/_variables.scss — à mettre à jour
// ensemble. Noms de marque et alias sémantiques pointent vers les mêmes
// valeurs : `bg-noir` et `bg-dark` sont équivalents côté markup — préférer le
// rôle sémantique pour tout ce qui est réutilisable.
const jaune = '#C6A75E';
const beige = '#F4EDE4';
const gris = '#A89B95';
const texte = '#D8CFC4';
const rouge = '#8C2D34';
const noir = '#170909';
const depth1 = '#2A0F12';
const depth2 = '#3A1F1A';

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
        // Noms de marque
        jaune,
        beige,
        gris,
        texte,
        rouge,
        noir,
        'depth-1': depth1,
        'depth-2': depth2,
        // Alias sémantiques (voir _variables.scss)
        dark: noir,
        surface: depth1,
        'surface-alt': depth2,
        cream: beige,
        accent: jaune,
        muted: gris,
        'on-dark': texte,
      },
      fontFamily: {
        // Polices variables (voir les @font-face dans assets/sass/style.scss).
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        // Interlettrage large des petits labels en capitales (nav mobile,
        // slogan, surtitres de section).
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
