# Icônes

Déposer ici les `.svg` à compiler dans la police d'icônes, puis lancer :

```bash
npm run icons
```

La tâche gulp (voir `gulpfile.js`) génère `fonts/icons/` et réécrit
`assets/sass/components/_icons.scss`. Chaque fichier donne une classe
`.icon-<nom-du-fichier>` : `cocktail.svg` → `.icon-cocktail`, à utiliser avec
`.icon` :

```html
<span class="icon icon-cocktail" aria-hidden="true"></span>
```

Contraintes sur les SVG : tracé unique (`<path>`), monochrome, pas de
`stroke` (gulp-iconfont ne convertit que les surfaces remplies — un contour
non aplati disparaît du glyphe). Les icônes à traits fins rendent plus légères
que leur aperçu SVG, d'où le `-webkit-text-stroke` appliqué sur `.icon` dans
`style.scss` si besoin.

Les SVG utilisés directement en markup (`img/icon/mail.svg`,
`whatsapp.svg`, référencés par `footer.php`) ne passent pas par cette police :
ils sont servis tels quels.
