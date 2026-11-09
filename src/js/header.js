/**
 * Header : bascule d'apparence selon ce qui défile dessous.
 *
 * Deux états :
 *   (par défaut)       header transparent, posé sur une section sombre
 *                      (.section_hero, .header-dark-section)
 *   .header-scrolled   header détaché du contenu : fond sombre translucide
 *                      flouté (voir _header.scss)
 *
 * updateHeaderState() relit la position RÉELLE (getBoundingClientRect) de
 * chaque section sombre à chaque appel, plutôt que de dépendre d'un compteur
 * tenu à jour par les callbacks onToggle/isActive de ScrollTrigger : ces
 * callbacks ne se déclenchent pas de façon fiable autour des cycles
 * disable()/enable()/refresh() (ex: le recalage forcé du scroll 150ms après le
 * "load" dans main.js), ce qui pouvait laisser le header bloqué dans le
 * mauvais état au chargement. En recalculant depuis le DOM, l'état se corrige
 * toujours tout seul, quel que soit l'ordre des callbacks.
 */

const { gsap, ScrollTrigger } = window;

export function initHeaderScroll() {
  const header = document.getElementById('masthead');

  if (!header || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return;
  }

  const darkSections = Array.from(document.querySelectorAll('.section_hero, .header-dark-section'));

  // On compare à la position réelle du header (son propre getBoundingClientRect),
  // pas à un y=0 supposé : quand la barre d'admin WordPress est affichée, elle
  // décale tout le contenu (donc le header ET les sections) de 32px (46px en
  // mobile) — comparer à 0 en dur détectait à tort « aucun recouvrement » dès
  // le haut de page.
  const isOverlappingHeader = (section) => {
    const headerRect = header.getBoundingClientRect();
    const rect = section.getBoundingClientRect();
    return rect.top <= headerRect.bottom && rect.bottom > headerRect.top;
  };

  const updateHeaderState = () => {
    // Au reload (voir handlePageLoadTransition() dans barba.js), le container
    // Barba qui enveloppe le hero peut avoir une hauteur nulle pendant une ou
    // deux frames, le temps que la mise en page soit prête. Une section sombre
    // à hauteur nulle donnerait à tort « aucun recouvrement » → header opaque,
    // avant de se corriger une fois la vraie mise en page mesurable. On ignore
    // ces mesures non fiables plutôt que d'agir dessus, ce qui laisse le
    // header sur son état par défaut (transparent) jusqu'à la 1re mesure
    // valide.
    const measurable = darkSections.filter((section) => section.getBoundingClientRect().height > 0);
    if (darkSections.length > 0 && measurable.length === 0) return;

    const overDarkSection = measurable.some(isOverlappingHeader);
    header.classList.toggle('header-scrolled', !overDarkSection);
  };

  // Recalcul à chaque frame de scroll plutôt que sur des passages de seuil par
  // section : avec plusieurs sections sombres sur une page, rien ne rappellerait
  // updateHeaderState() pendant la traversée d'une zone claire ENTRE deux
  // d'entre elles (ni l'une ni l'autre ne « toggle » à cet instant) — le header
  // garderait l'état calculé au dernier seuil franchi.
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

  // Nettoyage de l'instance précédente : initHeaderScroll() est rappelée après
  // chaque transition Barba, mais le header lui-même n'est jamais recréé — sans
  // ça, les listeners s'empileraient à chaque navigation.
  if (initHeaderScroll._cleanup) {
    initHeaderScroll._cleanup();
  }

  // Filet de sécurité : sur un chargement à froid, polices, images et scripts
  // CDN arrivent plus tard et décalent la mise en page à plusieurs reprises
  // avant qu'elle ne se stabilise. On revérifie donc à quelques moments-clé,
  // en plus des callbacks ScrollTrigger, pour raccourcir au maximum la fenêtre
  // pendant laquelle un mauvais calcul reste visible.
  const timeouts = [100, 300, 600, 1000, 1800].map((delay) => setTimeout(updateHeaderState, delay));
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

  // Pas d'appel synchrone immédiat ici : à cet instant, la hauteur réelle du
  // hero n'est pas encore fiable (images/polices pas chargées) et le calcul
  // pourrait conclure à tort « pas sur le hero », faisant apparaître le fond du
  // header un court instant avant que le 1er timeout ne corrige. Le HTML part
  // déjà dans le bon état par défaut (aucune classe = transparent).
}
