/**
 * File navigation.js.
 *
 * Handles toggling the navigation menu for small screens and enables TAB key
 * navigation support for dropdown menus.
 */
( function() {
	const siteNavigation = document.getElementById( 'site-navigation' );

	// Return early if the navigation doesn't exist.
	if ( ! siteNavigation ) {
		return;
	}

	const button = siteNavigation.getElementsByTagName( 'button' )[ 0 ];

	// Return early if the button doesn't exist.
	if ( 'undefined' === typeof button ) {
		return;
	}

	const menu = siteNavigation.getElementsByTagName( 'ul' )[ 0 ];

	// Hide menu toggle button if menu is empty and return early.
	if ( 'undefined' === typeof menu ) {
		button.style.display = 'none';
		return;
	}

	if ( ! menu.classList.contains( 'nav-menu' ) ) {
		menu.classList.add( 'nav-menu' );
	}

	// Toggle the .toggled class and the aria-expanded value each time the button is clicked.
	button.addEventListener( 'click', function() {
		siteNavigation.classList.toggle( 'toggled' );

		if ( button.getAttribute( 'aria-expanded' ) === 'true' ) {
			button.setAttribute( 'aria-expanded', 'false' );
		} else {
			button.setAttribute( 'aria-expanded', 'true' );
		}
	} );

	// Remove the .toggled class and set aria-expanded to false when the user clicks outside the navigation.
	document.addEventListener( 'click', function( event ) {
		const isClickInside = siteNavigation.contains( event.target );

		if ( ! isClickInside ) {
			siteNavigation.classList.remove( 'toggled' );
			button.setAttribute( 'aria-expanded', 'false' );
		}
	} );

	// Get all the link elements within the menu.
	const links = menu.getElementsByTagName( 'a' );

	// Get all the link elements with children within the menu.
	const linksWithChildren = menu.querySelectorAll( '.menu-item-has-children > a, .page_item_has_children > a' );

	// Toggle focus each time a menu link is focused or blurred.
	for ( const link of links ) {
		link.addEventListener( 'focus', toggleFocus, true );
		link.addEventListener( 'blur', toggleFocus, true );
	}

	// Toggle focus each time a menu link with children receive a touch event.
	for ( const link of linksWithChildren ) {
		link.addEventListener( 'touchstart', toggleFocus, false );
	}

	/**
	 * Sets or removes .focus class on an element.
	 */
	function toggleFocus() {
		if ( event.type === 'focus' || event.type === 'blur' ) {
			let self = this;
			// Move up through the ancestors of the current link until we hit .nav-menu.
			while ( ! self.classList.contains( 'nav-menu' ) ) {
				// On li elements toggle the class .focus.
				if ( 'li' === self.tagName.toLowerCase() ) {
					self.classList.toggle( 'focus' );
				}
				self = self.parentNode;
			}
		}

		if ( event.type === 'touchstart' ) {
			const menuItem = this.parentNode;
			event.preventDefault();
			for ( const link of menuItem.parentNode.children ) {
				if ( menuItem !== link ) {
					link.classList.remove( 'focus' );
				}
			}
			menuItem.classList.toggle( 'focus' );
		}
	}
}() );

/**
 * Mobile Menu Slide Toggle with Text Reveal Animation
 */
(function() {
	function initMobileMenu() {
		const menuButton = document.querySelector('.menu-mobile-button');
		const menuOverlay = document.getElementById('mobile-menu-overlay');
		const menuClose = document.getElementById('mobile-menu-close');
		let isAnimating = false;

		if (!menuButton || !menuOverlay) {
			return;
		}

		/**
		 * Synchronise l'état accessible du menu. aria-hidden sur l'overlay ET
		 * aria-expanded sur le bouton : sans aria-hidden, les liens du menu
		 * restent annoncés par les lecteurs d'écran alors qu'ils sont
		 * visuellement masqués (visibility:hidden ne suffit pas toujours selon
		 * la combinaison navigateur/lecteur).
		 */
		function setMenuExpanded(expanded) {
			menuButton.setAttribute('aria-expanded', String(expanded));
			menuOverlay.setAttribute('aria-hidden', String(!expanded));
		}

		// Fonction pour animer l'ouverture du menu
		function openMenu() {
			if (isAnimating) return;
			isAnimating = true;

			const menuImage = menuOverlay.querySelector('.mobile-menu-image');
			const menuContent = menuOverlay.querySelector('.mobile-menu-content');
			const menuLogo = menuOverlay.querySelector('.mobile-menu-logo');
			// Requête à chaque ouverture (pas une liste mise en cache au chargement
			// de la page) : .mobile-menu-nav est remplacé en bloc par Barba à
			// chaque transition (voir updatePersistentLayoutLinks() dans barba.js,
			// menu potentiellement différent par langue) - une liste figée au tout
			// premier chargement pointerait vers des nœuds retirés du DOM dès la
			// 1re navigation, et l'animation n'aurait plus aucun effet visible.
			const menuLinks = Array.from(menuOverlay.querySelectorAll('.mobile-menu-link'));

			document.body.style.overflow = 'hidden';
			menuOverlay.classList.add('active');
			// État exposé aux technologies d'assistance : le bouton burger reste
			// dans le DOM pendant que l'overlay est ouvert, c'est donc lui qui
			// porte aria-expanded (et aria-controls, voir header.php).
			setMenuExpanded(true);

			if (typeof gsap !== 'undefined') {
				// Les 2 colonnes glissent verticalement, colonne droite avec léger delay
				gsap.set([menuImage, menuContent].filter(Boolean), { yPercent: -100 });
				if (menuImage) gsap.to(menuImage, { yPercent: 0, duration: 0.9, ease: 'power3.out' });
				if (menuContent) gsap.to(menuContent, { yPercent: 0, duration: 0.9, ease: 'power3.out', delay: 0.05 });

				// Le logo (superposé en absolute sur la colonne image) glisse du bas
				// vers le haut, comme les liens du menu - plutôt que de simplement
				// suivre le slide de la colonne.
				if (menuLogo) {
					gsap.set(menuLogo, { yPercent: 100, opacity: 0 });
					gsap.to(menuLogo, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.35 });
				}

				// Liens apparaissent après
				if (menuLinks.length > 0) {
					gsap.set(menuLinks, { yPercent: 100, opacity: 0 });
					gsap.to(menuLinks, {
						yPercent: 0,
						opacity: 1,
						duration: 0.8,
						stagger: 0.08,
						ease: 'power3.out',
						delay: 0.45,
						// Une fois entré, on retire l'opacity inline pour laisser le CSS
						// reprendre la main (opacity 0.4 par défaut, 1 au hover/actif) -
						// sinon l'opacity:1 posée par GSAP reste et prime sur le CSS.
						clearProps: 'opacity',
						onComplete: () => { isAnimating = false; }
					});
				} else {
					isAnimating = false;
				}
			} else {
				isAnimating = false;
			}
		}

		// Fonction pour animer la fermeture du menu
		function closeMenu() {
			if (isAnimating) return;
			isAnimating = true;

			// Enlever le overflow immédiatement
			document.body.style.overflow = '';

			const menuImage = menuOverlay.querySelector('.mobile-menu-image');
			const menuContent = menuOverlay.querySelector('.mobile-menu-content');
			const menuLogo = menuOverlay.querySelector('.mobile-menu-logo');
			// Même raison que dans openMenu() ci-dessus : requête à chaque
			// fermeture, pas une liste mise en cache au chargement de la page.
			const menuLinks = Array.from(menuOverlay.querySelectorAll('.mobile-menu-link'));

			if (typeof gsap !== 'undefined') {
				// Liens sortent en premier
				if (menuLinks.length > 0) {
					gsap.to(menuLinks, { yPercent: -100, opacity: 0, duration: 0.4, stagger: 0.04, ease: 'power3.in' });
				}

				if (menuLogo) gsap.to(menuLogo, { yPercent: -100, opacity: 0, duration: 0.4, ease: 'power3.in' });

				// Colonne droite remonte en premier, puis colonne gauche
				if (menuContent) gsap.to(menuContent, { yPercent: -100, duration: 0.7, ease: 'power3.in', delay: 0.05 });
				if (menuImage) {
					gsap.to(menuImage, {
						yPercent: -100,
						duration: 0.7,
						ease: 'power3.in',
						delay: 0.1,
						onComplete: () => {
							menuOverlay.classList.remove('active');
							setMenuExpanded(false);
							gsap.set([menuImage, menuContent, menuLogo].filter(Boolean), { yPercent: 0 });
							isAnimating = false;
							window.dispatchEvent(new Event('menuClosed'));
						}
					});
				} else {
					gsap.delayedCall(0.8, () => {
						menuOverlay.classList.remove('active');
						setMenuExpanded(false);
						isAnimating = false;
						window.dispatchEvent(new Event('menuClosed'));
					});
				}
			} else {
				menuOverlay.classList.remove('active');
				setMenuExpanded(false);
				isAnimating = false;
				window.dispatchEvent(new Event('menuClosed'));
			}
		}

		// Open menu
		menuButton.addEventListener('click', function(e) {
			e.preventDefault();
			openMenu();
		});

		// Close menu - close button
		if (menuClose) {
			menuClose.addEventListener('click', function(e) {
				e.preventDefault();
				closeMenu();
			});
		}

		// Close menu - click on overlay (outside menu content)
		menuOverlay.addEventListener('click', function(e) {
			if (e.target === menuOverlay) {
				closeMenu();
			}
		});

		// Clic sur un lien du menu : la fermeture (slide up) n'est PAS déclenchée
		// ici. C'est barba.js qui l'appelle (via window.rumhoraCloseMobileMenu, plus
		// bas) une fois la page suivante prête - le menu reste ouvert et visible
		// pendant le chargement, et ne remonte qu'à ce moment-là.

		// Exception : un lien qui pointe vers la page actuelle (déjà dessus).
		// Il n'y a rien à naviguer/attendre dans ce cas - Barba lancerait quand
		// même un cycle complet (leave/enter) pour "revenir" sur la même page,
		// visible comme un rechargement inutile. On ferme directement le menu
		// à la place, sans passer par Barba.
		// Délégué sur menuOverlay (pas un listener par lien) : .mobile-menu-nav
		// est remplacé en bloc par Barba à chaque transition (voir openMenu()
		// plus haut, même raison) - des listeners posés une fois sur les liens
		// d'origine ne suivraient pas les nouveaux liens injectés après coup.
		menuOverlay.addEventListener('click', function(e) {
			const link = e.target.closest('.mobile-menu-link');
			if (!link) return;

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
				closeMenu();
			}
		});

		// Expose une fermeture animée "attendable" pour barba.js : résout une
		// fois l'animation de fermeture terminée (évènement 'menuClosed'
		// dispatché par closeMenu() ci-dessus), ou immédiatement si le menu
		// n'est de toute façon pas ouvert.
		window.rumhoraCloseMobileMenu = function() {
			return new Promise(function(resolve) {
				if (!menuOverlay.classList.contains('active')) {
					resolve();
					return;
				}
				window.addEventListener('menuClosed', resolve, { once: true });
				closeMenu();
			});
		};

		// Close menu with ESC key
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
				closeMenu();
			}
		});
	}

	// Initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', initMobileMenu);
	} else {
		initMobileMenu();
	}
})();
