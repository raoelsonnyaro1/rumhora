<?php
/**
 * En-tête du thème : <head>, masque de transition Barba, header fixe et
 * ouverture du container Barba.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package rumhora
 */

// Couleur du logo/de la nav quand le header n'est PAS au-dessus d'une section
// sombre. Champ ACF header_color (voir acf-json/) ; 'white' par défaut, le cas
// d'un hero photo plein écran.
$rumhora_header_color = get_field( 'header_color' ) ?: 'white';
$rumhora_header_class = ( 'black' === $rumhora_header_color ) ? 'header-black' : 'header-white';

// Bascule vers l'autre langue (site bilingue FR/EN). Le lien affiché est celui
// de la langue à PROPOSER, pas la langue courante (ex: sur le site en
// français, affiche "En" vers la version anglaise). Compatible WPML ET
// Polylang : les deux exposent le filtre wpml_active_languages (Polylang via
// sa couche de compatibilité). N'affiche rien si aucun des deux n'est actif
// (ex: environnement local sans plugin) plutôt que de fabriquer un faux lien.
$rumhora_lang_label = null;
$rumhora_lang_url   = null;
if ( has_filter( 'wpml_active_languages' ) ) {
	$rumhora_current_lang = apply_filters( 'wpml_current_language', null );
	$rumhora_languages    = apply_filters( 'wpml_active_languages', null, array( 'skip_missing' => 0 ) );
	if ( is_array( $rumhora_languages ) ) {
		foreach ( $rumhora_languages as $rumhora_lang_code => $rumhora_lang_data ) {
			if ( $rumhora_lang_code !== $rumhora_current_lang ) {
				// $rumhora_lang_code peut être une variante régionale (ex:
				// "en-us") selon la configuration : on ne garde que le code
				// langue ISO 639-1 pour l'affichage ("En", pas "En-us").
				$rumhora_lang_label = ucfirst( strtok( $rumhora_lang_code, '-' ) );
				$rumhora_lang_url   = $rumhora_lang_data['url'];
				break;
			}
		}
	}
}
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<script>
	// Doit s'exécuter le plus tôt possible (avant le <body>, avant dist/main.js
	// qui est en footer) : sur un F5, le navigateur peut restaurer nativement la
	// position de scroll dès qu'il y a du contenu scrollable, bien avant qu'un
	// script de footer ne s'exécute — d'où le "flash" vers la section précédente
	// puis le retour en haut fait plus tard par main.js. Régler scrollRestoration
	// ici empêche le navigateur de tenter cette restauration dès le départ.
	if ('scrollRestoration' in history) {
		history.scrollRestoration = 'manual';
	}
	</script>
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<link rel="icon" type="image/svg+xml" href="<?php echo esc_url( get_template_directory_uri() . '/img/favicon.svg' ); ?>">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div data-barba="wrapper">
	<!-- Rideau de transition Barba (voir leave()/enter() dans src/js/barba.js) :
	     EN DEHORS du container Barba pour persister entre les pages. z-index
	     entre le header fixe (z-50, couvert) et le menu mobile plein écran
	     (z-index:200, qui doit rester AU-DESSUS pour que son animation de
	     fermeture reste visible pendant une navigation lancée depuis le menu).
	     3 couches (voir .media-reveal-overlay) qui glissent ensemble de haut en
	     bas avec un léger décalage entre elles, pour un effet "3 bandes". -->
	<div id="page-transition-mask" class="media-reveal-overlay fixed inset-0 z-[100] pointer-events-none" aria-hidden="true">
		<div></div>
		<div></div>
		<div></div>
	</div>

	<!-- Header EN DEHORS du container Barba pour rester fixe d'une page à
	     l'autre. Les éléments dont le contenu/l'URL dépendent de la langue sont
	     resynchronisés par updatePersistentLayoutLinks() (src/js/barba.js). -->
	<header id="masthead" class="fixed top-0 left-0 right-0 text-white z-50 <?php echo esc_attr( $rumhora_header_class ); ?>">
		<div class="header-container mx-auto md:px-5 px-[10px] md:pt-5 pt-[10px] relative">

			<!-- Logomark seul, centré dans la barre : masqué tant qu'on est sur le
			     hero (voir .header-away-from-hero dans assets/sass/style.scss),
			     remplace le logo complet partout ailleurs. Pas de lazyload : le
			     header est fixed, donc toujours dans le viewport. -->
			<a href="<?php echo esc_url( home_url() ); ?>" rel="home" data-barba class="header-logo-center" aria-label="<?php bloginfo( 'name' ); ?>">
				<img src="<?php echo esc_url( get_template_directory_uri() . '/img/logo-icon.svg' ); ?>" alt="" aria-hidden="true">
				<img src="<?php echo esc_url( get_template_directory_uri() . '/img/logo-icon-dark.svg' ); ?>" alt="" aria-hidden="true" class="header-logo-center-scrolled">
			</a>

			<div class="logo-container w-full flex items-center justify-between">
				<a href="<?php echo esc_url( home_url() ); ?>" rel="home" data-barba class="custom-logo-link">
					<img src="<?php echo esc_url( get_template_directory_uri() . '/img/logo.svg' ); ?>" alt="<?php bloginfo( 'name' ); ?>" fetchpriority="high">
				</a>

				<div class="menu-container flex items-center gap-4">
					<?php if ( $rumhora_lang_label && $rumhora_lang_url ) : ?>
						<a href="<?php echo esc_url( $rumhora_lang_url ); ?>" id="header-lang-toggle" class="hidden md:inline-block lang-toggle hover-underline"><?php echo esc_html( $rumhora_lang_label ); ?></a>
					<?php endif; ?>

					<!-- CTA réservation persistant. btn-tertiary en dur : c'est l'état
					     correct sur un hero sombre, au tout premier paint ; header.js
					     bascule ensuite vers btn-primary dès que le header quitte une
					     section sombre. -->
					<a href="<?php echo esc_url( home_url( '/book-a-table' ) ); ?>" id="header-book-btn" class="hidden md:inline-block btn btn-tertiary" data-barba><?php esc_html_e( 'Book a table', 'rumhora' ); ?></a>

					<a id="mobile-menu-button" class="menu-mobile-button btn btn-tertiary"><?php esc_html_e( 'Menu', 'rumhora' ); ?></a>
				</div>
			</div>

			<?php rs_mobile_menu(); ?>
		</div>
	</header><!-- #masthead -->

	<div data-barba="container"
		data-barba-namespace="<?php echo esc_attr( rumhora_get_barba_namespace() ); ?>"
		data-header-color="<?php echo esc_attr( $rumhora_header_color ); ?>"
		data-lang-label="<?php echo esc_attr( $rumhora_lang_label ?? '' ); ?>"
		data-lang-url="<?php echo esc_attr( $rumhora_lang_url ?? '' ); ?>">
		<div id="page" class="site">
			<main class="site-main">
