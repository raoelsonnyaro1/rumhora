/**
 * rs_scroll : scrollbar custom (piste + thumb) par-dessus Lenis.
 * Architecture reprise de FFScroll (thème fatfish, basé lui aussi sur Lenis) :
 * un conteneur .scrollbar (mix-blend-mode: exclusion, visible au survol ou
 * pendant le scroll) contenant .scrollbar__track (cliquable pour sauter à une
 * position) et .scrollbar__thumb (draggable). Lenis est initialisé séparément
 * (voir lenis.js) et passé ici en paramètre plutôt que ré-instancié.
 */

let elements = null;
let isDragging = false;
let isHovered = false;
let hideTimeout;

/**
 * Hauteur du thumb + course max (trackHeight - thumbHeight), recalculées à
 * chaque appel (viewport/document peuvent changer entre-temps).
 */
function getMetrics(lenis) {
  const viewportHeight = window.innerHeight;
  const trackHeight = viewportHeight;
  const documentHeight = viewportHeight + lenis.limit;
  // Hauteur du thumb proportionnelle à la portion de document visible, avec
  // un minimum pour rester attrapable/visible sur une longue page.
  const thumbHeight = Math.max((viewportHeight / documentHeight) * trackHeight, 30);
  const maxThumbTop = trackHeight - thumbHeight;
  return { thumbHeight, maxThumbTop };
}

/**
 * Une section pinnée (GSAP `pin: true`) consomme un long scroll sans que le
 * contenu ne se déplace visuellement : la scrollbar y avancerait alors que la
 * page semble immobile, ce qui laisse croire qu'elle ne répond plus. On la
 * masque donc tant qu'une telle section couvre le viewport.
 *
 * Marquage par classe .scrollbar-hide-section, à poser sur la section pinnée
 * côté markup — plutôt qu'un sélecteur codé en dur ici, qui lierait ce
 * composant à une page précise.
 */
function isOverPinnedSection() {
  return Array.from(document.querySelectorAll('.scrollbar-hide-section')).some((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
}

function showScrollbar() {
  if (!elements) return;

  if (isOverPinnedSection()) {
    clearTimeout(hideTimeout);
    elements.container.classList.remove('scrollbar--shown');
    return;
  }

  elements.container.classList.add('scrollbar--shown');
  clearTimeout(hideTimeout);
  // Reste affichée tant qu'on drag ou qu'on survole la zone, sinon se
  // refond après une courte pause (voir aussi le survol ci-dessous).
  if (isDragging || isHovered) return;
  hideTimeout = setTimeout(() => {
    elements.container.classList.remove('scrollbar--shown');
  }, 800);
}

function updateThumb(lenis) {
  if (!elements || isDragging) return;
  const { thumbHeight, maxThumbTop } = getMetrics(lenis);
  const thumbTop = lenis.progress * maxThumbTop;

  elements.thumb.style.height = `${thumbHeight}px`;
  elements.thumb.style.transform = `translateY(${thumbTop}px)`;
  showScrollbar();
}

/**
 * Initialise la scrollbar custom. À appeler une seule fois, après
 * initLenis() (voir main.js), avec l'instance Lenis en paramètre.
 * @param {import('lenis').default} lenis
 */
export function initRsScroll(lenis) {
  if (!lenis || elements) return;

  elements = { container: document.createElement('div') };
  elements.container.className = 'scrollbar';
  elements.container.innerHTML = `
    <div class="scrollbar__track"></div>
    <div class="scrollbar__thumb"></div>
  `;
  elements.track = elements.container.querySelector('.scrollbar__track');
  elements.thumb = elements.container.querySelector('.scrollbar__thumb');
  document.body.appendChild(elements.container);

  // Survol : affiche la scrollbar tant que le curseur reste dans la zone
  // (comme une vraie scrollbar), indépendamment du scroll actif.
  elements.container.addEventListener('pointerenter', () => {
    isHovered = true;
    showScrollbar();
  });
  elements.container.addEventListener('pointerleave', () => {
    isHovered = false;
    showScrollbar();
  });

  // Clic sur la piste (pas sur le thumb lui-même) : saute à cette position.
  elements.track.addEventListener('click', (e) => {
    if (e.target !== elements.track) return;
    const { maxThumbTop, thumbHeight } = getMetrics(lenis);
    const rect = elements.track.getBoundingClientRect();
    const clickY = e.clientY - rect.top - thumbHeight / 2;
    const progress = maxThumbTop > 0 ? Math.min(Math.max(clickY, 0), maxThumbTop) / maxThumbTop : 0;
    lenis.scrollTo(progress * lenis.limit, { duration: 0.6 });
  });

  // Drag du thumb.
  let dragStartY = 0;
  let dragStartThumbTop = 0;

  elements.thumb.addEventListener('pointerdown', (e) => {
    isDragging = true;
    elements.thumb.setPointerCapture(e.pointerId);
    elements.container.classList.add('scrollbar--is-dragging');
    document.body.classList.add('is-scrollbar-dragging');

    const { maxThumbTop } = getMetrics(lenis);
    dragStartY = e.clientY;
    dragStartThumbTop = lenis.progress * maxThumbTop;
    showScrollbar();
    e.preventDefault();
  });

  elements.thumb.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const { maxThumbTop } = getMetrics(lenis);
    const deltaY = e.clientY - dragStartY;
    const newThumbTop = Math.min(Math.max(dragStartThumbTop + deltaY, 0), maxThumbTop);
    const progress = maxThumbTop > 0 ? newThumbTop / maxThumbTop : 0;
    lenis.scrollTo(progress * lenis.limit, { immediate: true });
  });

  const endDrag = (e) => {
    if (!isDragging) return;
    isDragging = false;
    elements.thumb.releasePointerCapture(e.pointerId);
    elements.container.classList.remove('scrollbar--is-dragging');
    document.body.classList.remove('is-scrollbar-dragging');
    showScrollbar();
  };
  elements.thumb.addEventListener('pointerup', endDrag);
  elements.thumb.addEventListener('pointercancel', endDrag);

  lenis.on('scroll', () => updateThumb(lenis));
}
