# Polices

Déposer ici les fichiers `.woff2` des polices de marque, un sous-dossier par
famille :

```
assets/fonts/
  RumhoraSans/
    RumhoraSans-Regular.woff2
    RumhoraSans-Medium.woff2
  RumhoraSerif/
    RumhoraSerif-Regular.woff2
```

Puis décommenter et compléter le bloc `@font-face` en haut de
`assets/sass/style.scss`. Les chemins y sont relatifs à `dist/styles.css`
(la CSS compilée vit dans `dist/`), d'où le préfixe `../assets/fonts/`.

Les noms de familles déclarés doivent correspondre à ceux utilisés dans
`assets/sass/style.scss` **et** dans `tailwind.config.js`
(`theme.extend.fontFamily`) — les deux doivent rester synchronisés.

`.woff2` seul suffit : tous les navigateurs encore supportés le lisent, et
ajouter `.woff`/`.ttf` double le poids téléchargé pour rien.
