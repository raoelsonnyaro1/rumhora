const { spawn } = require('child_process');
const path = require('path');

// Lance sass en mode watch
const sass = spawn('sass', [
  'assets/sass/style.scss',
  'dist/temp.css',
  '--no-source-map',
  '--watch'
], { shell: true });

// Lance tailwindcss en mode watch après un court délai
setTimeout(() => {
  const tailwind = spawn('npx', [
    'tailwindcss',
    '-i', 'dist/temp.css',
    '-o', 'dist/styles.css',
    '--watch'
  ], { shell: true });

  tailwind.stdout.on('data', (data) => {
    console.log(`[Tailwind] ${data}`);
  });

  tailwind.stderr.on('data', (data) => {
    console.error(`[Tailwind] ${data}`);
  });
}, 1000);

// Lance esbuild en mode watch pour le JS
setTimeout(() => {
  const esbuild = spawn('npx', [
    'esbuild',
    'src/js/main.js',
    '--bundle',
    '--outfile=dist/main.js',
    '--format=iife',
    '--target=es2017',
    '--watch'
  ], { shell: true });

  esbuild.stdout.on('data', (data) => {
    console.log(`[ESBuild] ${data}`);
  });

  esbuild.stderr.on('data', (data) => {
    console.error(`[ESBuild] ${data}`);
  });
}, 1500);

sass.stdout.on('data', (data) => {
  console.log(`[Sass] ${data}`);
});

sass.stderr.on('data', (data) => {
  console.error(`[Sass] ${data}`);
});

console.log('Watching SCSS, PHP and JS files for changes...');
console.log('Press Ctrl+C to stop');
