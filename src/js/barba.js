/**
 * Transitions de page Barba.js.
 *
 * Principe : un rideau opaque à 3 couches (#page-transition-mask, voir
 * header.php) glisse de haut en bas pour COUVRIR la page qu'on quitte, puis
 * continue son mouvement vers le bas pour RÉVÉLER la page suivante une fois
 * prête — un seul mouvement continu, pas un fondu. Le header et le footer
 * vivent en dehors du container Barba (donc jamais réécrits par la transition
 * AJAX) et sont resynchronisés par updatePersistentLayoutLinks().
 */

import { getLenis, initScrollToTop } from './lenis.js';
import { initAnimations, killAnimations } from './animations.js';
import { initHeaderScroll } from './header.js';
import { addBarbaToLinks, updateCurrentMenuItem, setPendingMenuActive, clearPendingMenuActive } from './utils.js';
import { initScrollVideo } from './components/scroll-video.js';
import { initCustomSelects } from './components/custom-select.js';
import { initDatePickers } from './components/date-picker.js';
import { initNewsletterFormAjax } from './forms/newsletter-form.js';

const { barba, gsap, ScrollTrigger } = window;

let isReloading = false;

// Filet de sécurité si la page suivante met trop de temps à arriver (voir
// beforeLeave/beforeEnter) : évite de laisser l'utilisateur bloqué en attente
// sur l'ancienne page indéfiniment.
let slowLoadTimer = null;
const SLOW_LOAD_TIMEOUT = 10000;

function showWaitCursor() {
  document.body.classList.add('page-loading');
}

function hideWaitCursor() {
  document.body.classList.remove('page-loading');
}

/**
 * Les 3 couches du rideau, dans l'ordre d'empilement VISUEL (la dernière du
 * DOM — la plus claire — est peinte par-dessus les 2 autres, donc en premier
 * ici) : même contrainte que layeredMaskRevealRight() dans animations.js — au
 * repos, seule la couche du dessus est visible ; l'animer en dernier la
 * laisserait immobile pendant que les couches cachées dessous bougent déjà,
 * invisibles.
 * @returns {HTMLElement[]}
 */
function getMaskLayers() {
  const mask = document.getElementById('page-transition-mask');
  return mask ? Array.from(mask.children).reverse() : [];
}

// Décalages de départ EXPLICITES et différents entre chaque couche plutôt
// qu'un stagger GSAP à formule (each+ease) : sur seulement 3 éléments, une
// formule d'ease impose un ratio fixe entre les 2 écarts (1:3 avec power2.in)
// — le plus petit des deux reste alors trop court pour être perceptible tant
// que l'écart total ne devient pas exagérément long (2 des 3 couches semblent
// n'en former qu'une). Des valeurs choisies à la main gardent les 3 couches
// nettement visibles tout en gardant un rythme non constant.
const MASK_LAYER_OFFSETS = [0, 0.18, 0.4];

/**
 * Anime les 3 couches du rideau vers une position Y commune.
 * @param {HTMLElement[]} layers
 * @param {number} yPercent - relatif à la hauteur de CHAQUE couche (inset:0
 *   sur son parent plein écran) plutôt qu'une valeur en pixels : se
 *   cache/révèle correctement quelle que soit la hauteur réelle du viewport, y
 *   compris si elle change entre-temps (barre d'adresse mobile, resize) sans
 *   recalcul explicite.
 * @param {number} duration
 * @returns {gsap.core.Timeline}
 */
function animateMaskLayers(layers, yPercent, duration) {
  const tl = gsap.timeline();
  layers.forEach((layer, i) => {
    tl.to(layer, { yPercent, duration, ease: 'power2.inOut' }, MASK_LAYER_OFFSETS[i] || 0);
  });
  return tl;
}

function closeMobileMenu() {
  const menuOverlay = document.getElementById('mobile-menu-overlay');
  if (menuOverlay && menuOverlay.classList.contains('active')) {
    menuOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Attend que l'image du hero de la page suivante soit chargée, pour ne pas
 * révéler un hero encore vide/flou. Filet de sécurité (timeout) au cas où
 * l'image ne se chargerait jamais.
 * @param {HTMLElement} container
 * @returns {Promise<void>}
 */
function waitForHeroImage(container) {
  const heroImg = container && container.querySelector('.section_hero picture img');

  return new Promise((resolve) => {
    if (!heroImg) return resolve();
    if (heroImg.classList.contains('lazyloaded') || (heroImg.complete && heroImg.currentSrc)) {
      return resolve();
    }

    const timeout = setTimeout(resolve, 5000);
    const done = () => {
      clearTimeout(timeout);
      resolve();
    };
    heroImg.addEventListener('lazyloaded', done, { once: true });
    heroImg.addEventListener('load', done, { once: true });
    heroImg.addEventListener('error', done, { once: true });
    return undefined;
  });
}

/**
 * Attend que TOUTES les images du container soient chargées, pour forcer un
 * ScrollTrigger.refresh() final. Filet de sécurité pour les pages riches en
 * images : le refresh fait juste après la transition peut tomber avant que des
 * images plus bas n'aient fini de charger, ce qui laisse les ScrollTrigger
 * calculés sur une hauteur de page pas encore définitive — les reveals
 * semblent alors se déclencher "en retard" au scroll.
 * @param {HTMLElement} container
 * @returns {Promise<void>}
 */
function waitForAllImages(container) {
  if (!container) return Promise.resolve();

  const images = Array.from(container.querySelectorAll('img'));
  const pending = images.filter((img) => !(img.complete && img.currentSrc));
  if (!pending.length) return Promise.resolve();

  return new Promise((resolve) => {
    let remaining = pending.length;
    const timeout = setTimeout(resolve, 5000);
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) {
        clearTimeout(timeout);
        resolve();
      }
    };
    pending.forEach((img) => {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  });
}

/**
 * Met à jour la variante de couleur du header selon data-header-color du
 * container (champ ACF header_color, voir header.php).
 * @param {HTMLElement} container
 */
function updateHeaderColor(container) {
  try {
    const headerColor = container.getAttribute('data-header-color') || 'white';
    const header = document.getElementById('masthead');

    if (!header) {
      console.warn('⚠️ Header element not found');
      return;
    }

    header.classList.remove('header-black', 'header-white');
    header.classList.add(headerColor === 'black' ? 'header-black' : 'header-white');
  } catch (error) {
    console.error('❌ Error updating header color:', error);
  }
}

/**
 * Met à jour le lien de bascule de langue selon les attributs
 * data-lang-label/data-lang-url du container — nécessaire car ce lien vit dans
 * le header, EN DEHORS du container Barba (jamais réécrit par la transition
 * AJAX), alors que l'URL de la langue à proposer change pour chaque page.
 * @param {HTMLElement} container
 */
function updateLangToggle(container) {
  try {
    const label = container.getAttribute('data-lang-label');
    const url = container.getAttribute('data-lang-url');
    const link = document.getElementById('header-lang-toggle');
    if (!link) return;

    if (label && url) {
      link.textContent = label;
      link.setAttribute('href', url);
      link.classList.remove('hidden');
    } else {
      link.classList.add('hidden');
    }
  } catch (error) {
    console.error('❌ Error updating lang toggle:', error);
  }
}

/**
 * Resynchronise les éléments du header ET du footer dont l'URL/le contenu
 * dépend de la langue (logos, CTA, menus, copyright...) — même raison que
 * updateLangToggle : header et footer vivent hors du container Barba, jamais
 * réécrits par la transition AJAX, alors que home_url() et les menus
 * WordPress changent selon la langue de la page.
 *
 * On relit le HTML déjà récupéré par Barba pour cette page (data.next.html)
 * plutôt que de dupliquer cette logique côté JS : ce HTML contient un
 * header.php/footer.php fraîchement rendus, avec les bons liens/menus pour la
 * langue de destination.
 * @param {string} html - data.next.html
 */
function updatePersistentLayoutLinks(html) {
  try {
    if (!html) return;
    const nextDoc = new DOMParser().parseFromString(html, 'text/html');

    // Logos du header et du menu plein écran : même href (home_url()), qui
    // change avec la langue.
    ['.site-logo', '.mobile-menu-logo'].forEach((selector) => {
      const nextLink = nextDoc.querySelector(selector);
      const currentLink = document.querySelector(selector);
      if (nextLink && currentLink) {
        currentLink.setAttribute('href', nextLink.getAttribute('href'));
      }
    });

    // CTA de réservation : href ET libellé traduit (voir esc_html_e() dans
    // header.php) — sinon le texte reste bloqué dans la langue de la toute
    // première page chargée, jamais retraduit par la suite.
    const nextBookBtn = nextDoc.getElementById('header-book-btn');
    const currentBookBtn = document.getElementById('header-book-btn');
    if (nextBookBtn && currentBookBtn) {
      currentBookBtn.setAttribute('href', nextBookBtn.getAttribute('href'));
      currentBookBtn.textContent = nextBookBtn.textContent;
    }

    // Bouton "Menu" : même souci, texte traduit en dur dans header.php.
    const nextMenuBtn = nextDoc.getElementById('mobile-menu-button');
    const currentMenuBtn = document.getElementById('mobile-menu-button');
    if (nextMenuBtn && currentMenuBtn) {
      currentMenuBtn.textContent = nextMenuBtn.textContent;
    }

    // Menu mobile : logo + nav complète (items potentiellement différents d'une
    // langue à l'autre, pas seulement leur libellé). Les liens de la nav
    // fraîche portent déjà data-barba (voir Rumhora_Mobile_Nav_Walker), donc
    // fonctionnels immédiatement (Barba écoute les clics par délégation).
    const nextMobileLogo = nextDoc.querySelector('.mobile-menu-logo');
    const currentMobileLogo = document.querySelector('.mobile-menu-logo');
    if (nextMobileLogo && currentMobileLogo) {
      currentMobileLogo.setAttribute('href', nextMobileLogo.getAttribute('href'));
    }

    const nextMobileNav = nextDoc.querySelector('.mobile-menu-nav');
    const currentMobileNav = document.querySelector('.mobile-menu-nav');
    if (nextMobileNav && currentMobileNav) {
      currentMobileNav.innerHTML = nextMobileNav.innerHTML;
    }

    // Footer : tout son contenu est remplacé EN BLOC plutôt que champ par
    // champ. Sans ça, tous les libellés et champs d'options (newsletter,
    // adresse/téléphone, copyright...) resteraient bloqués dans la langue de
    // la toute première page chargée. Les liens fraîchement injectés n'ont pas
    // encore data-barba (pas de walker custom ici) — addBarbaToLinks(),
    // appelée juste après dans after(), scanne tout le document et les
    // rattrape.
    const nextFooter = nextDoc.querySelector('footer');
    const currentFooter = document.querySelector('footer');
    if (nextFooter && currentFooter) {
      currentFooter.innerHTML = nextFooter.innerHTML;
    }
  } catch (error) {
    console.error('❌ Error updating persistent layout links:', error);
  }
}

/**
 * Attend que le nouveau container soit disponible et mesurable.
 * @param {number} timeout
 * @returns {Promise<HTMLElement>}
 */
function waitForNewContainer(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkContainer = () => {
      const container = document.querySelector('[data-barba="container"]');

      if (container && container.offsetHeight > 0) {
        resolve(container);
      } else if (Date.now() - startTime > timeout) {
        console.warn('⚠️ Timeout waiting for container');
        reject(new Error('Container timeout'));
      } else {
        requestAnimationFrame(checkContainer);
      }
    };

    checkContainer();
  });
}

/**
 * Recharge la page avec le curseur d'attente (appelable depuis un callback
 * AJAX, voir window.handlePageReload dans main.js).
 */
export function handlePageReload() {
  if (isReloading) return;
  isReloading = true;

  showWaitCursor();

  // Pas d'animation : on garde la page actuelle visible, le curseur indique
  // que quelque chose se charge.
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

/**
 * Scroll fluide vers une ancre après une transition.
 * @param {string} hash - ex: "#contact"
 */
function scrollToAnchor(hash) {
  if (!hash) return;

  const lenis = getLenis();

  setTimeout(() => {
    const target = document.querySelector(hash);

    if (!target) {
      console.warn('⚠️ Anchor target not found:', hash);
      return;
    }

    // Refresh avant le scroll : les positions peuvent avoir changé pendant la
    // transition (images qui finissent de charger).
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.refresh();
    }

    setTimeout(() => {
      if (lenis) {
        lenis.scrollTo(target, {
          offset: -150, // reste sous le header fixe
          duration: 2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        window.scrollTo({ top: target.offsetTop - 150, behavior: 'smooth' });
      }
    }, 200);
  }, 600);
}

/**
 * Initialise les transitions Barba.js.
 */
export function initBarba() {
  if (typeof barba === 'undefined') {
    console.error('❌ Barba.js not loaded!');
    return;
  }

  const wrapper = document.querySelector('[data-barba="wrapper"]');
  const container = document.querySelector('[data-barba="container"]');

  // Pas une erreur : un template volontairement minimal (sans header/footer ni
  // nav) peut ne pas avoir ce balisage du tout, puisqu'il ne propose aucune
  // navigation interne à transitionner. dist/main.js reste chargé sur toutes
  // les pages (lazyload, etc.), donc initBarba() y est quand même appelée —
  // simple sortie silencieuse plutôt qu'une alerte en erreur.
  if (!wrapper || !container) {
    return;
  }

  // Pas de mise en place du rideau ici : au tout premier chargement, il est
  // déjà visible par défaut (voir #page-transition-mask dans style.scss) et
  // c'est initPageLoadCurtainReveal(), appelée AVANT initBarba() dans main.js,
  // qui le fait glisser pour révéler la page puis le repositionne hors-écran.
  // Le faire ici aussi (gsap.set synchrone) court-circuiterait cette
  // révélation animée, encore en attente à ce moment (elle attend le hero).

  try {
    let targetHash = '';

    barba.init({
      debug: false,
      timeout: 10000, // serveurs lents
      prevent: ({ el }) => el.classList?.contains('disabled-link') || el.hasAttribute('data-barba-prevent'),
      transitions: [
        {
          name: 'curtain-transition',

          async beforeLeave(data) {
            try {
              targetHash = '';
              showWaitCursor();

              // Retour visuel immédiat sur le lien de menu cliqué, avant même
              // le chargement de la page suivante (nettoyé dans after()).
              setPendingMenuActive(data.trigger);

              if (data.trigger && data.trigger.href) {
                const { href } = data.trigger;
                if (href.includes('#')) {
                  targetHash = href.split('#')[1];
                }

                // Page suivante trop lente : plutôt que de laisser
                // l'utilisateur attendre indéfiniment sur l'ancienne page, on
                // abandonne la transition Barba et on charge la page suivante
                // en navigation classique (annulé dans beforeEnter si la page
                // arrive à temps).
                clearTimeout(slowLoadTimer);
                slowLoadTimer = setTimeout(() => {
                  window.location.href = href;
                }, SLOW_LOAD_TIMEOUT);
              }
            } catch (error) {
              console.error('Error in beforeLeave:', error);
              hideWaitCursor();
            }
          },

          async leave(data) {
            try {
              // Pas de rideau si on quitte depuis le menu mobile OUVERT :
              // celui-ci a déjà sa propre animation de fermeture (voir
              // js/navigation.js), le rideau serait redondant (invisible,
              // caché dessous) et inutile.
              const menuOverlayOnLeave = document.getElementById('mobile-menu-overlay');
              const isMenuOpenOnLeave = menuOverlayOnLeave && menuOverlayOnLeave.classList.contains('active');
              const maskLayers = getMaskLayers();

              if (maskLayers.length && !isMenuOpenOnLeave) {
                await animateMaskLayers(maskLayers, 0, 1.1);
              }

              // Détruit les ScrollTriggers de la page qu'on quitte UNE FOIS
              // l'écran couvert (par le rideau, ou déjà par le menu mobile) —
              // pas avant : kill(true) provoque un revert INSTANTANÉ (pins
              // retirés, animations de scroll remises à leur état de départ),
              // visible comme un "saut" de contenu si fait pendant que la page
              // est encore à l'écran. Mais fait quand même tant qu'elle est
              // normalement AFFICHÉE (pas display:none, qui arrive plus tard
              // dans beforeEnter) : c'est le pattern recommandé par GSAP pour
              // les transitions SPA — la recréer plus tard, une fois le
              // container caché, laissait des pins mal révertis et corrompait
              // ScrollTrigger après plusieurs navigations.
              try {
                killAnimations();
              } catch (killError) {
                console.error('Error in killAnimations (leave):', killError);
              }

              data.current.container.style.visibility = 'hidden';
            } catch (error) {
              console.error('Error in leave:', error);
            }
          },

          beforeEnter(data) {
            try {
              // La page est arrivée à temps : annule le filet de sécurité posé
              // dans beforeLeave (sinon une navigation classique se
              // déclencherait par-dessus cette transition qui a abouti).
              clearTimeout(slowLoadTimer);

              if (!data.next.container || !(data.next.container instanceof HTMLElement)) {
                console.error('❌ Invalid next container:', data.next.container);
                throw new Error('Invalid container');
              }

              // Header/footer mis à jour ICI plutôt que dans after() : le
              // header reste visible pendant toute la transition (il est hors
              // du container Barba), donc le changer une fois la nouvelle page
              // déjà révélée ferait "sauter" visiblement le libellé de langue
              // (ex: En → Fr). Fait maintenant, pendant que le container est
              // encore à opacity:0 juste en dessous, le changement est invisible.
              updateLangToggle(data.next.container);
              updatePersistentLayoutLinks(data.next.html);

              // Le menu mobile reste OUVERT ici : il ne doit se fermer qu'une
              // fois la page suivante réellement affichée, à la fin de enter()
              // — pas dès que son DOM est simplement disponible.

              const lenis = getLenis();

              // Cacher complètement l'ancien container AVANT de remettre le
              // scroll à 0 : tant qu'il est affiché, le document est
              // artificiellement plus haut (ancien + nouveau container
              // coexistent), et un reset de scroll fait à ce moment peut
              // dériver une fois cette hauteur réduite juste après.
              if (data.current.container) {
                data.current.container.style.display = 'none';
              }

              // Pas de décalage (y) ici : le container doit garder sa position
              // finale réelle pendant qu'on crée les ScrollTriggers juste
              // après, sinon leurs positions de déclenchement sont calculées
              // sur une mise en page temporaire et certains reveals "once"
              // peuvent se déclencher immédiatement (donc invisiblement)
              // pendant que le container est encore à opacity 0.
              gsap.set(data.next.container, { opacity: 0 });

              // Animations initialisées pendant que le container est encore
              // invisible, pour éviter que les éléments n'apparaissent déjà
              // "révélés" au moment où le rideau se retire. Isolé dans son
              // propre try/catch : une erreur ici ne doit jamais annuler la
              // navigation (sinon Barba abandonne la transition).
              try {
                initAnimations();
              } catch (animError) {
                console.error('Error in initAnimations (beforeEnter):', animError);
              }

              // Scroll en haut : fait EN DERNIER, une fois l'ancien container
              // caché et les ScrollTriggers de la nouvelle page créés (ces
              // deux étapes changent la hauteur du document et peuvent sinon
              // faire dériver la position de scroll après coup).
              window.scrollTo(0, 0);
              if (lenis) lenis.scrollTo(0, { immediate: true });
            } catch (error) {
              console.error('Error in beforeEnter:', error);
              hideWaitCursor();
              throw error;
            }
          },

          async enter(data) {
            try {
              // Petit délai pour laisser l'ancienne page disparaître complètement
              await gsap.to({}, { duration: 0.1 });

              // Attendre que le hero de la page suivante soit chargé, pour ne
              // pas révéler un hero encore vide.
              await waitForHeroImage(data.next.container);

              const menuOverlay = document.getElementById('mobile-menu-overlay');
              const isMenuOpen = menuOverlay && menuOverlay.classList.contains('active');
              const maskLayers = getMaskLayers();

              // Page suivante prête : affichée directement (pas de fondu de
              // container), c'est le rideau qui la révèle en se retirant.
              gsap.set(data.next.container, { opacity: 1 });

              if (isMenuOpen && typeof window.rumhoraCloseMobileMenu === 'function') {
                // Le rideau n'a jamais été affiché dans ce cas (voir leave) :
                // c'est la fermeture du menu (slide up) qui révèle la page.
                await window.rumhoraCloseMobileMenu();
                hideWaitCursor();
              } else {
                // Navigation normale : le rideau continue son mouvement vers
                // le bas jusqu'à sortir de l'écran, révélant la page déjà
                // affichée dessous — un seul mouvement continu, pas un fondu.
                if (maskLayers.length) {
                  await animateMaskLayers(maskLayers, 100, 1.1);
                }
                hideWaitCursor();
              }

              // Remet le rideau hors-écran EN HAUT, prêt pour la prochaine
              // transition — instantané, invisible (déjà hors-écran en bas, ou
              // caché sous le menu).
              if (maskLayers.length) gsap.set(maskLayers, { yPercent: -100 });

              if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.refresh();

                // Un 2e refresh une fois TOUTES les images chargées (pas
                // seulement le hero) : sur une page avec beaucoup de photos,
                // certaines finissent de charger après ce premier refresh et
                // décalent la hauteur de page, rendant les ScrollTrigger plus
                // bas qu'ils ne devraient (reveals "en retard" au scroll).
                waitForAllImages(data.next.container).then(() => {
                  ScrollTrigger.refresh();
                });
              }
            } catch (error) {
              console.error('Error in enter:', error);
              gsap.set(data.next.container, { opacity: 1 });
              // Filet de sécurité : le rideau ne doit jamais rester à couvrir
              // l'écran.
              const maskLayers = getMaskLayers();
              if (maskLayers.length) gsap.set(maskLayers, { yPercent: -100 });
              hideWaitCursor();
              closeMobileMenu();
            }
          },

          after(data) {
            try {
              // GA4/Meta Pixel : gtag('config')/fbq('track','PageView')
              // n'envoient leur page_view automatique qu'au tout premier
              // chargement — Barba ne recharge jamais la page ensuite, donc
              // sans cet appel manuel à chaque transition, seule la première
              // page de la visite serait comptée. typeof vérifié avant chaque
              // appel : absents si aucun ID n'est configuré ou si un bloqueur
              // de pub les empêche de charger — ne doit jamais faire planter
              // la transition.
              if (typeof gtag === 'function') {
                gtag('event', 'page_view', {
                  page_title: document.title,
                  page_location: window.location.href,
                  page_path: window.location.pathname,
                });
              }
              if (typeof fbq === 'function') {
                fbq('track', 'PageView');
              }

              updateHeaderColor(data.next.container);

              // Réinitialisations (les animations de reveal ont déjà été
              // initialisées dans beforeEnter, avant la révélation).
              addBarbaToLinks();
              initScrollToTop();
              updateCurrentMenuItem();
              clearPendingMenuActive();
              initHeaderScroll();

              // Composants dont le DOM a été remplacé
              initScrollVideo();
              initCustomSelects();
              initDatePickers();
              // Le footer est remplacé en bloc à chaque transition (voir
              // updatePersistentLayoutLinks) : son <form> newsletter est donc
              // lui aussi un nouveau nœud à chaque fois.
              initNewsletterFormAjax();

              if (targetHash) {
                window.history.replaceState(null, '', `${window.location.pathname}#${targetHash}`);
              }

              const hash = targetHash ? `#${targetHash}` : window.location.hash;
              if (hash) {
                scrollToAnchor(hash);
              }
            } catch (error) {
              console.error('Error in after:', error);
            }
          },
        },
      ],
    });
  } catch (error) {
    console.error('❌ Error initializing Barba.js:', error);
  }
}

/**
 * Scroll vers l'ancre présente dans l'URL au chargement initial.
 */
export function handleInitialAnchor() {
  const hash = window.location.hash;
  if (hash) {
    scrollToAnchor(hash);
  }
}

/**
 * Détecte un vrai rechargement (F5) et prépare le container en conséquence.
 */
export function handlePageLoadTransition() {
  const navigationEntries = performance.getEntriesByType('navigation');
  const isReload = navigationEntries.length > 0 && navigationEntries[0].type === 'reload';

  if (!isReload) return;

  const container = document.querySelector('[data-barba="container"]');
  if (!container) return;

  showWaitCursor();

  // Le container commence invisible. Pas de transform (y) ici : une section
  // avec un pin GSAP pinType:'transform' (requis par Lenis) suppose que ses
  // ancêtres ne bougent pas eux-mêmes via transform pendant qu'elle est
  // pinnée, sinon le pin se corrompt.
  gsap.set(container, { opacity: 0 });

  waitForNewContainer()
    .then(() => {
      // Affiché directement (pas de fondu) : c'est le rideau
      // (initPageLoadCurtainReveal) qui révèle la page en glissant, exactement
      // comme data.next.container dans enter() lors d'une vraie transition.
      gsap.set(container, { opacity: 1 });
      hideWaitCursor();
    })
    .catch((error) => {
      console.error('Error in reload transition:', error);
      // En cas d'erreur, afficher quand même le contenu.
      gsap.set(container, { opacity: 1, y: 0 });
      hideWaitCursor();
    });
}

// Durée totale réelle de l'animation du rideau (dernière couche : son délai de
// départ + sa propre durée) — sert à calculer le délai "1s avant la fin"
// ci-dessous plutôt que de dupliquer ces chiffres en dur.
const MASK_REVEAL_DURATION = 1.1;
const MASK_TOTAL_DURATION = MASK_LAYER_OFFSETS[MASK_LAYER_OFFSETS.length - 1] + MASK_REVEAL_DURATION;

/**
 * Rideau au tout premier chargement réel (atterrissage direct sur une URL, ou
 * rechargement) : contrairement aux transitions Barba, qui font d'abord
 * glisser le rideau pour COUVRIR l'ancienne page avant de révéler la nouvelle,
 * il n'y a rien à couvrir ici — le masque est DÉJÀ visible et couvre tout
 * l'écran par défaut (voir #page-transition-mask dans style.scss,
 * volontairement peint avant même que ce JS ne s'exécute). Il ne reste donc
 * qu'à le faire glisser pour révéler la page une fois prête, puis à le
 * repositionner hors-écran pour la 1re vraie transition Barba.
 *
 * À appeler tôt (avant initBarba, voir main.js) : initBarba() ne touche plus
 * au masque à l'init, pour ne pas court-circuiter ce reveal pendant qu'il
 * attend encore le chargement du hero.
 *
 * @returns {Promise<void>} résolue 1s AVANT la fin réelle du rideau (pas à la
 *   toute fin) : main.js la passe à initAnimations()/initHeroIntro() pour
 *   qu'une page sans hero (voir .wait-curtain-text-reveal) démarre son fondu
 *   de texte avec une seconde d'avance plutôt qu'à la dernière frame.
 */
export function initPageLoadCurtainReveal() {
  const maskLayers = getMaskLayers();
  if (!maskLayers.length) return Promise.resolve();

  showWaitCursor();

  const container = document.querySelector('[data-barba="container"]');

  return waitForHeroImage(container).then(() => {
    // L'animation du rideau se poursuit jusqu'à sa vraie fin, indépendamment
    // de la promesse retournée ci-dessous (anticipée, elle).
    animateMaskLayers(maskLayers, 100, MASK_REVEAL_DURATION)
      .then(() => {
        hideWaitCursor();
        // Hors-écran en haut, prêt pour la prochaine transition (Barba).
        gsap.set(maskLayers, { yPercent: -100 });
      })
      .catch((error) => {
        console.error('Error in initPageLoadCurtainReveal:', error);
        hideWaitCursor();
        gsap.set(maskLayers, { yPercent: -100 });
      });

    const earlyMs = Math.max(0, (MASK_TOTAL_DURATION - 1) * 1000);
    return new Promise((resolve) => setTimeout(resolve, earlyMs));
  });
}
