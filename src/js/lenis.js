/**
 * Lenis Smooth Scroll Module
 * Gère l'initialisation et la configuration du smooth scroll
 */

import Lenis from 'lenis';

let lenis;

/**
 * Initialise Lenis smooth scroll
 * @returns {Lenis} Instance de Lenis
 */
export function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  // Force scroll to top immediately after Lenis initialization
  lenis.scrollTo(0, { immediate: true });

  // Connect Lenis with GSAP ScrollTrigger
  const { gsap, ScrollTrigger } = window;

  if (gsap && ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  return lenis;
}

/**
 * Obtient l'instance de Lenis
 * @returns {Lenis|null} Instance de Lenis ou null
 */
export function getLenis() {
  return lenis;
}

/**
 * Scroll vers le haut avec Lenis
 */
export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0, {
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    });
  }
}

/**
 * Initialise le bouton de scroll vers le haut
 */
export function initScrollToTop() {
  const scrollToTopBtn = document.querySelector('.scroll-to-top');

  if (scrollToTopBtn && lenis) {
    // Remove any existing listener to avoid duplicates
    const newBtn = scrollToTopBtn.cloneNode(true);
    scrollToTopBtn.parentNode.replaceChild(newBtn, scrollToTopBtn);

    // Add fresh event listener
    newBtn.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToTop();
    });
  }
}
