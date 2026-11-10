<?php
/**
 * Overlay du menu plein écran, affiché sous le breakpoint `lg` (au-delà, la
 * navigation horizontale du header prend le relais). Ouvert/fermé via
 * #mobile-menu-button / #mobile-menu-close (voir js/navigation.js).
 *
 * Appelé depuis header.php mais volontairement EN DEHORS du <header> : il est
 * lui-même position:fixed et doit passer AU-DESSUS du header (z-index 200 vs
 * 50) ; l'imbriquer dans un parent déjà positionné créerait un contexte
 * d'empilement qui l'y enfermerait.
 *
 * L'image d'illustration vient de Options du Thème > Header & menu (champ ACF
 * menu_image) ; sans image, la colonne reste vide — elle est de toute façon
 * masquée sous 768px.
 *
 * Usage : rs_mobile_menu();
 */
function rs_mobile_menu() {
	$menu_image = get_field( 'menu_image', 'option' );
	if ( is_array( $menu_image ) ) {
		$menu_image = $menu_image['url'] ?? '';
	}

	$book_url = get_field( 'book_url', 'option' ) ?: home_url( '/book-a-table' );
	?>
	<div id="mobile-menu-overlay" class="mobile-menu-overlay" aria-hidden="true">

		<!-- EN DEHORS de .mobile-menu-image (masquée en display:none sous 768px) :
		     sinon le logo, enfant, disparaîtrait avec elle. En position:absolute
		     par rapport à cet overlay (position:fixed, qui sert de bloc de
		     positionnement), il reste visible à toutes tailles. -->
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" data-barba class="mobile-menu-logo">
			<img src="<?php echo esc_url( get_template_directory_uri() . '/img/logo-mark.png' ); ?>" alt="<?php bloginfo( 'name' ); ?>" width="214" height="246">
		</a>

		<div class="mobile-menu-image">
			<?php if ( $menu_image ) : ?>
				<img class="lazyload" data-src="<?php echo esc_url( $menu_image ); ?>" alt="">
			<?php endif; ?>
		</div>

		<div class="mobile-menu-content">
			<button type="button" id="mobile-menu-close" class="mobile-menu-close" aria-label="<?php esc_attr_e( 'Fermer le menu', 'rumhora' ); ?>">
				<span aria-hidden="true">&times;</span>
			</button>

			<nav class="mobile-menu-nav" aria-label="<?php esc_attr_e( 'Navigation principale', 'rumhora' ); ?>">
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
						'fallback_cb'    => 'rumhora_nav_menu_fallback',
						'depth'          => 1,
					)
				);
				?>
			</nav>

			<a href="<?php echo esc_url( $book_url ); ?>" class="btn-pill mobile-menu-cta" data-barba>
				<?php rs_slide_label( __( 'Book Table', 'rumhora' ) ); ?>
			</a>
		</div>
	</div>
	<?php
}
