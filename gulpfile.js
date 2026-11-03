const gulp = require('gulp');
const iconfont = require('gulp-iconfont');
const iconfontCss = require('gulp-iconfont-css');

const fontName = 'icons';
const runTimestamp = Math.round(Date.now() / 1000);

/**
 * Génère la police d'icônes à partir de tous les SVG présents dans img/icon/.
 * Pour ajouter une icône : déposer le .svg dans img/icon/, puis relancer cette tâche.
 * Classe générée : .icon-<nom-du-fichier> (ex: tyrolienne.svg -> .icon-tyrolienne)
 */
function buildIconFont() {
  return gulp.src(['img/icon/*.svg'])
    .pipe(iconfontCss({
      fontName: fontName,
      cssClass: 'icon',
      targetPath: '../../assets/sass/components/_icons.scss',
      fontPath: '../fonts/icons/',
      // Sans ça, le nom de fichier de la police ne change jamais d'une
      // compilation à l'autre : le navigateur garde l'ancienne police en
      // cache indéfiniment et ignore les icônes modifiées/ajoutées tant que
      // le cache n'expire pas (vu en prod : icônes manquantes -> carrés de
      // substitution malgré une police fraîchement recompilée sur le serveur).
      cacheBuster: String(runTimestamp),
    }))
    .pipe(iconfont({
      fontName: fontName,
      formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
      normalize: true,
      fontHeight: 1001,
      timestamp: runTimestamp,
    }))
    .pipe(gulp.dest('fonts/icons'));
}

function watchIconFont() {
  gulp.watch('img/icon/*.svg', buildIconFont);
}

exports.iconfont = buildIconFont;
exports.watch = watchIconFont;
exports.default = buildIconFont;
