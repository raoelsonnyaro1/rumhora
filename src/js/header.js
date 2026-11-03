/**
 * Header Module
 * Gère les effets du header au scroll
 */

import { getLenis } from './lenis.js';

const { gsap, ScrollTrigger } = window;

/**
 * Initialise les effets du header au scroll avec GSAP ScrollTrigger
 */
export function initHeaderScroll() {
  const header = document.getElementById('masthead');
  const logo = document.querySelector('.custom-logo-link');
  const logoImg = logo?.querySelector('img');
  const logoCenter = document.querySelector('.header-logo-center');
  const menu = document.querySelector('.menu-container');
  const scrolledButtons = [
    document.getElementById('header-book-btn'),
    document.getElementById('mobile-menu-button'),
  ].filter(Boolean);

  if (!header || !logo || !logoImg || !menu || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  const lenis = getLenis();

  // Kill any existing ScrollTriggers on these elements
  ScrollTrigger.getAll().forEach(trigger => {
    if (trigger.vars.trigger === 'body') {
      trigger.kill();
    }
  });

  // Force les valeurs initiales strictement pour éviter les sauts au chargement
  gsap.set(logoImg, {
    width: '100%',
    clearProps: 'width'
  });
  gsap.set(menu, {
    bottom: '-3rem',
  });

  // État initial de l'icône centrée : masquée, décalée vers le bas — même
  // profil que le reveal des boutons (initButtonReveal dans animations.js).
  // xPercent/yPercent gèrent le centrage (équivalent du translate(-50%,-50%)
  // qu'on ferait en CSS) : GSAP doit connaître ces valeurs lui-même puisqu'il
  // réécrit tout le transform à chaque tween plus bas et ignorerait un
  // transform posé uniquement en CSS.
  if (logoCenter) {
    gsap.set(logoCenter, { xPercent: -50, yPercent: -50, y: 40, opacity: 0 });
  }

  // Vérifier que le scroll est bien à 0
  if (window.scrollY !== 0) {
    window.scrollTo(0, 0);
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    }
  }

  // Créer une timeline pour synchroniser les animations
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: '300px top',
      scrub: 1.5,
      invalidateOnRefresh: true,
      onRefresh: () => {
        // Si on est en haut de la page, forcer les valeurs initiales
        if (window.scrollY < 10) {
          gsap.set(logoImg, { width: '100%' });
          gsap.set(menu, { bottom: '-3rem', top: 'auto' });
        }
      },
      onUpdate: (self) => {
        // Empêcher l'animation si le scroll est forcé à 0
        if (window.scrollY === 0 && self.progress > 0) {
          self.scroll(0);
        }
      }
    }
  });

  // Animation du logo SVG qui rétrécit rapidement (termine à 30% du scroll)
  // tl.to(logoImg, {
  //   width: '500px',
  //   duration: 0.8,
  //   ease: 'power2.out'
  // }, 0);

  // Animation du menu qui monte plus lentement (termine à 100% du scroll)
  // tl.to(menu, {
  //   bottom: '0.5rem',
  //   duration: 1,
  //   ease: 'power2.out'
  // }, 0);

  // Logo + boutons "Réserver"/"Menu" passent en vert (.header-scrolled), SAUF
  // quand le header survole une section "sombre" plein écran (hero, galerie
  // rs_galerie en pleine largeur) où il doit rester blanc pour rester lisible
  // sur la photo.
  //
  // updateHeaderState() relit la position réelle (getBoundingClientRect) de
  // chaque section sombre à chaque appel, plutôt que de dépendre d'un compteur
  // tenu à jour via les callbacks onToggle/isActive de ScrollTrigger : ces
  // callbacks ne se déclenchent pas de façon fiable autour des cycles
  // disable()/enable()/refresh() (ex: le recalage forcé du scroll 150ms après
  // le "load" dans main.js), ce qui pouvait laisser le header bloqué en vert
  // au chargement. En recalculant depuis le DOM à chaque refresh/toggle, l'état
  // se corrige toujours tout seul, peu importe l'ordre des callbacks.
  const darkSections = Array.from(document.querySelectorAll('.section_hero, .header-dark-section'));

  // Sous-ensemble de darkSections : sert uniquement à décider si le logo
  // complet (icône+texte) doit être visible — voir .header-away-from-hero
  // dans style.scss. Une galerie plein écran sombre (header-dark-section)
  // reste une section "sombre" pour la couleur du header, mais ne doit plus
  // afficher le logo complet, seulement l'icône.
  const heroSections = Array.from(document.querySelectorAll('.section_hero'));

  // On compare à la position réelle du header (son propre getBoundingClientRect),
  // pas à un y=0 supposé : quand la barre d'admin WordPress est affichée, elle
  // décale tout le contenu (donc le header ET les sections) de 32px (46px en
  // mobile), donc comparer à 0 en dur détectait à tort "aucun recouvrement" au
  // tout début de page et affichait le header en vert dès le chargement.
  const isOverlappingHeader = (section) => {
    const headerRect = header.getBoundingClientRect();
    const rect = section.getBoundingClientRect();
    return rect.top <= headerRect.bottom && rect.bottom > headerRect.top;
  };

  // Suit l'état précédent pour ne déclencher le tween GSAP de l'icône
  // centrée que lors d'un vrai changement (updateHeaderState tourne à
  // chaque frame de scroll, voir plus bas) — pas à chaque appel.
  let logoCenterAway = null;

  const updateHeaderState = () => {
    // Au reload (voir handlePageLoadTransition() dans barba.js), le container
    // Barba qui enveloppe le hero peut avoir une hauteur nulle le temps d'un
    // ou deux frames pendant que waitForNewContainer() attend que la mise en
    // page soit prête. Une section sombre à hauteur nulle donnerait à tort
    // "aucun recouvrement" → header vert, avant de se corriger en blanc une
    // fois la vraie mise en page mesurable. On ignore ces mesures non fiables
    // plutôt que d'agir dessus, ce qui laisse le header sur son état par
    // défaut (blanc, aucune classe ajoutée) jusqu'à la première mesure valide.
    const measurable = darkSections.filter(section => section.getBoundingClientRect().height > 0);
    if (darkSections.length > 0 && measurable.length === 0) return;

    const overDarkSection = measurable.some(isOverlappingHeader);
    header.classList.toggle('header-scrolled', !overDarkSection);
    scrolledButtons.forEach(btn => {
      btn.classList.toggle('btn-primary', !overDarkSection);
      btn.classList.toggle('btn-tertiary', overDarkSection);
    });

    // Même filet de sécurité (hauteur non mesurable) appliqué séparément au
    // hero : logo complet visible par défaut (aucune classe) tant que l'état
    // réel n'a pas pu être mesuré, plutôt que de basculer sur l'icône à tort.
    const measurableHero = heroSections.filter(section => section.getBoundingClientRect().height > 0);
    if (heroSections.length > 0 && measurableHero.length === 0) return;

    const overHero = measurableHero.some(isOverlappingHeader);
    const isAway = !overHero;
    header.classList.toggle('header-away-from-hero', isAway);

    // Reveal GSAP de l'icône centrée, même profil que les boutons .btn
    // (initButtonReveal dans animations.js) : y:40→0, opacity, duration 0.8,
    // power3.out — dans les 2 sens (apparition ET disparition).
    if (logoCenter && isAway !== logoCenterAway) {
      logoCenterAway = isAway;
      gsap.to(logoCenter, {
        y: isAway ? 0 : 40,
        opacity: isAway ? 1 : 0,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    }
  };

  // On recalcule en continu sur chaque frame de scroll plutôt que de dépendre
  // des passages de seuil onToggle/onEnter/onLeave par section : avec
  // plusieurs sections sombres sur une même page (hero + galerie), rien ne
  // rappelait updateHeaderState() pendant la traversée de la zone claire
  // ENTRE deux sections sombres (ni l'une ni l'autre ne "toggle" à cet
  // instant précis) — le header gardait donc l'état calculé au dernier
  // passage de seuil au lieu de repasser en vert entretemps. Un recalcul à
  // chaque frame de scroll élimine ce trou : l'état reflète toujours la
  // position réelle, quelle que soit la direction.
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeaderState();
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Filet de sécurité global : tout refresh (y compris celui déclenché par le
  // cycle disable/enable de main.js après "load") re-synchronise le header.
  // Sur un chargement à froid (hard refresh, cache vidé), les polices, images
  // et scripts CDN (GSAP, Barba...) arrivent plus tard et décalent la mise en
  // page à plusieurs reprises avant qu'elle ne se stabilise : on revérifie
  // aussi explicitement à quelques moments-clé (au lieu de dépendre seulement
  // des callbacks ScrollTrigger) pour raccourcir au maximum la fenêtre
  // pendant laquelle un mauvais calcul reste visible.
  if (initHeaderScroll._cleanup) {
    initHeaderScroll._cleanup();
  }

  const timeouts = [100, 300, 600, 1000, 1800].map(delay => setTimeout(updateHeaderState, delay));
  ScrollTrigger.addEventListener('refresh', updateHeaderState);
  window.addEventListener('load', updateHeaderState);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(updateHeaderState);
  }

  initHeaderScroll._cleanup = () => {
    window.removeEventListener('scroll', onScroll);
    timeouts.forEach(clearTimeout);
    ScrollTrigger.removeEventListener('refresh', updateHeaderState);
    window.removeEventListener('load', updateHeaderState);
  };

  // Pas d'appel synchrone immédiat ici (il y en avait un) : à cet instant, la
  // hauteur réelle du hero n'est pas encore fiable (images/polices pas
  // chargées), donc measurable.length pouvait être 0 sans que darkSections
  // soit vide - mais aussi, une fois layouté avec une hauteur non nulle mais
  // pas encore définitive, le calcul pouvait conclure à tort "pas sur le
  // hero" et basculer brièvement en vert + logo centré visible, avant que le
  // 1er timeout (100ms) ne corrige - un flash visible à chaque chargement.
  // Le HTML part déjà dans le bon état par défaut (btn-tertiary en dur dans
  // header.php, .header-logo-center à opacity:0 par défaut dans le CSS) ; ne
  // pas y toucher avant le 1er timeout laisse cet état correct s'afficher
  // sans détour.
}
