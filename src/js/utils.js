/**
 * Utils Module
 * Fonctions utilitaires réutilisables
 */

import { scrollToTop } from './lenis.js';

/**
 * Ajoute automatiquement l'attribut data-barba aux liens internes
 */
export function addBarbaToLinks() {
  const links = document.querySelectorAll('a[href]');
  const currentDomain = window.location.hostname;
  let addedCount = 0;

  links.forEach(link => {
    const href = link.getAttribute('href');

    // Skip if already has barba attributes
    if (link.hasAttribute('data-barba') || link.hasAttribute('data-barba-prevent')) {
      return;
    }

    // Skip external links, anchors, special protocols
    if (href?.startsWith('http') && !href.includes(currentDomain)) return;
    if (href?.startsWith('#')) return;
    if (href?.startsWith('mailto:')) return;
    if (href?.startsWith('tel:')) return;
    if (href?.includes('/wp-admin')) return;
    if (href?.includes('/wp-login')) return;

    // Add data-barba to internal links
    if (href && (href.startsWith('/') || href.includes(currentDomain) || !href.includes('http'))) {
      link.setAttribute('data-barba', '');
      addedCount++;
    }
  });

}

/**
 * Met à jour l'élément de menu actif en fonction de l'URL actuelle
 */
export function updateCurrentMenuItem() {
  const currentUrl = window.location.pathname;
  const menuItems = document.querySelectorAll('#site-navigation .menu-item, #mobile-primary-menu .menu-item');

  menuItems.forEach(item => {
    const link = item.querySelector('a');
    if (link) {
      try {
        const linkUrl = new URL(link.href).pathname;

        // Remove trailing slashes for comparison
        const normalizedCurrentUrl = currentUrl.replace(/\/$/, '') || '/';
        const normalizedLinkUrl = linkUrl.replace(/\/$/, '') || '/';

        if (normalizedLinkUrl === normalizedCurrentUrl) {
          item.classList.add('current-menu-item');
        } else {
          item.classList.remove('current-menu-item', 'current_page_item');
        }
      } catch (e) {
        console.warn('Could not parse URL:', link.href);
      }
    }
  });

}

/**
 * Retour visuel immédiat au clic sur un lien du menu, avant même que Barba
 * n'ait fini de charger la page suivante : le lien cliqué passe en blanc/
 * opacité pleine, les autres liens de la même liste se dépriment à 0.4,
 * exactement comme au survol de la liste (voir .mobile-menu-list:hover dans
 * style.scss) — sans attendre updateCurrentMenuItem(), appelé seulement une
 * fois la nouvelle page chargée. Retire aussi le statut current-menu-item de
 * l'ancien lien actif immédiatement (voir clearPendingMenuActive() pour le
 * nettoyage une fois la transition terminée).
 */
export function setPendingMenuActive(trigger) {
  const link = trigger?.closest?.('.mobile-menu-link');
  const item = link?.closest?.('.mobile-menu-item');
  const list = link?.closest?.('.mobile-menu-list');
  if (!link || !item || !list) return;

  list.querySelectorAll('.mobile-menu-item').forEach(li => {
    li.classList.remove('is-navigating-active', 'current-menu-item', 'current_page_item');
  });
  item.classList.add('is-navigating-active');
  list.classList.add('is-navigating');
}

/**
 * Nettoie l'état posé par setPendingMenuActive() une fois la transition
 * terminée, pour revenir au survol CSS pur et au vrai current-menu-item de
 * la nouvelle page (recalculé juste avant par updateCurrentMenuItem()).
 */
export function clearPendingMenuActive() {
  document.querySelectorAll('.mobile-menu-list.is-navigating').forEach(list => {
    list.classList.remove('is-navigating');
    list.querySelectorAll('.is-navigating-active').forEach(li => li.classList.remove('is-navigating-active'));
  });
}

/**
 * Configure la gestion du scroll restoration
 */
export function configureScrollRestoration() {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
}

/**
 * Force le scroll en haut de la page
 */
export function forceScrollToTop() {
  window.scrollTo(0, 0);
}

/**
 * Un lien du menu footer (.footer-menu-link, voir footer.php) qui pointe vers
 * la page actuelle (déjà dessus) : au lieu de laisser Barba lancer un cycle
 * complet (leave/enter) pour "revenir" sur la même page, on remonte juste en
 * haut de la page (comme demandé : "juste faire remonter"), via Lenis pour
 * rester cohérent avec le reste du site (voir scrollToTop() dans lenis.js).
 *
 * Le footer est hors du conteneur data-barba (voir footer.php), donc il
 * n'est jamais remplacé par Barba : un seul appel au chargement initial
 * suffit, pas besoin de réinitialiser après chaque transition. La
 * comparaison d'URL est faite au moment du clic (pathname courant relu à
 * chaque fois), donc elle reste juste même après une navigation Barba.
 */
export function initFooterMenuSamePageScroll() {
  const footerLinks = document.querySelectorAll('.footer-menu-link');

  footerLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      let linkUrl;
      try {
        linkUrl = new URL(link.href, window.location.href);
      } catch (err) {
        return;
      }

      if (linkUrl.origin !== window.location.origin || linkUrl.hash) {
        return;
      }

      const normalizedLink = linkUrl.pathname.replace(/\/$/, '') || '/';
      const normalizedCurrent = window.location.pathname.replace(/\/$/, '') || '/';

      if (normalizedLink === normalizedCurrent) {
        e.preventDefault();
        scrollToTop();
      }
    });
  });
}

/**
 * Empêche la saisie de caractères non numériques dans les champs
 * input[type="number"] (compteurs entiers : adultes, enfants...) et
 * input[type="tel"] (numéro de téléphone, chiffres + ponctuation courante)
 * des formulaires .reservation-form. Écoute déléguée sur document :
 * fonctionne aussi pour les champs ajoutés après une transition Barba, pas
 * besoin de réinitialiser.
 *
 * Pour input[type="number"], filtrer uniquement sur l'événement "input" ne
 * suffit pas : tant que le texte tapé ne forme pas un nombre valide (ex:
 * "1e" avant d'ajouter d'autres chiffres), le navigateur renvoie value=""
 * (état "bad input"), donc il n'y a rien à nettoyer et le "e" reste affiché.
 * On bloque donc directement les touches interdites au clavier (e, E, +, -),
 * en plus du filtrage sur "input" qui couvre le collage.
 */
export function initNumericFieldSanitization() {
  document.addEventListener('keydown', (event) => {
    const target = event.target;
    if (!target.matches || !target.matches('.reservation-form input[type="number"]')) {
      return;
    }
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  });

  document.addEventListener('input', (event) => {
    const target = event.target;
    if (!target.matches) return;

    if (target.matches('.reservation-form input[type="number"]')) {
      const sanitized = target.value.replace(/[^\d]/g, '');
      if (sanitized !== target.value) {
        target.value = sanitized;
      }
      return;
    }

    if (target.matches('.reservation-form input[type="tel"]')) {
      const sanitized = target.value.replace(/[^\d+\s().-]/g, '');
      if (sanitized !== target.value) {
        target.value = sanitized;
      }
    }
  });
}
