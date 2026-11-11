/**
 * Animations GSAP / ScrollTrigger du thème.
 *
 * Toutes les animations sont déclenchées par des HOOKS DE CLASSE posés dans le
 * markup (.reveal, .text-reveal, .slide-up, .fade-in, .line-reveal, ...) :
 * aucun sélecteur propre à une page précise ne doit apparaître ici, pour que
 * ce fichier reste valable quelles que soient les pages ajoutées ensuite.
 *
 * GSAP, ScrollTrigger et SplitText viennent du CDN (voir
 * rumhora_enqueue_scripts() dans functions.php), lus depuis `window`.
 */

import { getLenis } from './lenis.js';

const { gsap, ScrollTrigger, SplitText } = window;

/**
 * Comme document.querySelector(selector), mais ignore les éléments cachés.
 * Pendant une transition Barba, l'ancien container reste dans le DOM en
 * display:none (pas encore retiré) le temps que la page suivante s'initialise :
 * un querySelector normal peut donc matcher l'instance de la page PRÉCÉDENTE
 * au lieu de celle de la nouvelle page (offsetParent est null pour un élément
 * display:none ou dans un ancêtre display:none).
 */
function queryVisible(selector) {
  return Array.from(document.querySelectorAll(selector)).find((el) => el.offsetParent !== null) || null;
}

/**
 * Position document (top) d'un élément en ignorant tout transform CSS —
 * contrairement à getBoundingClientRect(), offsetTop/offsetParent restent
 * basés sur la mise en page (box model), jamais affectés par un transform.
 *
 * Nécessaire pour calculer le point de déclenchement d'un ScrollTrigger quand
 * l'élément trigger est AUSSI la cible d'un .from() dont le rendu immédiat
 * (yPercent, scale...) décale déjà sa position au moment du calcul — sinon le
 * seuil de déclenchement se retrouve décalé du même montant.
 * @param {HTMLElement} el
 */
function untransformedDocTop(el) {
  let top = 0;
  let node = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent;
  }
  return top;
}

/**
 * Attend que les images lazysizes passées en paramètre aient fini de charger
 * avant d'exécuter callback() — évite qu'un reveal ne se déclenche sur une
 * image dont le data-src n'a pas encore été swappé en src par lazysizes
 * (cadre vide pendant l'animation). Appelle callback() immédiatement si les
 * images sont déjà chargées.
 * @param {(HTMLImageElement|null|undefined)[]} images
 * @param {() => void} callback
 */
function whenImagesReady(images, callback) {
  const imgs = images.filter(Boolean);
  const isReady = (img) => img.classList.contains('lazyloaded') || (img.complete && img.currentSrc);
  let remaining = imgs.filter((img) => !isReady(img)).length;

  if (remaining === 0) {
    callback();
    return;
  }

  // Filet de sécurité : si lazysizes ne se charge jamais (CDN down) ou qu'une
  // image ne déclenche ni 'lazyloaded' ni 'error', le reveal ne doit pas
  // rester bloqué indéfiniment.
  let finished = false;
  const timeout = setTimeout(() => {
    if (finished) return;
    finished = true;
    callback();
  }, 5000);

  const done = () => {
    remaining -= 1;
    if (remaining <= 0 && !finished) {
      finished = true;
      clearTimeout(timeout);
      callback();
    }
  };

  imgs.forEach((img) => {
    if (isReady(img)) return;
    img.addEventListener('lazyloaded', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

/**
 * Révèle une image en la faisant glisser du bas vers le haut jusqu'à sa
 * position normale : le conteneur (overflow:hidden) masque le débordement
 * pendant le mouvement, donnant l'impression que la photo "monte"
 * progressivement, combiné à un fondu.
 * @param {HTMLImageElement} image
 * @param {gsap.core.Timeline} tl
 * @param {number} duration
 * @param {string|number} [position]
 * @param {{fade?: boolean, fromY?: number}} [opts] - fade:false n'anime que le
 *   glissement, sans opacité ; fromY change le point de départ (défaut 30).
 */
function mediaRevealImage(image, tl, duration, position, opts = {}) {
  const { fade = true, fromY = 30 } = opts;
  gsap.set(image, { willChange: fade ? 'transform, opacity' : 'transform' });

  const fromVars = { yPercent: fromY };
  const toVars = {
    yPercent: 0,
    duration,
    ease: 'power2.out',
    // Signale la fin du reveal (voir initColumnParallax, qui n'active le
    // parallax qu'une fois cet évènement reçu, et initTextRevealAnimations
    // pour un titre en overlay sur la photo).
    onComplete: () => image.dispatchEvent(new Event('revealcomplete')),
  };

  if (fade) {
    // fromTo avec cible d'opacité explicite : un .from() capturerait l'opacité
    // "actuelle" comme cible, or celle-ci peut être surprise en plein milieu de
    // la transition CSS du lazyload (opacity 0→1), donnant une cible proche de
    // 0 au lieu de 1 et bloquant l'image quasi invisible.
    fromVars.opacity = 0;
    toVars.opacity = 1;
  }

  tl.fromTo(image, fromVars, toVars, position);
}

/**
 * Masque à 3 couches (voir .media-reveal-overlay) qui glisse vers la droite
 * pour révéler l'image en dessous, en 3 temps légèrement décalés. Les couches
 * sont injectées comme enfants temporaires du container (retirées du DOM une
 * fois l'animation terminée), qui doit déjà être positionné — c'est le cas de
 * tous les .reveal.
 *
 * Activé par data-reveal-mask="right" sur un .reveal.
 * @param {HTMLElement} container
 * @param {gsap.core.Timeline} tl
 * @param {number} duration
 * @param {string|number} [position]
 */
function layeredMaskRevealRight(container, tl, duration, position) {
  const overlay = document.createElement('div');
  overlay.className = 'media-reveal-overlay';
  overlay.innerHTML = '<div></div><div></div><div></div>';
  container.appendChild(overlay);

  // Empilées (inset:0 sur les 3), donc peintes dans l'ordre du DOM : la 3e est
  // au-dessus, couvrant entièrement les 2 autres au repos. En animant dans
  // l'ordre naturel du DOM, cette couche du dessus ne bougerait qu'EN DERNIER
  // — elle resterait immobile pendant que les 2 couches cachées EN DESSOUS
  // glissent déjà, invisibles : on ne verrait "qu'une seule couche". En
  // inversant l'ordre, chaque couche démasque la suivante l'une après l'autre
  // et le dégradé des 3 teintes devient visible en balayage.
  const layers = Array.from(overlay.querySelectorAll('div')).reverse();

  // Décalages EXPLICITES et différents (0.18s puis 0.4s) plutôt qu'un stagger
  // GSAP à formule (each+ease) : sur seulement 3 éléments, une formule d'ease
  // impose un ratio fixe entre les 2 écarts (1:3 avec power2.in) — le plus
  // petit des deux reste alors trop court pour être perceptible tant que
  // l'écart total ne devient pas exagérément long (2 des 3 couches semblent
  // n'en former qu'une). Des valeurs choisies à la main gardent les 3 couches
  // nettement visibles tout en gardant un rythme non constant.
  const start = typeof position === 'number' ? position : 0;
  const offsets = [0, 0.18, 0.4];
  layers.forEach((layer, i) => {
    tl.to(layer, {
      xPercent: 100,
      duration,
      ease: 'power3.inOut',
      onComplete: i === layers.length - 1 ? () => overlay.remove() : undefined,
    }, start + offsets[i]);
  });
}

/**
 * Exécute fn() en isolant toute exception : une init qui plante (ex: un bug
 * ScrollTrigger sur une section particulière) ne doit jamais empêcher les
 * autres animations, indépendantes, de s'initialiser.
 * @returns {boolean} true si fn() a levé une exception.
 */
function safeInit(fn) {
  try {
    fn();
    return false;
  } catch (error) {
    reportScrollTriggerCorruption(fn.name || 'anonymous', error);
    return true;
  }
}

/**
 * Un bug interne à ScrollTrigger (voir les try/catch isolés par élément dans
 * ce fichier) peut planter la création d'UN trigger sans empêcher les autres,
 * mais laisse parfois son registre interne corrompu au point que des triggers
 * SANS RAPPORT, créés juste après, ne se déclenchent plus jamais au scroll
 * (leur propre création ne lève pourtant aucune exception). Ce drapeau passe à
 * true dès qu'un cas comme celui-ci est détecté, où qu'il soit dans le
 * fichier, pour que createAnimations() puisse déclencher un reset complet même
 * quand la plantée initiale n'a pas remonté jusqu'à son propre appel (ex:
 * initTextRevealAnimations, asynchrone — attend le chargement des polices).
 */
let scrollTriggerCorrupted = false;

function reportScrollTriggerCorruption(context, error) {
  console.error(`Error in ${context}:`, error);
  scrollTriggerCorrupted = true;
}

/* ==========================================================================
   Révélation de texte — « blur-in » par signes, en ordre aléatoire
   ==========================================================================
   Les signes partent flous, décalés vers le bas et transparents, puis se
   posent dans un ORDRE ALÉATOIRE plutôt que de gauche à droite : le texte
   semble se condenser à l'écran au lieu de s'écrire. C'est le parti pris
   demandé pour le site.
*/

// willChange posé ici et retiré par le clearProps de revealSplitTargets : un
// will-change permanent sur des centaines de fragments garderait autant de
// couches de composition en mémoire pour toute la vie de la page, ce que le
// réglage est justement censé éviter.
const REVEAL_FROM = { opacity: 0, y: 10, filter: 'blur(10px)', willChange: 'filter, transform, opacity' };

// Rythme du reveal de texte — SOURCE UNIQUE. Tous les appelants
// (initTextRevealAnimations, initHeroIntro) passent par revealSplitTargets et
// ne surchargent que le délai : ces deux valeurs pilotent donc la vitesse de
// TOUS les textes du site.
//
// C'est le stagger qui fait le gros de la durée ressentie, pas la durée d'un
// fragment : sur un paragraphe découpé en 45 mots, les fragments s'échelonnent
// sur 44 × REVEAL_STAGGER avant que le dernier ne commence seulement à
// s'animer. Baisser l'un sans l'autre ne se verrait quasiment pas.
const REVEAL_DURATION = 0.6; // par fragment

// Deux rythmes, parce que les deux découpages ne produisent pas le même nombre
// de fragments : un titre fait une trentaine de signes, un paragraphe 4 à 8
// lignes. L'écart se règle donc sur ce décompte, pas sur une valeur unique —
// 0.09s appliqué à 30 signes étalerait un titre sur près de 3 secondes, et
// 0.02s appliqué à 5 lignes les ferait arriver ensemble, donc plus aucun
// « ligne par ligne » visible.
const REVEAL_STAGGER_CHARS = 0.02;
const REVEAL_STAGGER_LINES = 0.09;

/**
 * Découpe un élément et renvoie les fragments à animer.
 * @param {HTMLElement} el
 * @returns {{split: SplitText, targets: HTMLElement[]}}
 */
function splitForReveal(el) {
  // Le découpage suit la NATURE de l'élément, pas sa longueur : les titres se
  // révèlent signe à signe, les descriptions ligne à ligne. Un découpage piloté
  // par le nombre de signes faisait basculer un même composant d'un effet à
  // l'autre selon le texte saisi par le client.
  //
  // Le découpage par signes ne vaut QUE pour les titres : c'est un fragment par
  // caractère, chacun portant un `filter: blur()` animé, donc sa propre couche
  // de composition. Sur un paragraphe de 400 signes c'est le genre de chose qui
  // fait tomber un mobile à 15 fps — d'où les lignes pour le texte courant, qui
  // n'en produisent qu'une poignée.
  const isTitle = /^H[1-6]$/.test(el.tagName);

  // aria:'auto' (SplitText ≥ 3.13) repose un aria-label sur l'élément d'origine
  // et masque les fragments aux lecteurs d'écran : sans ça, un titre découpé en
  // signes est épelé lettre par lettre.
  //
  // 'words,chars' et pas 'chars' seul : sans la couche de mots intermédiaire,
  // les signes se répartissent sur les lignes sans tenir compte des limites de
  // mots, et un titre sur deux lignes se coupe n'importe où.
  const split = new SplitText(el, {
    type: isTitle ? 'words,chars' : 'lines',
    aria: 'auto',
  });

  return {
    split,
    targets: isTitle ? split.chars : split.lines,
    // L'ordre aléatoire fait l'effet sur un titre, où les signes sont nombreux.
    // Sur 5 lignes il donnerait un désordre lisible comme un défaut : les
    // lignes se posent donc de haut en bas, dans le sens de la lecture.
    stagger: isTitle
      ? { each: REVEAL_STAGGER_CHARS, from: 'random' }
      : { each: REVEAL_STAGGER_LINES, from: 'start' },
  };
}

/**
 * Anime les fragments d'un split vers leur état final.
 * @param {HTMLElement[]} targets
 * @param {object} [vars] - surcharges (delay, onStart...)
 * @returns {gsap.core.Tween}
 */
function revealSplitTargets(targets, vars = {}, split = null) {
  return gsap.to(targets, {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    duration: REVEAL_DURATION,
    ease: 'power2.out',
    // Valeur par défaut ; splitForReveal en renvoie une adaptée au découpage,
    // que les appelants transmettent via `vars` (étalé après, donc gagnant).
    stagger: { each: REVEAL_STAGGER_CHARS, from: 'random' },
    onComplete: () => {
      // On rend le texte au DOM dès que l'animation est finie, plutôt que de
      // se contenter d'un clearProps.
      //
      // INDISPENSABLE pour le découpage en lignes : SplitText fige la
      // répartition des mots dans un <div> par ligne, mesurée à la largeur du
      // moment. Sans revert, un redimensionnement (ou une rotation de
      // téléphone) laisse ces lignes telles quelles : chacune se re-casse alors
      // à l'intérieur de son propre div et le paragraphe part en escalier.
      // Rien ne re-découpe au resize dans ce fichier.
      //
      // Utile aussi pour les mots : revert supprime les fragments, donc les
      // `filter` et `will-change` inline qu'ils portaient — et avec eux autant
      // de couches de composition qui, sur une page à plusieurs titres,
      // s'accumulaient jusqu'à peser sur le scroll.
      if (split) split.revert();
      else gsap.set(targets, { clearProps: 'filter,transform,opacity,willChange' });
    },
    ...vars,
  });
}

/**
 * true si le visiteur a demandé à réduire les animations. Un fondu de signes
 * en ordre aléatoire est exactement ce que ce réglage vise : on affiche alors
 * le texte directement.
 */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// initHeroIntro n'est PAS dans cette liste : elle est jouée séparément, en
// premier, et le reste ne démarre qu'une fois son intro terminée (voir
// createAnimations). Les sections pinnées, si un jour il y en a, doivent être
// placées en tête pour que leur pinSpacing soit calculé avant les autres.
const ANIMATION_INITS = [
  initGalerieReveal,
  initVideoReveal,
  initGalerieThumbReveal,
  initGalerieSwipers,
  initCarousels,
  initEventCarousels,
  initFadeInAnimations,
  initGsapFadeIn,
  initTextRevealAnimations,
  initListRevealAnimations,
  initTextScrubReveal,
  initStaggerReveal,
  initFaqAccordion,
  initCardHoverAnimations,
  initRevealImages,
  initLineReveal,
  initColumnParallax,
  initFooterMenuReveal,
  initSlideUp,
  initButtonReveal,
  initScrollDownButton,
  initAnchorScroll,
];

/**
 * Joue une passe de toutes les inits. Chaque init est isolée : si l'une plante
 * (ex: bug interne ScrollTrigger), les autres doivent quand même s'exécuter.
 *
 * Étalée sur plusieurs frames (par petits groupes, via requestAnimationFrame)
 * plutôt qu'en une seule passe synchrone : au-delà d'une vingtaine de
 * ScrollTrigger créés d'affilée, une corruption interne apparaît sur iOS
 * Safari (crash "undefined ... .pin" dans ScrollTrigger), jamais observée sur
 * les pages qui en créent moins en une seule passe — tout indique un bug GSAP
 * lié au NOMBRE de créations synchrones consécutives plutôt qu'à un trigger
 * précis. Réduire la taille de chaque rafale permet de rester sous ce seuil
 * sans avoir à le connaître exactement.
 * @returns {Promise<boolean>} true si au moins une init (ou le refresh final) a planté.
 */
async function runAnimationInitsPass() {
  let hadCrash = false;
  const chunkSize = 3;
  for (let i = 0; i < ANIMATION_INITS.length; i += chunkSize) {
    ANIMATION_INITS.slice(i, i + chunkSize).forEach((fn) => {
      if (safeInit(fn)) hadCrash = true;
    });
    if (i + chunkSize < ANIMATION_INITS.length) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }
  // Recalcul de toutes les positions après setup complet
  if (safeInit(() => ScrollTrigger.refresh())) hadCrash = true;
  return hadCrash;
}

/**
 * Remise à zéro complète de ScrollTrigger : tue tous les triggers avec revert
 * complet, puis démantèle manuellement les pin-spacers orphelins que GSAP
 * aurait pu laisser derrière lui (un pin killé dans un état incomplet peut
 * laisser son wrapper .pin-spacer en place, ce qui corrompt les prochains
 * ScrollTrigger.refresh()/create()).
 */
function hardResetScrollTrigger() {
  ScrollTrigger.getAll().slice().forEach((trigger) => trigger.kill(true));

  document.querySelectorAll('.pin-spacer').forEach((spacer) => {
    const pinned = spacer.firstElementChild;
    if (pinned && spacer.parentNode) {
      spacer.parentNode.insertBefore(pinned, spacer);
    }
    spacer.remove();
  });
}

/**
 * Crée toutes les animations/ScrollTriggers de la page courante, une fois
 * l'intro du hero terminée (ou immédiatement s'il n'y a pas de hero). Si une
 * corruption interne à ScrollTrigger est détectée pendant la création, un
 * simple kill+recreate (hardResetScrollTrigger + nouvelle tentative) la fait
 * disparaître — sans quoi certaines pages se retrouvent sans aucune animation
 * fonctionnelle après plusieurs transitions Barba.
 */
function createAnimations(curtainPromise) {
  // Cache immédiatement (opacité simple, pas encore de split) les text-reveal
  // hors hero, pour qu'ils ne s'affichent pas en clair pendant l'attente de la
  // fin de l'intro du hero — leur véritable mise en place (SplitText + reveal,
  // dans initTextRevealAnimations) est volontairement retardée jusque-là.
  document.querySelectorAll('.text-reveal, h1, h2, h3').forEach((el) => {
    if (!el.closest('.section_hero')) {
      gsap.set(el, { autoAlpha: 0 });
    }
  });

  // .list-reveal : même logique, le conteneur reste caché jusqu'à sa mise en
  // place (ses <li> individuels, sans split).
  document.querySelectorAll('.list-reveal').forEach((el) => {
    if (!el.closest('.section_hero')) {
      gsap.set(el, { autoAlpha: 0 });
    }
  });

  const startRest = async () => {
    scrollTriggerCorrupted = false;
    const hadCrash = await runAnimationInitsPass();

    if (hadCrash) {
      console.warn('[ScrollTrigger] Corruption détectée pendant la création des animations — reset complet et nouvelle tentative.');
      scrollTriggerCorrupted = false;
      hardResetScrollTrigger();
      await runAnimationInitsPass();
    }

    // Filet de sécurité générique : couvre une corruption détectée par une
    // init ASYNCHRONE (voir initTextRevealAnimations, qui attend le chargement
    // des polices) qui n'aurait pas encore eu le temps de se manifester.
    setTimeout(() => {
      if (scrollTriggerCorrupted) {
        console.warn('[ScrollTrigger] Corruption détectée après coup — reset complet et nouvelle tentative.');
        scrollTriggerCorrupted = false;
        hardResetScrollTrigger();
        runAnimationInitsPass();
      }
    }, 2500);
  };

  // Si initHeroIntro plante de façon synchrone (avant même d'attendre
  // l'image/les polices), le reste des animations ne doit pas rester bloqué
  // indéfiniment en attendant un callback qui ne viendra jamais.
  if (safeInit(() => initHeroIntro(startRest, curtainPromise))) {
    startRest();
  }
}

/**
 * Détruit tous les ScrollTriggers de la page courante. À appeler AVANT de
 * quitter la page (Barba "leave", pendant que son DOM est encore normalement
 * affiché) — c'est le pattern recommandé par GSAP pour les transitions SPA :
 * "kill off any relevant ScrollTriggers in your unmount callback, then
 * re-create in the next page's mount callback."
 *
 * Tuer les triggers plus tard (une fois l'ancien container en display:none)
 * laisse le revert d'un pin dans un état incomplet, ce qui finit par corrompre
 * le registre interne de ScrollTrigger après plusieurs transitions.
 */
export function killAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  // getAll() retourne le tableau interne VIVANT de GSAP, et kill() en retire
  // le trigger immédiatement — l'itérer directement avec forEach() sauterait
  // un trigger sur deux à mesure que les indices se décalent. .slice() d'abord
  // pour itérer un instantané stable. kill(true) force un revert complet
  // (unpin, retrait des pin-spacers, restauration des styles) plutôt que le
  // kill léger par défaut, puisqu'on va remplacer tout le DOM de la page.
  ScrollTrigger.getAll().slice().forEach((trigger) => trigger.kill(true));

  // Le parallax (initColumnParallax) tourne sur un ticker GSAP indépendant des
  // ScrollTriggers ci-dessus : sans cet arrêt explicite, les instances de la
  // page quittée continueraient de tourner en plus de celles de la suivante.
  destroyColumnParallax();
}

/**
 * Initialise toutes les animations GSAP de la page courante. À appeler une
 * fois le nouveau container prêt (Barba "beforeEnter") — killAnimations() doit
 * déjà avoir tourné côté page sortante.
 */
export function initAnimations(curtainPromise) {
  if (typeof gsap === 'undefined') {
    console.warn('⚠️ GSAP not available');
    return;
  }

  createAnimations(curtainPromise);
}

/* ==========================================================================
   Reveals au scroll
   ========================================================================== */

/**
 * Reveal générique des images/blocs portant .reveal.
 *
 * Déclenché uniquement par le scroll (même défaut `top 80%` que
 * initTextRevealAnimations), sans attendre que la photo soit réseau-chargée :
 * mediaRevealImage() force ses valeurs d'opacité/position (fromTo), donc
 * l'animation joue correctement même si le fichier n'a pas fini de
 * télécharger (il apparaît alors via le fondu CSS du lazyload, sans décalage
 * supplémentaire par rapport au texte).
 *
 * Attributs reconnus sur le .reveal :
 *   data-reveal-start="80"            seuil de déclenchement, en % du viewport
 *   data-reveal-delay="0.3"           délai (s) pour décaler 2 reveals voisins
 *   data-reveal-mask="right"          masque 3 couches qui se retire à droite
 *   data-reveal-companion="#sel, #sel" élément(s) révélés après la photo
 */
function initRevealImages() {
  document.querySelectorAll('.reveal').forEach((container) => {
    // Filtre offsetParent (voir queryVisible) : certains composants rendent 2
    // variantes du même contenu, l'une pour mobile et l'autre pour desktop,
    // masquée en CSS selon le viewport — sans ce filtre, la variante masquée
    // (display:none, donc sans dimensions) crée un ScrollTrigger dégénéré qui
    // peut corrompre le calcul des triggers suivants.
    if (container.offsetParent === null) return;

    const image = container.querySelector('img');
    if (!image) return;

    // Isolé par container : une exception ici ne doit jamais interrompre le
    // forEach (sinon tous les .reveal restants gardent leur visibility:hidden
    // CSS par défaut pour toujours, rien d'autre ne les révèle). En cas
    // d'erreur, on force au moins la visibilité sans animation.
    try {
      const tl = gsap.timeline({
        delay: parseFloat(container.dataset.revealDelay) || 0,
        scrollTrigger: {
          trigger: container,
          // Fonction plutôt que 'top 80%' : voir untransformedDocTop — le
          // .from(container, {yPercent:100}) juste en dessous fausserait
          // sinon la mesure.
          start: () => {
            const percent = parseFloat(container.dataset.revealStart) || 80;
            return untransformedDocTop(container) - (percent / 100) * window.innerHeight;
          },
          once: true,
        },
      });

      tl.set(container, { autoAlpha: 1 })
        .from(container, {
          yPercent: 100,
          duration: 1.5,
          ease: 'power2.out',
        }, 0);

      mediaRevealImage(image, tl, 1.5, 0);

      // Masque 3 couches optionnel : démarre une fois le container arrivé,
      // pour lire comme "l'image est en place, puis les couches se retirent"
      // plutôt que deux mouvements simultanés discordants.
      if (container.dataset.revealMask === 'right') {
        layeredMaskRevealRight(container, tl, 0.9, 0.5);
      }

      if (container.dataset.revealCompanion) {
        const companions = document.querySelectorAll(container.dataset.revealCompanion);
        if (companions.length) {
          gsap.set(companions, { autoAlpha: 0 });
          tl.to(companions, {
            autoAlpha: 1,
            duration: 0.5,
            ease: 'power1.out',
          });
        }
      }
    } catch (error) {
      reportScrollTriggerCorruption('initRevealImages (container)', error);
      gsap.set(container, { autoAlpha: 1 });
      // Sinon un compagnon déjà passé à autoAlpha:0 plus haut resterait
      // invisible pour toujours, rien d'autre ne le révèle si l'erreur empêche
      // la timeline d'aller à son .to() correspondant.
      if (container.dataset.revealCompanion) {
        gsap.set(document.querySelectorAll(container.dataset.revealCompanion), { autoAlpha: 1 });
      }
    }
  });
}

/**
 * Reveal des lignes/bordures horizontales (.line-reveal) : se dessinent de
 * gauche à droite (scaleX) au scroll. Mêmes attributs data-reveal-start /
 * data-reveal-delay que .reveal, pour rester synchronisées avec le texte
 * qu'elles précèdent plutôt que de s'afficher instantanément en CSS.
 */
function initLineReveal() {
  document.querySelectorAll('.line-reveal').forEach((line) => {
    if (line.offsetParent === null) return;

    try {
      gsap.timeline({
        delay: parseFloat(line.dataset.revealDelay) || 0,
        scrollTrigger: {
          trigger: line,
          start: () => {
            const percent = parseFloat(line.dataset.revealStart) || 80;
            return untransformedDocTop(line) - (percent / 100) * window.innerHeight;
          },
          once: true,
        },
      }).to(line, {
        scaleX: 1,
        duration: 0.5,
        ease: 'power2.out',
      }, 0);
    } catch (error) {
      reportScrollTriggerCorruption('initLineReveal (line)', error);
      gsap.set(line, { scaleX: 1 });
    }
  });
}

/**
 * Révélation de texte (.text-reveal, h1, h2, h3) : « blur-in » — les titres
 * signe à signe en ordre aléatoire, les descriptions ligne à ligne de haut en
 * bas — voir splitForReveal() et revealSplitTargets() plus haut.
 *
 * Déclenchement au scroll via IntersectionObserver plutôt que ScrollTrigger :
 * ces éléments sont de loin le plus gros contributeur de triggers sur une page
 * chargée en contenu (15-20 titres/paragraphes). Un bug interne à
 * ScrollTrigger, qui apparaît à partir d'un certain nombre de triggers
 * coexistants (peu importe leur identité ou l'ordre de création), corrompt
 * alors son registre au point que d'autres triggers créés ensuite, pourtant
 * sans lien, cessent de se déclencher. Ni un refresh() répété ni un
 * kill+recreate complet n'en viennent à bout — seul RÉDUIRE le nombre total de
 * ScrollTrigger créés évite d'atteindre ce seuil. IntersectionObserver est une
 * API native, entièrement immunisée contre ce bug.
 */
function initTextRevealAnimations() {
  if (typeof SplitText === 'undefined') return;

  gsap.registerPlugin(SplitText);

  const textRevealElements = Array.from(document.querySelectorAll('.text-reveal, h1, h2, h3'))
    // Le hero a sa propre séquence d'entrée (initHeroIntro)
    .filter((el) => !el.closest('.section_hero'));

  if (!textRevealElements.length) return;

  // Mouvement réduit demandé : on affiche le texte tel quel. Pas de split non
  // plus — inutile de découper le DOM en centaines de fragments pour une
  // animation qu'on ne jouera pas.
  if (prefersReducedMotion()) {
    gsap.set(textRevealElements, { autoAlpha: 1 });
    document.dispatchEvent(new CustomEvent('textRevealStarted'));
    return;
  }

  // document.fonts.ready peut indiquer "loaded" alors que la police
  // spécifiquement utilisée par du contenu tout juste inséré par Barba n'a pas
  // encore été réellement demandée par le navigateur (elle ne l'est qu'une
  // fois le texte concerné mis en page). SplitText mesure alors les sauts de
  // ligne avec la police de secours, puis la vraie police arrive et change ces
  // mesures : le split ne correspond plus au texte affiché. On force donc
  // explicitement le chargement de la police réellement utilisée par CHAQUE
  // élément avant de découper.
  const fontLoads = textRevealElements.map((el) => {
    const cs = getComputedStyle(el);
    return document.fonts.load(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`).catch(() => {});
  });

  Promise.all(fontLoads).then(() => {
    // Deux frames d'attente : laisse la mise en page se réappliquer
    // complètement après le font swap avant de mesurer les lignes.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let hadElementError = false;

        // 'textRevealStarted' est dispatché sur document dès que TOUS les
        // text-reveal de la page ont DÉMARRÉ leur reveal (onStart, pas
        // onComplete — sinon le délai avant un élément qui attend cet
        // évènement via data-fade-wait-for inclurait en plus la durée entière
        // de l'animation du texte, perçu comme trop lent).
        let doneCount = 0;
        const notifyProgress = () => {
          doneCount += 1;
          if (doneCount >= textRevealElements.length) {
            document.dispatchEvent(new CustomEvent('textRevealStarted'));
          }
        };

        textRevealElements.forEach((el) => {
          // Isolé par élément : une exception ici (SplitText, mesure...) ne
          // doit jamais interrompre le forEach — sinon TOUS les éléments
          // restants ne recevraient jamais leur gsap.set(autoAlpha:1) et
          // resteraient invisibles pour toujours (ils ont été cachés en amont
          // par createAnimations, rien d'autre ne les révèle).
          try {
            if (el._splitText) {
              el._splitText.revert();
            }

            // Force un reflow pour garantir que les polices sont appliquées
            el.offsetHeight; // eslint-disable-line no-unused-expressions

            const { split, targets, stagger } = splitForReveal(el);
            el._splitText = split;

            // L'élément lui-même a été caché en amont (createAnimations) le
            // temps d'attendre la fin de l'intro du hero ; on le rend à
            // nouveau visible ici, ses FRAGMENTS restant cachés jusqu'au reveal.
            gsap.set(el, { autoAlpha: 1 });
            gsap.set(targets, REVEAL_FROM);

            // Titre en overlay SUR une photo .reveal (voir rs_contact_cta) :
            // pas de déclenchement propre, il se joue une fois le reveal de la
            // photo terminé, via l'évènement 'revealcomplete' dispatché sur
            // son <img> — le titre "attend" la photo au lieu de se déclencher
            // indépendamment au scroll.
            const titleOverlay = el.closest('.cta-title-overlay');
            if (titleOverlay) {
              const photoImg = titleOverlay.parentElement.querySelector('.reveal img');
              const anim = revealSplitTargets(targets, { stagger, paused: true, onStart: notifyProgress }, split);
              if (photoImg) {
                photoImg.addEventListener('revealcomplete', () => anim.play(), { once: true });
              } else {
                anim.play();
              }
              return;
            }

            // La marge basse négative réduit la zone d'observation au seul haut
            // du viewport, équivalent du "start: top X%" de ScrollTrigger.
            const percent = parseFloat(el.dataset.revealStart) || 80;
            const delay = parseFloat(el.dataset.revealDelay) || 0;
            let checkCount = 0;

            const reveal = () => {
              observer.disconnect();
              revealSplitTargets(targets, { stagger, delay, onStart: notifyProgress }, split);
            };

            const observer = new IntersectionObserver((entries) => {
              checkCount += 1;
              if (!entries[0].isIntersecting) return;
              if (checkCount === 1) {
                // Déjà dans la zone de révélation dès la création de
                // l'observer (ex: juste sous un hero plein écran, où la
                // hauteur réelle du viewport — barre d'adresse mobile — peut
                // différer légèrement de celle utilisée ici) : un léger délai
                // laisse le temps de VOIR l'animation au lieu qu'elle se joue
                // avant même que l'utilisateur ait scrollé jusque-là.
                setTimeout(reveal, 300);
              } else {
                reveal();
              }
            }, { rootMargin: `0px 0px -${100 - percent}% 0px`, threshold: 0 });
            observer.observe(el);
          } catch (error) {
            reportScrollTriggerCorruption('initTextRevealAnimations (element)', error);
            gsap.set(el, { autoAlpha: 1 });
            hadElementError = true;
            notifyProgress();
          }
        });

        if (hadElementError) {
          console.warn('[ScrollTrigger] Corruption détectée pendant initTextRevealAnimations — reset complet et nouvelle tentative.');
          scrollTriggerCorrupted = false;
          hardResetScrollTrigger();
          runAnimationInitsPass();
        }
      });
    });
  });
}

/**
 * Révèle chaque <li> d'une liste (.list-reveal) un par un au scroll — fondu +
 * glissement vertical, stagger, même courbe que .text-reveal mais SANS
 * SplitText : SplitText (type:'lines') redécoupe le texte par ligne VISUELLE
 * et recrée un <li> par ligne détectée, ce qui casse une vraie liste HTML dont
 * un item s'affiche sur plusieurs lignes. Ici chaque <li> déjà présent dans le
 * DOM est directement l'unité animée, aucune restructuration du HTML.
 */
function initListRevealAnimations() {
  Array.from(document.querySelectorAll('.list-reveal'))
    .filter((el) => !el.closest('.section_hero'))
    .forEach((el) => {
      try {
        const items = Array.from(el.querySelectorAll('li'));

        // Aucun <li> (ex: champ ACF rempli avec un simple paragraphe plutôt
        // qu'une liste) : rien à animer par item, on révèle le conteneur
        // directement — sinon il resterait caché pour toujours (masqué en
        // amont dans createAnimations, rien d'autre ne le révèle).
        if (!items.length) {
          gsap.set(el, { autoAlpha: 1 });
          return;
        }

        gsap.set(el, { autoAlpha: 1 });
        gsap.set(items, { yPercent: 100, opacity: 0 });

        const percent = parseFloat(el.dataset.revealStart) || 80;
        const delay = parseFloat(el.dataset.revealDelay) || 0;
        let checkCount = 0;

        const reveal = () => {
          observer.disconnect();
          gsap.to(items, {
            yPercent: 0,
            opacity: 1,
            duration: 0.75,
            stagger: 0.15,
            delay,
            ease: 'power3.out',
          });
        };

        const observer = new IntersectionObserver((entries) => {
          checkCount += 1;
          if (!entries[0].isIntersecting) return;
          if (checkCount === 1) {
            setTimeout(reveal, 300);
          } else {
            reveal();
          }
        }, { rootMargin: `0px 0px -${100 - percent}% 0px`, threshold: 0 });
        observer.observe(el);
      } catch (error) {
        reportScrollTriggerCorruption('initListRevealAnimations (element)', error);
        gsap.set(el, { autoAlpha: 1 });
      }
    });
}

/**
 * Remplissage lettre par lettre au scroll (.text-scrub) : les caractères
 * passent de 15% à 100% d'opacité au fil du scroll.
 */
function initTextScrubReveal() {
  if (typeof SplitText === 'undefined') return;

  const elements = document.querySelectorAll('.text-scrub');
  if (!elements.length) return;

  elements.forEach((el) => {
    if (el._scrubSplit) el._scrubSplit.revert();

    el.offsetHeight; // eslint-disable-line no-unused-expressions
    const split = new SplitText(el, { type: 'chars,words' });
    el._scrubSplit = split;

    gsap.set(split.chars, { opacity: 0.15 });

    try {
      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          end: 'bottom 30%',
          scrub: 1,
        },
      }).to(split.chars, {
        opacity: 1,
        stagger: { each: 0.03 },
        ease: 'none',
      });
    } catch (error) {
      reportScrollTriggerCorruption('initTextScrubReveal (element)', error);
      gsap.set(split.chars, { opacity: 1 });
    }
  });
}

/**
 * Reveal en cascade d'une série d'items (fondu + léger glissement, stagger).
 *
 * Le groupe est déclaré dans le markup, pas ici : un conteneur
 * `data-stagger-group` dont les enfants portent `data-stagger-item`. Grouper
 * par conteneur (et non par simple sélecteur global) est nécessaire dès qu'une
 * page affiche PLUSIEURS listes du même type : un unique ScrollTrigger pour
 * tous les items de la page ne déclencherait le reveal qu'une seule fois, sur
 * la première liste rencontrée, laissant les suivantes apparaître déjà
 * pleinement visibles plus bas.
 *
 * Attributs optionnels sur le conteneur :
 *   data-stagger-start="top 85%"  seuil de déclenchement
 *   data-stagger-delay="0.3"      délai (s) avant le début de la cascade
 *
 * Les groupes du footer (newsletter, réseaux sociaux) utilisent 'top 98%' :
 * ils sont tout en bas du document, et sur une page pas beaucoup plus haute
 * que le viewport, le scroll n'atteint jamais le seuil à 85% une fois arrivé
 * en bas — le reveal resterait bloqué à opacity:0 pour toujours.
 */
function initStaggerReveal() {
  const groups = [
    ...Array.from(document.querySelectorAll('[data-stagger-group]')).map((group) => ({
      group,
      items: Array.from(group.querySelectorAll('[data-stagger-item]')),
      start: group.dataset.staggerStart || 'top 85%',
      delay: parseFloat(group.dataset.staggerDelay) || 0,
    })),
    // Groupes du thème déclarés par classe (composants rs_*)
    ...Array.from(document.querySelectorAll('.faq-list')).map((group) => ({
      group,
      items: Array.from(group.querySelectorAll('.faq-item')),
      start: 'top 85%',
      delay: 0,
    })),
    ...Array.from(document.querySelectorAll('.social-icons')).map((group) => ({
      group,
      items: Array.from(group.querySelectorAll('.social-reveal-item')),
      start: 'top 98%',
      delay: 0,
    })),
  ];

  groups.forEach(({ items, start, delay }) => {
    if (!items.length) return;

    gsap.set(items, { y: 40, opacity: 0 });

    // Isolé par groupe : une exception sur l'un ne doit pas empêcher les
    // groupes suivants du forEach d'être révélés.
    try {
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        delay,
        ease: 'power4.out',
        stagger: { amount: 0.4 },
        // clearProps:'transform' une fois l'animation finie : un translateY
        // même nul (0px) reste un transform CSS actif, qui crée un nouveau
        // contexte d'empilement sur l'item. Sans ça, un dropdown personnalisé
        // (.custom-select-options, z-index:20) ouvert DANS un item ne peut
        // jamais s'afficher au-dessus de l'item SUIVANT : ce contexte
        // d'empilement le confine visuellement à l'intérieur de son propre
        // item, peu importe son z-index.
        clearProps: 'transform',
        scrollTrigger: {
          trigger: items[0],
          start,
          once: true,
        },
      });
    } catch (error) {
      reportScrollTriggerCorruption('initStaggerReveal (group)', error);
      gsap.set(items, { y: 0, opacity: 1, clearProps: 'transform' });
    }
  });
}

/**
 * Reveal des liens du menu footer : même animation que l'apparition des liens
 * du menu mobile à son ouverture (voir openMenu() dans js/navigation.js), mais
 * déclenchée au scroll plutôt qu'au clic.
 */
function initFooterMenuReveal() {
  const links = gsap.utils.toArray('.footer-menu-link');
  if (!links.length) return;

  gsap.set(links, { yPercent: 100, opacity: 0 });
  try {
    gsap.to(links, {
      yPercent: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: links[0],
        start: 'top 90%',
        once: true,
      },
    });
  } catch (error) {
    reportScrollTriggerCorruption('initFooterMenuReveal', error);
    gsap.set(links, { yPercent: 0, opacity: 1 });
  }
}

/**
 * Slide up (.slide-up) : monte de 100px vers sa position au scroll.
 */
function initSlideUp() {
  document.querySelectorAll('.slide-up').forEach((el) => {
    // Isolé par élément : une exception ici ne doit jamais interrompre le
    // forEach, sinon les .slide-up restants gardent le transform initial posé
    // par ce from() pour toujours.
    try {
      gsap.from(el, {
        y: 100,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: `top ${el.dataset.revealStart || '85%'}`,
          once: true,
        },
      });
    } catch (error) {
      reportScrollTriggerCorruption('initSlideUp (element)', error);
      gsap.set(el, { y: 0 });
    }
  });
}

/**
 * Reveal générique (fondu + léger slide up) des boutons CTA (.btn).
 */
function initButtonReveal() {
  document.querySelectorAll('.btn').forEach((btn) => {
    // Bouton du hero : déjà révélé avec le reste de .hero-bottom-row par
    // initHeroIntro — un 2e reveal indépendant entrerait en conflit avec cette
    // séquence (double animation du même élément, l'une écrasant l'autre).
    if (btn.closest('.hero-bottom-row')) return;

    // Boutons du header (fixe, toujours à l'écran) : ce ne sont pas des
    // éléments qui "arrivent au scroll", un reveal se déclencherait
    // immédiatement dès l'init et provoquerait un mouvement parasite.
    if (btn.closest('#masthead')) return;

    // Bouton newsletter : déjà animé avec le champ email par le groupe
    // .newsletter-reveal-item (voir initStaggerReveal).
    if (btn.closest('#newsletter')) return;

    // Bouton d'envoi d'un formulaire avec case de consentement : son opacity
    // est pilotée en continu par le JS du formulaire selon l'état de la case
    // (grisé tant qu'elle n'est pas cochée) — un reveal fixerait opacity:1 dès
    // que le bouton entre à l'écran, écrasant ce grisage voulu.
    if (btn.closest('form')?.querySelector('input[name="consentement"]')) return;

    try {
      // fromTo avec opacity:1 explicite en arrivée (pas from(), qui aurait
      // capturé l'opacité CALCULÉE actuelle du bouton comme cible implicite —
      // pour un bouton désactivé, cette opacité vaut 0.5 au moment où
      // l'animation est mise en place : l'animation viserait alors 0 → 0.5, et
      // GSAP fige cette valeur en style inline une fois le tween terminé, même
      // après réactivation du bouton).
      gsap.fromTo(btn,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: btn,
            start: 'top 90%',
            once: true,
          },
        });
    } catch (error) {
      reportScrollTriggerCorruption('initButtonReveal (element)', error);
      gsap.set(btn, { y: 0, opacity: 1 });
    }
  });
}

/**
 * Fade-in (.fade-in) : fondu + glissement de 50px.
 *
 * Attributs optionnels :
 *   data-fade-wait-for="eventName"  attend un évènement précis sur document
 *                                   plutôt qu'un seuil de scroll (ex:
 *                                   "textRevealStarted", dispatché par
 *                                   initTextRevealAnimations). Prioritaire sur
 *                                   data-fade-delay.
 *   data-fade-delay="0.6"           délai explicite (s), au-delà du stagger
 *                                   par défaut de i*0.1
 *   data-fade-duration="0.75"       durée (s), 1s par défaut
 *   data-fade-start="100"           seuil de déclenchement, en % de la hauteur
 *                                   du viewport (85 par défaut). 100 = dès que
 *                                   l'élément touche le bas de l'écran, donc
 *                                   le plus tôt possible. Même unité que le
 *                                   data-reveal-start des .text-reveal.
 */
function initFadeInAnimations() {
  gsap.utils.toArray('.fade-in').forEach((element, i) => {
    try {
      const waitForEvent = element.dataset.fadeWaitFor;

      const customDelay = parseFloat(element.dataset.fadeDelay);
      const delay = Number.isNaN(customDelay) ? i * 0.1 : customDelay;

      const customDuration = parseFloat(element.dataset.fadeDuration);
      const duration = Number.isNaN(customDuration) ? 1 : customDuration;

      const customStart = parseFloat(element.dataset.fadeStart);
      const startPercent = Number.isNaN(customStart) ? 85 : customStart;

      const anim = gsap.fromTo(element,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration,
          delay: waitForEvent ? 0 : delay,
          ease: 'power2.out',
          paused: !!waitForEvent,
          scrollTrigger: waitForEvent ? undefined : {
            // once, et SURTOUT pas `toggleActions: 'play none none reverse'` :
            // le `reverse` final rejouait l'animation à l'envers dès qu'on
            // remontait au-dessus du point de déclenchement. Les surtitres,
            // boutons et cartouches s'effaçaient donc en cours de scroll, puis
            // réapparaissaient — on lisait ça comme un bug d'affichage, pas
            // comme une intention.
            //
            // `once` détruit aussi le trigger après coup, ce qui allège le
            // registre ScrollTrigger (voir la note sur sa corruption au-delà
            // d'une vingtaine de triggers, plus haut dans ce fichier).
            trigger: element,
            start: `top ${startPercent}%`,
            once: true,
          },
        });

      if (waitForEvent) {
        document.addEventListener(waitForEvent, () => anim.play(), { once: true });
      }
    } catch (error) {
      reportScrollTriggerCorruption('initFadeInAnimations (element)', error);
      gsap.set(element, { opacity: 1, y: 0 });
    }
  });
}

/**
 * Fade-in plus discret et non réversible (.gsap-fade-in).
 */
function initGsapFadeIn() {
  gsap.utils.toArray('.gsap-fade-in').forEach((element) => {
    try {
      gsap.fromTo(element,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 90%',
            once: true,
          },
        });
    } catch (error) {
      reportScrollTriggerCorruption('initGsapFadeIn (element)', error);
      gsap.set(element, { opacity: 1, y: 0 });
    }
  });
}

/* ==========================================================================
   Composants (galerie, carrousel, vidéo, FAQ)
   ========================================================================== */

/**
 * Section galerie (rs_galerie) : masque clip-path qui s'ouvre en pleine
 * largeur au scroll.
 */
function initGalerieReveal() {
  const outer = queryVisible('.galerie-outer');
  if (!outer) return;

  try {
    gsap.fromTo(outer,
      { clipPath: 'inset(0 25%)' },
      {
        clipPath: 'inset(0 0%)',
        ease: 'none',
        scrollTrigger: {
          trigger: outer,
          start: 'top 85%',
          end: 'top 15%',
          scrub: 1,
        },
      });
  } catch (error) {
    reportScrollTriggerCorruption('initGalerieReveal', error);
    gsap.set(outer, { clipPath: 'inset(0 0%)' });
  }
}

/**
 * Reveal de chaque miniature de rs_galerie, une fois son image chargée. Pas de
 * scroll-trigger ici : les vignettes se révèlent dès qu'elles sont prêtes, la
 * galerie étant déjà amenée à l'écran par son propre reveal (.reveal).
 */
function initGalerieThumbReveal() {
  document.querySelectorAll('.galerie-thumb-slide img').forEach((img) => {
    whenImagesReady([img], () => {
      mediaRevealImage(img, gsap.timeline(), 0.8, 0);
    });
  });
}

/**
 * Sliders Swiper de chaque rs_galerie (principal + vignettes).
 * Doit être rappelé après chaque transition Barba puisque le DOM est remplacé.
 */
function initGalerieSwipers() {
  if (typeof Swiper === 'undefined') return;

  document.querySelectorAll('.section_galerie[id^="rs-galerie-"]').forEach((root) => {
    // Isolé par galerie : une page peut afficher plusieurs rs_galerie() — une
    // exception Swiper sur l'une (DOM/timing propre à un appareil) ne doit pas
    // interrompre ce forEach et laisser les galeries suivantes sans slider.
    try {
      const thumbsEl = root.querySelector('.rs-slider-thumbs');
      const mainEl = root.querySelector('.rs-slider-main');
      if (!mainEl) return;

      // Vignettes collées à droite seulement si elles tiennent TOUTES dans le
      // conteneur sans déborder — sinon ce même alignement masquerait la 1re
      // vignette hors du conteneur (débord à gauche) au lieu de la dernière.
      // Recalculé à l'init et à chaque resize (le breakpoint mobile/desktop
      // change le nombre de vignettes visibles).
      const updateThumbsAlignment = () => {
        if (!thumbsEl) return;
        const wrapper = thumbsEl.querySelector('.swiper-wrapper');
        const slides = wrapper ? wrapper.querySelectorAll('.swiper-slide') : [];
        const totalWidth = Array.from(slides).reduce((sum, s) => sum + s.offsetWidth, 0)
          + Math.max(0, slides.length - 1) * 8; // spaceBetween:8
        thumbsEl.classList.toggle('rs-slider-thumbs--underfull', totalWidth <= thumbsEl.clientWidth);
      };

      const thumbs = thumbsEl ? new Swiper(thumbsEl, {
        spaceBetween: 8,
        slidesPerView: 2.5,
        watchSlidesProgress: true,
        on: {
          init: updateThumbsAlignment,
          resize: updateThumbsAlignment,
        },
      }) : null;

      // loop:true avec trop peu de slides n'a pas de sens (rien à boucler) et
      // Swiper s'en plaint en console — désactivé en dessous de 3, ce qui
      // arrive avec une galerie ACF n'ayant que 1-2 photos renseignées.
      const slideCount = mainEl.querySelectorAll('.swiper-slide').length;

      // Flèches mobile : sous le slider, PAS dedans (voir rs-galerie.php) —
      // siblings de root, repérés par id plutôt que root.querySelector().
      const prevEl = document.getElementById(`${root.id}-prev`);
      const nextEl = document.getElementById(`${root.id}-next`);

      const main = new Swiper(mainEl, {
        loop: slideCount > 2,
        effect: 'fade',
        ...(thumbs ? { thumbs: { swiper: thumbs } } : {}),
        ...(prevEl && nextEl ? { navigation: { prevEl, nextEl } } : {}),
        on: {
          slideChange() {
            root.querySelectorAll('.rs-slider-thumbs .swiper-slide').forEach((el, i) => {
              el.style.opacity = i === this.realIndex ? '1' : '0.7';
            });
          },
        },
      });

      if (!thumbs) return;

      root.querySelectorAll('.rs-slider-thumbs .swiper-slide').forEach((el, i) => {
        el.addEventListener('click', () => main.slideToLoop(i));
        el.style.opacity = i === 0 ? '1' : '0.7';
      });
    } catch (error) {
      console.error(`Error in initGalerieSwipers (${root.id || 'galerie'}):`, error);
    }
  });
}

/**
 * Carrousels rs_carousel : slides partiellement visibles.
 * Doit être rappelé après chaque transition Barba.
 */
function initCarousels() {
  if (typeof Swiper === 'undefined') return;

  document.querySelectorAll('.rs-carousel .rs-carousel-swiper').forEach((el) => {
    new Swiper(el, {
      slidesPerView: 1.3,
      spaceBetween: 16,
      // Curseur main (grab/grabbing) : signale que le carrousel se fait glisser.
      grabCursor: true,
      breakpoints: {
        768: {
          slidesPerView: 2.6,
          spaceBetween: 24,
        },
      },
    });
  });
}

/**
 * Carrousels d'événements (rs_event_carousel).
 *
 * slidesPerView fractionnaire : la carte suivante est volontairement coupée
 * par le bord du conteneur — qui va jusqu'au bord de l'écran — pour signaler
 * qu'il y a autre chose à voir. Les flèches vivent HORS du conteneur Swiper
 * (gouttière droite standard, voir rs-event-carousel.php), d'où la recherche
 * par id plutôt que par querySelector sur la racine.
 *
 * Doit être rappelé après chaque transition Barba puisque le DOM est remplacé.
 */
function initEventCarousels() {
  if (typeof Swiper === 'undefined') return;

  document.querySelectorAll('.event-carousel__swiper').forEach((el) => {
    // Défensif : Swiper repasserait sur un slider déjà monté après un
    // ScrollTrigger.refresh() qui réappellerait la passe d'init.
    if (el.swiper) return;

    const prevEl = document.getElementById(`${el.id}-prev`);
    const nextEl = document.getElementById(`${el.id}-next`);

    new Swiper(el, {
      slidesPerView: 1.08,
      spaceBetween: 12,
      grabCursor: true,
      // Pas de loop : les flèches doivent pouvoir se désactiver en début et en
      // fin de liste (voir .swiper-button-disabled), ce que le mode boucle
      // rend impossible — il n'y a alors jamais de fin.
      watchOverflow: true,
      breakpoints: {
        640: { slidesPerView: 1.6, spaceBetween: 14 },
        1024: { slidesPerView: 2.25, spaceBetween: 16 },
      },
      ...(prevEl && nextEl ? { navigation: { prevEl, nextEl } } : {}),
    });
  });
}

/**
 * Section vidéo (rs_video) : affichée en moitié de largeur, centrée, s'élargit
 * jusqu'au plein format au scroll.
 *
 * On anime un transform:scale() plutôt que la propriété width : l'élément
 * occupe déjà sa taille finale (100%) dans la mise en page dès le chargement,
 * donc la hauteur réservée pour cette section (dépendante de sa largeur via
 * aspect-video) ne change jamais pendant le scroll. Animer width directement
 * ferait grandir la page en temps réel et décalerait les positions de
 * déclenchement — déjà calculées — de toutes les animations plus bas.
 */
function initVideoReveal() {
  const outer = queryVisible('.scroll-video-outer');
  if (!outer) return;

  try {
    gsap.fromTo(outer,
      { scale: 0.5 },
      {
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: outer,
          // Fonctions (untransformedDocTop + offsetHeight, insensibles au
          // transform) plutôt que 'top bottom'/'bottom bottom' : le scale:0.5
          // du fromTo s'applique immédiatement à la création (avant la
          // mesure), et outer est aussi le trigger — sans ça, ScrollTrigger
          // mesure sa position/hauteur déjà réduites, donc l'échelle atteint 1
          // avant que la vidéo soit réellement à l'écran.
          start: () => untransformedDocTop(outer) - window.innerHeight,
          end: () => untransformedDocTop(outer) + outer.offsetHeight * 0.75 - window.innerHeight,
          // scrub:true (sync instantané), pas scrub:1 : ce ScrollTrigger est
          // créé après l'intro du hero, donc "tard" par rapport au chargement
          // — un scrub numérique (lag lissé) produit alors un rattrapage
          // visible depuis la valeur de scale initiale vers la vraie valeur
          // dérivée du scroll, ce qui casse le côté smooth au lieu de l'assurer.
          scrub: true,
        },
      });
  } catch (error) {
    reportScrollTriggerCorruption('initVideoReveal (scale scrub)', error);
    gsap.set(outer, { scale: 1 });
  }

  // Reveal d'entrée séparé du scale scrubé ci-dessus : propriétés différentes
  // (y/opacity vs scale) sur le même élément, donc les deux tweens coexistent
  // sans se marcher dessus.
  try {
    gsap.from(outer, {
      y: 80,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: outer,
        start: 'top 85%',
        once: true,
      },
    });
  } catch (error) {
    reportScrollTriggerCorruption('initVideoReveal (fade-in)', error);
    gsap.set(outer, { y: 0, opacity: 1 });
  }
}

/**
 * Accordéon FAQ (rs_faq) : ouverture/fermeture au clic, un seul item ouvert à
 * la fois. Volontairement ici plutôt qu'en <script> inline dans un template :
 * un script injecté via le HTML d'un container Barba ne s'exécute JAMAIS (le
 * navigateur n'exécute pas les <script> insérés via innerHTML), donc
 * l'accordéon resterait mort après une transition.
 */
function initFaqAccordion() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const itemEl = btn.closest('.faq-item');
      const answerEl = itemEl.querySelector('.faq-answer');
      const wasOpen = btn.getAttribute('aria-expanded') === 'true';

      // Portée au groupe (.faq-list) quand il existe, sinon à toute la page :
      // deux accordéons distincts sur une même page ne doivent pas se fermer
      // mutuellement.
      const scope = itemEl.closest('.faq-list') || document;

      scope.querySelectorAll('.faq-item').forEach((el) => {
        el.querySelector('.faq-answer').style.maxHeight = '0';
        el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        answerEl.style.maxHeight = `${answerEl.scrollHeight}px`;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ==========================================================================
   Parallax, hover, navigation
   ========================================================================== */

/**
 * Léger parallax au scroll sur les photos "en colonne" (.scroll-parallax-img).
 *
 * Au lieu d'un scrub GSAP (synchronisé en dur sur le scroll), on mappe en
 * continu la position de l'image dans le viewport (entrée par le bas = valeur
 * mini, sortie par le haut = valeur maxi, amplitude via --overflow en CSS)
 * vers une translation Y en px, lissée frame par frame par interpolation
 * linéaire (lerp) plutôt qu'appliquée telle quelle — un mouvement plus fluide,
 * qui continue de rattraper sa cible même entre deux frames de scroll. Un
 * IntersectionObserver n'anime que les images actuellement visibles.
 *
 * On anime la propriété "y" (px) via GSAP plutôt qu'un style.transform brut :
 * GSAP compose alors ce y avec le scale déjà en cache depuis le premier
 * contact avec l'élément (voir .scroll-parallax-img) au lieu de l'écraser — et
 * coexiste sans conflit avec le "yPercent" du reveal d'entrée
 * (mediaRevealImage), propriété distincte du même élément.
 */
const PARALLAX_EASE = 0.1;
let parallaxItems = [];

function parallaxMap(x, a, b, c, d) {
  return ((x - a) * (d - c)) / (b - a) + c;
}

function parallaxLerp(a, b, n) {
  return (1 - n) * a + n * b;
}

/**
 * Arrête et libère toutes les instances de parallax actives (ticker GSAP +
 * IntersectionObserver) — à appeler avant de recréer les animations d'une
 * nouvelle page (voir killAnimations), sinon les instances de la page quittée
 * continuent de tourner en plus des nouvelles.
 */
function destroyColumnParallax() {
  parallaxItems.forEach(({ tick, observer }) => {
    gsap.ticker.remove(tick);
    observer.disconnect();
  });
  parallaxItems = [];
}

function initColumnParallax() {
  document.querySelectorAll('.scroll-parallax-img').forEach((img) => {
    // .section_galerie avant img.parentElement : dans rs_galerie(), le parent
    // direct est .swiper-slide (positionné/transformé par Swiper, masqué quand
    // ce n'est pas le slide actif) — une référence instable pour mesurer la
    // position, contrairement au conteneur de la galerie.
    const wrap = img.closest('.photo-trio-item') || img.closest('.section_galerie') || img.parentElement;
    if (!wrap) return;

    const maxValue = parseInt(getComputedStyle(img).getPropertyValue('--overflow'), 10) || 100;
    const minValue = -maxValue;

    const getTarget = () => {
      const rect = wrap.getBoundingClientRect();
      const value = parallaxMap(rect.top, window.innerHeight, -rect.height, minValue, maxValue);
      return Math.max(Math.min(value, maxValue), minValue);
    };

    // Valeur initiale posée sans interpolation : sinon la 1re frame lerp depuis
    // 0 vers la cible réelle, visible comme un petit saut au chargement.
    let previous = getTarget();
    gsap.set(img, { y: previous });

    let isVisible = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { isVisible = entry.intersectionRatio > 0; });
    });
    observer.observe(wrap);

    const tick = () => {
      if (!isVisible) return;
      previous = parallaxLerp(previous, getTarget(), PARALLAX_EASE);
      gsap.set(img, { y: previous });
    };
    gsap.ticker.add(tick);

    parallaxItems.push({ tick, observer });
  });
}

/**
 * Léger zoom centré au survol de itemSelector : anime la <img> à l'intérieur si
 * présente (crop propre dans un container overflow-hidden), sinon l'élément
 * lui-même.
 *
 * Toujours via GSAP plutôt qu'une classe Tailwind hover:scale-* : des images
 * passent aussi par mediaRevealImage() au scroll (yPercent), qui laisse un
 * transform INLINE en fin d'animation — un hover purement CSS sur la même
 * propriété transform ne s'appliquerait alors jamais (l'inline gagne toujours
 * face à une feuille de style). GSAP gère lui-même la composition x/y/scale en
 * interne, donc ce scale s'ajoute proprement à une position déjà posée par un
 * éventuel reveal.
 * @param {string} itemSelector
 * @param {{scale?: number, duration?: number}} [opts]
 */
function initHoverZoom(itemSelector, { scale = 1.05, duration = 0.5 } = {}) {
  gsap.utils.toArray(itemSelector).forEach((item) => {
    const target = item.querySelector('img') || item;
    // transformOrigin explicite (le zoom doit toujours partir du centre de la
    // photo, jamais d'un coin) plutôt que de compter sur le défaut navigateur.
    gsap.set(target, { transformOrigin: 'center center' });

    item.addEventListener('mouseenter', () => {
      gsap.to(target, { scale, duration, ease: 'power2.out' });
    });

    item.addEventListener('mouseleave', () => {
      gsap.to(target, { scale: 1, duration, ease: 'power2.out' });
    });
  });
}

function initCardHoverAnimations() {
  initHoverZoom('.card', { scale: 1.02, duration: 0.3 });
  initHoverZoom('.rs-carousel-slide');
  initHoverZoom('.hover-zoom');
}

/**
 * Bouton "Scroll" du hero : descend vers la section suivante au clic.
 */
function initScrollDownButton() {
  const btn = queryVisible('.scroll-down');
  if (!btn) return;

  btn.style.cursor = 'pointer';
  btn.addEventListener('click', () => {
    const currentSection = btn.closest('section');
    const nextSection = currentSection ? currentSection.nextElementSibling : null;
    if (!nextSection) return;

    // Lenis plutôt que scrollIntoView() natif (convention du site : tout
    // scroll animé passe par Lenis). offset:0 pour atterrir exactement en haut
    // de la section suivante — le header fixe peut la recouvrir, c'est voulu
    // ici, contrairement à scrollToAnchor() dans barba.js qui décale de -150.
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(nextSection, {
        offset: 0,
        duration: 1.5,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      nextSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// Lié une seule fois (délégation sur document, jamais réinitialisée à chaque
// page Barba) : les liens d'ancre eux-mêmes changent de page en page, mais le
// listener délégué au niveau document reste valable pour tous.
let anchorScrollBound = false;

/**
 * Scroll fluide (Lenis) vers une ancre de la MÊME page (ex: <a href="#contact">).
 * Sans ceci, un tel lien ferait un saut instantané natif. Pas de data-barba
 * ici (addBarbaToLinks() exclut déjà les href commençant par "#") : un lien
 * d'ancre ne doit pas déclencher le cycle complet de transition Barba (rideau,
 * fetch...) juste pour scroller sur la page courante.
 */
function initAnchorScroll() {
  if (anchorScrollBound) return;
  anchorScrollBound = true;

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.hasAttribute('data-barba')) return;

    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = document.querySelector(hash);
    if (!target) return;

    e.preventDefault();

    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, {
        offset: -150,
        duration: 2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/* ==========================================================================
   Séquence d'entrée du hero
   ========================================================================== */

/**
 * Attend que tout soit prêt (image du hero + vraies polices chargées), puis
 * enchaîne : header (haut → bas), titre, description (léger délai) et bloc du
 * bas (bas → haut). Appelle onDone() à la fin — c'est ce callback qui
 * débloque la création de toutes les autres animations de la page (voir
 * createAnimations), donc il DOIT être appelé dans tous les cas, y compris en
 * cas d'erreur.
 */
function initHeroIntro(onDone, curtainPromise) {
  // Bloque le scroll pendant toute la séquence d'entrée, pour ne révéler la
  // page qu'une fois l'intro terminée. lenis.stop() ajoute la classe
  // .lenis-stopped sur <html>, qui applique déjà overflow:hidden (voir
  // style.scss) — ça bloque aussi le scroll tactile natif (smoothTouch est
  // désactivé, donc Lenis n'intercepte pas le tactile lui-même) sans toucher à
  // document.body.style.overflow, évitant tout conflit avec le verrou
  // indépendant du menu mobile (voir js/navigation.js).
  const lenis = getLenis();
  let scrollLocked = false;

  const lockScroll = () => {
    scrollLocked = true;
    if (lenis) lenis.stop();
  };

  const unlockScroll = () => {
    if (!scrollLocked) return;
    scrollLocked = false;
    if (lenis) lenis.start();
  };

  const done = () => {
    unlockScroll();
    if (typeof onDone === 'function') onDone();
  };

  // Si le menu mobile est ouvert, sa fermeture (slide up, voir
  // js/navigation.js + enter() dans barba.js) est seule responsable de la
  // visibilité du header — c'est un enfant de #masthead, donc le
  // cacher/révéler ici en parallèle de sa propre animation de fermeture les
  // ferait se marcher dessus.
  const menuOverlay = document.getElementById('mobile-menu-overlay');
  const isMenuOpen = menuOverlay && menuOverlay.classList.contains('active');
  const header = isMenuOpen ? null : document.querySelector('#masthead');

  const hero = queryVisible('.section_hero');
  if (!hero || typeof SplitText === 'undefined') {
    // Pas de hero sur cette page (ex: mentions légales) : le header ne sera
    // jamais révélé par la timeline ci-dessous. Il faut donc le remontrer ici,
    // sinon il reste invisible en permanence sur cette page (son état caché
    // est posé en CSS, voir #masthead dans style.scss).
    if (header) gsap.set(header, { y: 0, opacity: 1 });

    // Page qui porte .wait-curtain-text-reveal sur <body> (via body_class()) :
    // démarre le fondu des .text-reveal 1s avant la fin réelle du rideau
    // (curtainPromise se résout en avance, voir initPageLoadCurtainReveal)
    // plutôt qu'en parallèle total ou en attendant la dernière frame. Les
    // autres pages sans hero gardent le déclenchement immédiat.
    if (curtainPromise && document.body.classList.contains('wait-curtain-text-reveal')) {
      curtainPromise.then(done).catch(done);
    } else {
      done();
    }
    return;
  }

  lockScroll();
  gsap.registerPlugin(SplitText);

  const title = hero.querySelector('h1');
  const description = hero.querySelector('.section_hero_content .text-reveal');
  const bottomRow = hero.querySelector('.hero-bottom-row');
  const bottomRowLine = hero.querySelector('.hero-bottom-row-line');
  const heroImg = hero.querySelector('picture img');
  // Médias accompagnant le hero (photos en quinconce de rs_hero_split) :
  // animés DANS la timeline d'intro plutôt que via .reveal/ScrollTrigger — le
  // hero est en haut de page, un trigger au scroll s'y déclencherait de toute
  // façon immédiatement, donc pendant que le container est encore invisible.
  const mediaItems = Array.from(hero.querySelectorAll('.hero-media-item'));

  // Caché immédiatement (avant l'attente de l'image/des polices) pour éviter
  // que le texte n'apparaisse brièvement avant de se cacher puis de se
  // rejouer. Simple opacité ici, PAS de SplitText tout de suite : découper les
  // lignes exige que la vraie police soit déjà active, sinon les sauts de
  // ligne sont mesurés avec la police de secours et ne correspondent plus une
  // fois la vraie police chargée (voir document.fonts.load plus bas).
  //
  // Le header est en dehors du container Barba (persiste entre les pages,
  // jamais recréé) : on le recache et le rejoue nous-même à chaque arrivée.
  if (header) gsap.set(header, { y: -40, opacity: 0 });
  if (title) gsap.set(title, { autoAlpha: 0 });
  if (description) gsap.set(description, { autoAlpha: 0 });

  // Pas de pré-masquage de heroImg : l'image du hero est pilotée uniquement
  // par le fondu CSS standard du lazyload (voir img.lazyload dans style.scss),
  // comme toutes les autres images du site.

  if (bottomRow) {
    gsap.set(bottomRow, { y: 60, opacity: 0 });
  }

  if (bottomRowLine) {
    gsap.set(bottomRowLine, { scaleX: 0, transformOrigin: 'left center' });
  }

  if (mediaItems.length) {
    gsap.set(mediaItems, { y: 70, opacity: 0 });
  }

  const run = () => {
    // Si quoi que ce soit plante ici (ex: SplitText), done() doit QUAND MÊME
    // être appelé — sinon le reste des animations de la page reste bloqué
    // indéfiniment en attendant une fin qui ne viendra jamais.
    try {
      // Mouvement réduit demandé : on affiche le hero tel quel, sans split ni
      // timeline, et on rend la main au reste de la page immédiatement.
      if (prefersReducedMotion()) {
        if (header) gsap.set(header, { y: 0, opacity: 1 });
        if (title) gsap.set(title, { autoAlpha: 1 });
        if (description) gsap.set(description, { autoAlpha: 1 });
        if (bottomRow) gsap.set(bottomRow, { y: 0, opacity: 1 });
        if (bottomRowLine) gsap.set(bottomRowLine, { scaleX: 1 });
        if (mediaItems.length) gsap.set(mediaItems, { y: 0, opacity: 1 });
        done();
        return;
      }

      // Le split n'a lieu qu'ici, une fois les vraies polices chargées (voir
      // waitForFonts) : découper du texte dont la police n'est pas encore
      // active fige des positions qui changeront au swap.
      const titleSplit = title ? splitForReveal(title) : null;
      const titleTargets = titleSplit ? titleSplit.targets : null;
      if (title) {
        gsap.set(title, { autoAlpha: 1 });
        gsap.set(titleTargets, REVEAL_FROM);
      }

      const descSplit = description ? splitForReveal(description) : null;
      const descTargets = descSplit ? descSplit.targets : null;
      if (description) {
        gsap.set(description, { autoAlpha: 1 });
        gsap.set(descTargets, REVEAL_FROM);
      }

      // delay 0.8s (pas 0.4s) : le rideau met 1.1s à se retirer et démarre à
      // peu près au même instant que cette timeline (les deux attendent le
      // chargement du hero). Avec 0.4s, le titre apparaissait déjà en plein
      // mouvement dès que le rideau le découvrait, au lieu de partir d'un état
      // bien caché. 0.8s laisse au rideau le temps de dépasser la position du
      // titre avant que son animation ne démarre.
      const tl = gsap.timeline({ delay: 0.8, onComplete: done });

      if (header) {
        tl.to(header, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }, 0);
      }

      // Même « blur-in » aléatoire que le reste du site (voir
      // revealSplitTargets), ajouté à la timeline plutôt que joué seul pour
      // rester synchronisé avec le header, le filet et les photos.
      if (titleTargets) {
        tl.add(revealSplitTargets(titleTargets, { stagger: titleSplit.stagger }, titleSplit.split), 0);
      }

      if (descTargets) {
        // L'accroche démarre pendant que le titre finit de se poser : un
        // enchaînement strictement séquentiel rendrait l'intro trop longue.
        tl.add(revealSplitTargets(descTargets, { stagger: descSplit.stagger }, descSplit.split), title ? 0.35 : 0);
      }

      if (bottomRowLine) {
        tl.to(bottomRowLine, { scaleX: 1, duration: 0.5, ease: 'power2.out' }, '-=0.3');
      }

      if (bottomRow) {
        tl.to(bottomRow, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
      }

      // Photos : démarrent en même temps que le titre (position 0.2) plutôt
      // qu'à la fin de la timeline — les deux colonnes du hero doivent se
      // composer ensemble, pas l'une après l'autre.
      if (mediaItems.length) {
        tl.to(mediaItems, {
          y: 0,
          opacity: 1,
          duration: 1.1,
          stagger: 0.18,
          ease: 'power3.out',
        }, 0.2);
      }
    } catch (error) {
      console.error('Error in initHeroIntro run():', error);
      // Les photos ne portent pas de texte, mais elles partent à opacity:0 —
      // sans ce repli elles resteraient invisibles si la séquence plante.
      if (mediaItems.length) gsap.set(mediaItems, { y: 0, opacity: 1 });
      // Le header porte la navigation : contrairement au texte du hero, il ne
      // doit jamais rester invisible si la séquence plante avant son tween.
      if (header) gsap.set(header, { y: 0, opacity: 1 });
      done();
    }
  };

  const waitForImage = new Promise((resolve) => {
    if (!heroImg) return resolve();
    if (heroImg.classList.contains('lazyloaded') || (heroImg.complete && heroImg.currentSrc)) {
      return resolve();
    }
    heroImg.addEventListener('lazyloaded', resolve, { once: true });
    heroImg.addEventListener('load', resolve, { once: true });
    heroImg.addEventListener('error', resolve, { once: true });
    return undefined;
  });

  // document.fonts.ready peut résoudre avant que la police spécifique du
  // titre/de la description (contenu injecté par Barba) ait réellement été
  // demandée par le navigateur. On force explicitement son chargement pour
  // garantir que le split mesure les bonnes lignes dès le départ.
  const waitForFonts = Promise.all(
    [title, description].filter(Boolean).map((el) => {
      const cs = getComputedStyle(el);
      return document.fonts.load(`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`).catch(() => {});
    }),
  );

  // Filet de sécurité : si l'image ou une police ne se charge jamais (erreur
  // réseau), on ne doit pas bloquer indéfiniment le reste des animations, qui
  // attendent que done() soit appelé.
  Promise.race([
    Promise.all([waitForFonts, waitForImage]),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]).then(() => setTimeout(run, 100));
}

/**
 * Animation d'entrée initiale de la page. Affichée directement, sans fondu :
 * le rideau (#page-transition-mask, voir initPageLoadCurtainReveal dans
 * barba.js) couvre tout l'écran au tout premier chargement et révèle la page
 * en glissant — un fondu du container ici jouerait dessous, invisible tant que
 * le rideau couvre, avec le risque qu'il ne soit pas encore terminé quand le
 * rideau se retire (le rideau attend le hero, pas ce fondu).
 */
export function initPageEntryAnimation() {
  const container = document.querySelector('[data-barba="container"]');

  if (container && typeof gsap !== 'undefined') {
    gsap.set(container, { opacity: 1 });
  }
}
