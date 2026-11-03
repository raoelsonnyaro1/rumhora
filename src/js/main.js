/**
 * Point d'entrée JS du thème Rumhora.
 * Compilé par esbuild vers dist/main.js (voir package.json).
 *
 * GSAP, ScrollTrigger, SplitText, Barba, Swiper et Flatpickr sont chargés par
 * CDN (voir rumhora_enqueue_scripts() dans functions.php) et lus depuis
 * `window` — ils ne sont pas bundlés ici. Seul Lenis est une vraie dépendance
 * npm.
 */

import { initLenis, initScrollToTop, getLenis } from './lenis.js';
import { initAnimations, initPageEntryAnimation } from './animations.js';
import { initBarba, handleInitialAnchor, handlePageLoadTransition, handlePageReload, initPageLoadCurtainReveal } from './barba.js';
import { initHeaderScroll } from './header.js';
import {
  addBarbaToLinks,
  updateCurrentMenuItem,
  configureScrollRestoration,
  forceScrollToTop,
  initNumericFieldSanitization,
  initFooterMenuSamePageScroll,
} from './utils.js';
import { initScrollVideo } from './components/scroll-video.js';
import { initCustomSelects } from './components/custom-select.js';
import { initDatePickers } from './components/date-picker.js';
import { initRsScroll } from './components/rs-scroll.js';
import { initNewsletterFormAjax } from './forms/newsletter-form.js';

// Exposé globalement pour être appelable depuis un callback AJAX ou un script
// inline qui a besoin de relancer la page avec le curseur d'attente.
window.handlePageReload = handlePageReload;

const { gsap, ScrollTrigger } = window;

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);

  // Sur mobile, l'apparition/disparition de la barre d'adresse redimensionne le
  // viewport PENDANT le scroll — sans ça, ScrollTrigger traite chacun de ces
  // micro-changements de hauteur comme un vrai resize et relance un refresh()
  // complet (remesure de tous les triggers, y compris les sections pinnées),
  // ce qui peut saccader/faire sauter le scroll en plein milieu d'un pin.
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/**
 * ScrollTrigger.refresh() remesure toutes les positions de trigger, ce qui
 * peut déplacer momentanément le scroll (ex: pins) pour recalculer. S'il
 * s'exécute PENDANT qu'un scroll Lenis est en cours, ça peut désynchroniser la
 * position que Lenis pense avoir et faire "revenir" le scroll en haut au
 * prochain tick. On attend donc que Lenis ne scrolle plus avant d'appeler
 * refresh(), avec un filet de sécurité pour ne pas attendre indéfiniment si
 * isScrolling reste vrai en continu.
 */
function refreshScrollTriggerWhenIdle() {
  const lenis = getLenis();
  if (!lenis || !lenis.isScrolling) {
    ScrollTrigger.refresh();
    return;
  }

  let attempts = 0;
  const maxAttempts = 20; // ~1s à 50ms d'intervalle
  const poll = setInterval(() => {
    attempts += 1;
    if (!lenis.isScrolling || attempts >= maxAttempts) {
      clearInterval(poll);
      ScrollTrigger.refresh();
    }
  }, 50);
}

// Filet de sécurité global : lazysizes charge les images hors-écran seulement
// quand elles approchent du viewport, bien après les refresh() faits juste
// après une transition Barba (waitForAllImages() dans barba.js n'écoute que
// l'évènement natif 'load', jamais 'lazyloaded'). Une image qui charge pendant
// que l'utilisateur scrolle près d'elle peut changer la hauteur de sa section
// et décaler les ScrollTrigger de tout ce qui suit, faisant sembler leurs
// reveals "en avance". On réécoute donc 'lazyloaded' globalement et on
// rafraîchit (debounce : un seul évènement déclenche souvent plusieurs images).
if (typeof ScrollTrigger !== 'undefined') {
  let lazyRefreshTimeout;
  document.addEventListener('lazyloaded', () => {
    clearTimeout(lazyRefreshTimeout);
    lazyRefreshTimeout = setTimeout(() => refreshScrollTriggerWhenIdle(), 150);
  });
}

configureScrollRestoration();
forceScrollToTop();

// Filet de sécurité : sur un vrai rechargement (F5), le navigateur peut tenter
// sa propre restauration de scroll à un moment qu'on ne maîtrise pas
// complètement (parfois après DOMContentLoaded, si des images/polices font
// encore bouger la mise en page) malgré scrollRestoration:'manual'. On
// réaffirme donc le retour en haut après le chargement complet, sauf s'il y a
// une ancre dans l'URL.
window.addEventListener('load', () => {
  if (!window.location.hash) {
    forceScrollToTop();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  handlePageLoadTransition();

  // Rideau au tout premier chargement (voir style.scss / barba.js) : appelé
  // AVANT initBarba(), qui ne touche plus au masque à l'init pour ne pas
  // court-circuiter ce reveal pendant qu'il attend le hero. La promesse
  // retournée (résolue 1s avant la fin réelle du rideau) est transmise à
  // initAnimations() pour les pages sans hero qui veulent démarrer leur fondu
  // de texte avec une seconde d'avance (voir .wait-curtain-text-reveal).
  const curtainPromise = initPageLoadCurtainReveal();

  if (!window.location.hash) {
    forceScrollToTop();
  }

  initPageEntryAnimation();
  initLenis();

  // Scrollbar custom (piste + thumb), voir components/rs-scroll.js
  initRsScroll(getLenis());

  initScrollToTop();

  // Lien du menu footer vers la page actuelle : remonter en haut au lieu de
  // relancer un cycle Barba complet.
  initFooterMenuSamePageScroll();

  initAnimations(curtainPromise);

  // Ajoute data-barba aux liens internes qui n'en ont pas déjà
  addBarbaToLinks();

  // Empêche la saisie de caractères invalides dans les champs number/tel
  // (délégation d'évènements, une seule fois suffit)
  initNumericFieldSanitization();

  initHeaderScroll();
  updateCurrentMenuItem();
  initBarba();
  handleInitialAnchor();

  initScrollVideo();
  initCustomSelects();
  initDatePickers();
  initNewsletterFormAjax();
});

window.addEventListener('load', () => {
  const lenis = getLenis();

  forceScrollToTop();

  if (lenis) {
    lenis.scrollTo(0, { immediate: true });
  }

  // ScrollTrigger désactivé le temps du recalage : un refresh() pendant que la
  // position de scroll est encore en train d'être forcée à 0 peut mesurer des
  // positions de déclenchement sur un état transitoire.
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.getAll().forEach((st) => st.disable());

    setTimeout(() => {
      forceScrollToTop();

      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }

      ScrollTrigger.getAll().forEach((st) => st.enable());
      ScrollTrigger.refresh();
    }, 150);
  }
});
