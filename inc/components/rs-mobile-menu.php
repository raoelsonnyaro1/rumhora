<?php
/**
 * Overlay du menu mobile (plein écran) : logo + image, nav principale et
 * bouton de fermeture. Ouvert/fermé via #mobile-menu-button /
 * #mobile-menu-close (voir js/navigation.js).
 *
 * L'image d'illustration vient de Options du Thème > Menu (champ ACF
 * menu_image) ; sans image, la colonne reste simplement vide — elle est de
 * toute façon masquée sous 768px.
 *
 * Usage : rs_mobile_menu(); (dans header.php, à l'intérieur de <header>)
 */
function rs_mobile_menu() {
	$menu_image = get_field( 'menu_image', 'option' );
	if ( is_array( $menu_image ) ) {
		$menu_image = $menu_image['url'] ?? '';
	}
	?>
	<div id="mobile-menu-overlay" class="mobile-menu-overlay">
		<!-- EN DEHORS de .mobile-menu-image (masquée en display:none sous 768px,
		     voir style.scss) : sinon le logo, enfant, disparaîtrait avec elle. En
		     position:absolute par rapport à cet overlay (position:fixed, qui sert
		     de bloc de positionnement), il reste visible à toutes tailles.
		     Pas de lazyload (même logo que le header) : cette image est
		     potentiellement visible dès l'ouverture du menu, un chargement
		     différé la ferait apparaître avec un délai visible. -->
		<a href="<?php echo esc_url( home_url() ); ?>" rel="home" data-barba class="mobile-menu-logo">
			<img src="<?php echo esc_url( get_template_directory_uri() . '/img/logo.svg' ); ?>" alt="<?php bloginfo( 'name' ); ?>">
		</a>

		<div class="mobile-menu-image">
			<?php if ( $menu_image ) : ?>
				<img class="lazyload" data-src="<?php echo esc_url( $menu_image ); ?>" alt="">
			<?php endif; ?>
		</div>

		<div class="mobile-menu-content">
			<button id="mobile-menu-close" class="mobile-menu-close btn btn-tertiary" aria-label="<?php esc_attr_e( 'Fermer le menu', 'rumhora' ); ?>">
				<?php esc_html_e( 'Fermer', 'rumhora' ); ?>
			</button>

			<nav class="mobile-menu-nav">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'menu-1',
						'menu_id'        => 'mobile-primary-menu',
						'menu_class'     => 'mobile-menu-list',
						'container'      => false,
						'add_li_class'   => 'mobile-menu-item',
						'link_class'     => 'mobile-menu-link hover-underline',
						'walker'         => new Rumhora_Mobile_Nav_Walker(),
						'fallback_cb'    => false,
					)
				);
				?>
			</nav>
		</div>
	</div>
	<?php
}
