<?php
/**
 * En-tête du thème : <head>, masque de transition Barba, header fixe et
 * ouverture du container Barba.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package rumhora
 */

// Le site est intégralement sur fond sombre : le header est donc toujours en
// version claire (logo couleur, texte crème). Le champ ACF header_color
// permet de basculer en version sombre sur une éventuelle page à fond clair.
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

$rumhora_book_url = get_field( 'book_url', 'option' ) ?: home_url( '/book-a-table' );
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

	<?php
	// Préchargement des 2 polices variables : elles portent TOUT le rendu
	// typographique (titres Playfair, texte Montserrat) et sont découvertes
	// tardivement par le navigateur, qui doit d'abord télécharger puis parser
	// dist/styles.css pour connaître leurs @font-face. Sans preload, le texte
	// reste en police de repli pendant ce temps — d'autant plus visible que
	// SplitText mesure les lignes APRÈS chargement des polices (voir
	// initTextRevealAnimations), ce qui retarde d'autant les animations.
	foreach ( array( 'PlayfairDisplay/PlayfairDisplay-Variable', 'Montserrat/Montserrat-Variable' ) as $rumhora_font ) :
		?>
		<link rel="preload" as="font" type="font/woff2" crossorigin
			href="<?php echo esc_url( get_template_directory_uri() . '/assets/fonts/' . $rumhora_font . '.woff2' ); ?>">
		<?php
	endforeach;
	?>

	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div data-barba="wrapper">
	<!-- Rideau de transition Barba (voir leave()/enter() dans src/js/barba.js) :
	     EN DEHORS du container Barba pour persister entre les pages. z-index
	     entre le header fixe (z-50, couvert) et le menu mobile plein écran
	     (z-index:200, qui doit rester AU-DESSUS pour que son animation de
	     fermeture reste visible pendant une navigation lancée depuis le menu). -->
	<div id="page-transition-mask" class="media-reveal-overlay fixed inset-0 z-[100] pointer-events-none" aria-hidden="true">
		<div></div>
		<div></div>
		<div></div>
	</div>

	<!-- Header EN DEHORS du container Barba pour rester fixe d'une page à
	     l'autre. Les éléments dont le contenu/l'URL dépendent de la langue sont
	     resynchronisés par updatePersistentLayoutLinks() (src/js/barba.js). -->
	<header id="masthead" class="site-header fixed top-0 left-0 right-0 z-50 <?php echo esc_attr( $rumhora_header_class ); ?>">
		<div class="header-container flex items-center justify-between gap-6 xl:px-14 md:px-8 px-5 md:py-5 py-3">

			<!-- Logo. Pas de lazyload : le header est fixed, donc toujours dans le
			     viewport dès le chargement — un chargement différé n'aurait jamais
			     de sens ici. -->
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" data-barba class="site-logo flex-shrink-0">
				<img src="<?php echo esc_url( get_template_directory_uri() . '/img/logo-mark.png' ); ?>"
					alt="<?php bloginfo( 'name' ); ?>"
					width="214" height="246"
					fetchpriority="high">
			</a>

			<!-- Navigation desktop -->
			<nav id="site-navigation" class="site-nav hidden lg:block" aria-label="<?php esc_attr_e( 'Navigation principale', 'rumhora' ); ?>">
				<?php rumhora_primary_nav( 'xl:gap-9 gap-6' ); ?>
			</nav>

			<div class="header-actions flex items-center md:gap-5 gap-3 flex-shrink-0">
				<?php if ( $rumhora_lang_label && $rumhora_lang_url ) : ?>
					<a href="<?php echo esc_url( $rumhora_lang_url ); ?>" id="header-lang-toggle" class="lang-toggle hover-underline hidden md:inline-block"><?php echo esc_html( $rumhora_lang_label ); ?></a>
				<?php endif; ?>

				<a href="<?php echo esc_url( $rumhora_book_url ); ?>" id="header-book-btn" class="btn btn-pill" data-barba><?php esc_html_e( 'Book Table', 'rumhora' ); ?></a>

				<!-- Déclencheur du menu plein écran : visible uniquement là où la
				     nav horizontale ne tient plus (< lg). -->
				<button type="button" id="mobile-menu-button" class="menu-mobile-button lg:hidden" aria-controls="mobile-menu-overlay" aria-expanded="false">
					<span class="menu-mobile-button__bar" aria-hidden="true"></span>
					<span class="menu-mobile-button__bar" aria-hidden="true"></span>
					<span class="screen-reader-text"><?php esc_html_e( 'Ouvrir le menu', 'rumhora' ); ?></span>
				</button>
			</div>
		</div>
	</header><!-- #masthead -->

	<?php rs_mobile_menu(); ?>

	<div data-barba="container"
		data-barba-namespace="<?php echo esc_attr( rumhora_get_barba_namespace() ); ?>"
		data-header-color="<?php echo esc_attr( $rumhora_header_color ); ?>"
		data-lang-label="<?php echo esc_attr( $rumhora_lang_label ?? '' ); ?>"
		data-lang-url="<?php echo esc_attr( $rumhora_lang_url ?? '' ); ?>">
		<div id="page" class="site">
			<main class="site-main">
