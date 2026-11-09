<?php
/**
 * Navigation principale.
 *
 * @package rumhora
 */

/**
 * Items du menu principal tels que définis par la maquette.
 *
 * Sert de REPLI uniquement : dès qu'un menu est assigné à l'emplacement
 * « Principal » dans Apparence > Menus, c'est lui qui s'affiche et cette liste
 * n'est plus utilisée. Elle existe pour que le site soit correct dès
 * l'activation du thème, sans étape de configuration préalable — et pour que
 * `composer make-pot` collecte les libellés traduisibles.
 *
 * Les slugs d'URL sont volontairement en anglais : ce sont ceux de la
 * maquette, et la version française passera par les traductions de Polylang.
 *
 * @return array[] Liste de ['label' => string, 'path' => string]
 */
function rumhora_default_menu_items() {
	return array(
		array( 'label' => __( 'Story', 'rumhora' ), 'path' => '/story' ),
		array( 'label' => __( 'Menu', 'rumhora' ), 'path' => '/menu' ),
		array( 'label' => __( 'Events', 'rumhora' ), 'path' => '/events' ),
		array( 'label' => __( 'Privatisations', 'rumhora' ), 'path' => '/privatisations' ),
		array( 'label' => __( 'Gallery', 'rumhora' ), 'path' => '/gallery' ),
		array( 'label' => __( 'Contact', 'rumhora' ), 'path' => '/contact' ),
	);
}

/**
 * Marque le lien dont l'URL correspond à la page courante.
 *
 * Reproduit la classe que WordPress pose lui-même sur un vrai menu
 * (current-menu-item), pour que le repli et le menu réel partagent exactement
 * le même style d'état actif.
 *
 * @param string $path Chemin relatif de l'item (ex: '/menu').
 * @return bool
 */
function rumhora_is_current_menu_item( $path ) {
	// On compare des CHEMINS, pas des URLs : home_url() peut pointer vers un
	// sous-dossier, et REQUEST_URI l'inclut déjà — passer les deux par
	// wp_parse_url() les ramène sur la même base, avec ou sans sous-dossier.
	$request = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';

	// strtok() coupe la query string : ?utm_source=... ne doit pas empêcher un
	// item d'être reconnu comme la page courante.
	$current = untrailingslashit( (string) wp_parse_url( strtok( $request, '?' ), PHP_URL_PATH ) );
	$item    = untrailingslashit( (string) wp_parse_url( home_url( $path ), PHP_URL_PATH ) );

	return '' !== $item && $current === $item;
}

/**
 * Repli du menu principal : rend les items de la maquette sous la même
 * structure qu'un wp_nav_menu() (un <ul> de <li class="menu-item">), pour que
 * le CSS et le JS (updateCurrentMenuItem) s'appliquent indifféremment.
 *
 * @param array $args Arguments passés à wp_nav_menu().
 */
function rumhora_nav_menu_fallback( $args = array() ) {
	$args       = (array) $args;
	$menu_class = $args['menu_class'] ?? '';
	$link_class = $args['link_class'] ?? '';
	$li_class   = $args['add_li_class'] ?? '';

	echo '<ul class="' . esc_attr( $menu_class ) . '">';

	foreach ( rumhora_default_menu_items() as $item ) {
		$classes = trim( $li_class . ( rumhora_is_current_menu_item( $item['path'] ) ? ' current-menu-item' : '' ) );

		printf(
			'<li class="%1$s"><a href="%2$s" class="%3$s" data-barba>%4$s</a></li>',
			esc_attr( $classes ),
			esc_url( home_url( $item['path'] ) ),
			esc_attr( $link_class ),
			esc_html( $item['label'] )
		);
	}

	echo '</ul>';
}

/**
 * Navigation horizontale du header (desktop).
 *
 * @param string $extra_class Classes additionnelles sur le <ul>.
 */
function rumhora_primary_nav( $extra_class = '' ) {
	wp_nav_menu(
		array(
			'theme_location' => 'menu-1',
			'menu_id'        => 'primary-menu',
			'menu_class'     => trim( 'nav-menu flex items-center ' . $extra_class ),
			'container'      => false,
			'add_li_class'   => 'menu-item',
			'link_class'     => 'nav-link',
			'walker'         => new Rumhora_Mobile_Nav_Walker(),
			'fallback_cb'    => 'rumhora_nav_menu_fallback',
			'depth'          => 1,
		)
	);
}

/**
 * Items du menu du footer tels que définis par la maquette. Sélection plus
 * courte que le menu principal, et volontairement distincte : le footer met en
 * avant les pages de découverte, pas la navigation complète.
 *
 * @return array[]
 */
function rumhora_default_footer_items() {
	return array(
		array( 'label' => __( 'Menu', 'rumhora' ), 'path' => '/menu' ),
		array( 'label' => __( 'Events', 'rumhora' ), 'path' => '/events' ),
		array( 'label' => __( 'Chefs', 'rumhora' ), 'path' => '/chefs' ),
		array( 'label' => __( 'Gallery', 'rumhora' ), 'path' => '/gallery' ),
	);
}

/**
 * Liens légaux du bas de page. Trois pages sont obligatoires avant mise en
 * ligne (mentions légales, confidentialité, cookies) ; la maquette n'en montre
 * que deux, la troisième s'ajoutera depuis Apparence > Menus sans toucher au
 * code.
 *
 * @return array[]
 */
function rumhora_default_legal_items() {
	return array(
		array( 'label' => __( 'Privacy Policy', 'rumhora' ), 'path' => '/privacy-policy' ),
		array( 'label' => __( 'Legal Notice', 'rumhora' ), 'path' => '/legal-notice' ),
	);
}

/**
 * Repli générique : rend une liste d'items sous la même structure qu'un
 * wp_nav_menu(), pour que le CSS s'applique indifféremment.
 *
 * @param array[] $items      Liste de ['label' => string, 'path' => string].
 * @param array   $args       Arguments passés à wp_nav_menu().
 */
function rumhora_render_menu_fallback( $items, $args ) {
	$args       = (array) $args;
	$menu_class = $args['menu_class'] ?? '';
	$link_class = $args['link_class'] ?? '';
	$li_class   = $args['add_li_class'] ?? '';

	echo '<ul class="' . esc_attr( $menu_class ) . '">';

	foreach ( $items as $item ) {
		$classes = trim( $li_class . ( rumhora_is_current_menu_item( $item['path'] ) ? ' current-menu-item' : '' ) );

		printf(
			'<li class="%1$s"><a href="%2$s" class="%3$s" data-barba>%4$s</a></li>',
			esc_attr( $classes ),
			esc_url( home_url( $item['path'] ) ),
			esc_attr( $link_class ),
			esc_html( $item['label'] )
		);
	}

	echo '</ul>';
}

function rumhora_footer_menu_fallback( $args = array() ) {
	rumhora_render_menu_fallback( rumhora_default_footer_items(), $args );
}

function rumhora_legal_menu_fallback( $args = array() ) {
	rumhora_render_menu_fallback( rumhora_default_legal_items(), $args );
}

/**
 * Liens du footer (ligne horizontale sous l'accroche).
 */
function rumhora_footer_nav() {
	wp_nav_menu(
		array(
			'theme_location' => 'menu-footer',
			'menu_id'        => 'footer-menu',
			'menu_class'     => 'footer-menu flex flex-wrap items-center md:gap-8 gap-5',
			'container'      => false,
			'add_li_class'   => 'menu-item',
			'link_class'     => 'footer-menu-link',
			'walker'         => new Rumhora_Mobile_Nav_Walker(),
			'fallback_cb'    => 'rumhora_footer_menu_fallback',
			'depth'          => 1,
		)
	);
}

/**
 * Liens légaux du bas de page.
 */
function rumhora_legal_nav() {
	wp_nav_menu(
		array(
			'theme_location' => 'menu-legal',
			'menu_id'        => 'legal-menu',
			'menu_class'     => 'legal-menu flex flex-wrap items-center',
			'container'      => false,
			'add_li_class'   => 'menu-item',
			'link_class'     => 'legal-menu-link',
			'walker'         => new Rumhora_Mobile_Nav_Walker(),
			'fallback_cb'    => 'rumhora_legal_menu_fallback',
			'depth'          => 1,
		)
	);
}
