<?php
/**
 * Rumhora functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package rumhora
 */

if ( ! defined( 'RUMHORA_VERSION' ) ) {
	// À incrémenter à chaque release du thème.
	define( 'RUMHORA_VERSION', '1.0.0' );
}

/**
 * Sets up theme defaults and registers support for various WordPress features.
 */
function rumhora_setup() {
	load_theme_textdomain( 'rumhora', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );

	// Trois emplacements, gérés indépendamment depuis Apparence > Menus. Chacun
	// a un repli codé dans inc/nav-menu.php : tant qu'aucun menu n'est assigné,
	// ce sont les entrées de la maquette qui s'affichent, et le site est donc
	// correct dès l'activation du thème.
	register_nav_menus(
		array(
			'menu-1'      => esc_html__( 'Principal (header + menu plein écran)', 'rumhora' ),
			'menu-footer' => esc_html__( 'Footer', 'rumhora' ),
			'menu-legal'  => esc_html__( 'Mentions légales (bas de page)', 'rumhora' ),
		)
	);

	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	add_theme_support( 'customize-selective-refresh-widgets' );

	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);
}
add_action( 'after_setup_theme', 'rumhora_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 */
function rumhora_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'rumhora_content_width', 640 );
}
add_action( 'after_setup_theme', 'rumhora_content_width', 0 );

/**
 * Register widget area.
 */
function rumhora_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'rumhora' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'rumhora' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'rumhora_widgets_init' );

/**
 * Namespace Barba.js de la page courante (voir data-barba-namespace dans
 * header.php). Déduit automatiquement du template personnalisé, sinon du slug
 * de la page, sinon du type de page WordPress.
 */
function rumhora_get_barba_namespace() {
	$template = get_page_template_slug();

	if ( $template ) {
		// page-menus.php → menus
		$namespace = preg_replace( '/^page-(.+)\.php$/', '$1', basename( $template ) );

		if ( $namespace && $namespace !== basename( $template ) ) {
			return sanitize_title( $namespace );
		}
	}

	$post = get_post();
	if ( $post && $post->post_name ) {
		return sanitize_title( $post->post_name );
	}

	if ( is_front_page() ) return 'home';
	if ( is_404() ) return 'error-404';
	if ( is_search() ) return 'search';
	if ( is_archive() ) return 'archive';
	if ( is_single() ) return 'post';
	if ( is_page() ) return 'page';

	return 'default';
}

/**
 * Enqueue des assets du thème : CSS compilée, librairies CDN (GSAP, Barba,
 * Swiper, Flatpickr, lazysizes) puis le bundle JS.
 *
 * Priorité 5 pour passer avant rumhora_scripts() (priorité 10) : les handles
 * déclarés ici servent de dépendances là-bas.
 */
function rumhora_enqueue_scripts() {
	$dist = get_template_directory() . '/dist';

	// CSS compilée (assets/sass → dist/styles.css, voir package.json).
	// file_exists : au tout premier clone, dist/ est vide jusqu'au premier
	// `npm run build` — filemtime() sur un fichier absent lève un warning PHP
	// qui casse l'affichage de la page.
	if ( file_exists( $dist . '/styles.css' ) ) {
		wp_enqueue_style(
			'rumhora-styles',
			get_template_directory_uri() . '/dist/styles.css',
			array(),
			filemtime( $dist . '/styles.css' )
		);
	}

	// GSAP + plugins
	wp_enqueue_script( 'rumhora-gsap', 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js', array(), null, true );
	wp_enqueue_script( 'rumhora-scrolltrigger', 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js', array( 'rumhora-gsap' ), null, true );
	wp_enqueue_script( 'rumhora-splittext', 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js', array( 'rumhora-gsap' ), null, true );

	// Barba.js (transitions de page)
	wp_enqueue_script( 'rumhora-barba', 'https://cdn.jsdelivr.net/npm/@barba/core@2.9.7/dist/barba.umd.js', array(), '2.9.7', true );

	// Swiper (rs_galerie, rs_carousel)
	wp_enqueue_style( 'rumhora-swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css', array(), '11' );
	wp_enqueue_script( 'rumhora-swiper', 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', array(), '11', true );

	// Flatpickr (rs_form_field types "date"/"time")
	wp_enqueue_style( 'rumhora-flatpickr', 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css', array(), '4.6.13' );
	wp_enqueue_script( 'rumhora-flatpickr', 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js', array(), '4.6.13', true );
	wp_enqueue_script( 'rumhora-flatpickr-fr', 'https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/l10n/fr.js', array( 'rumhora-flatpickr' ), '4.6.13', true );

	// Lazysizes (class="lazyload" + data-src, utilisé par tous les composants)
	wp_enqueue_script( 'rumhora-lazysizes', 'https://cdn.jsdelivr.net/npm/lazysizes@5.3.2/lazysizes.min.js', array(), '5.3.2', true );

	// expand : distance (px) avant l'entrée dans le viewport à laquelle une
	// image commence déjà à charger. Doit être défini AVANT l'exécution de
	// lazysizes (lu une seule fois à son initialisation), d'où 'before'.
	// Valeur réduite sur mobile (600px y représente une part bien plus grande
	// du scroll) et sur connexion lente/économie de données (Network
	// Information API, non supportée sur Safari/iOS — repli silencieux sur la
	// seule détection mobile dans ce cas).
	wp_add_inline_script(
		'rumhora-lazysizes',
		'window.lazySizesConfig = window.lazySizesConfig || {};'
		. 'var rhConn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;'
		. 'var rhSlow = rhConn && (rhConn.saveData || /2g/.test(rhConn.effectiveType || ""));'
		. 'var rhMobile = window.innerWidth < 768;'
		. 'window.lazySizesConfig.expand = rhSlow ? 150 : (rhMobile ? 300 : 600);',
		'before'
	);

	// Bundle JS principal (src/js/main.js → dist/main.js, voir package.json)
	if ( file_exists( $dist . '/main.js' ) ) {
		wp_enqueue_script(
			'rumhora-main',
			get_template_directory_uri() . '/dist/main.js',
			array( 'rumhora-gsap', 'rumhora-scrolltrigger', 'rumhora-splittext', 'rumhora-barba', 'rumhora-flatpickr-fr' ),
			filemtime( $dist . '/main.js' ),
			true
		);

		// URL admin-ajax + nonce partagés par tous les formulaires AJAX
		// (voir src/js/forms/form-ajax.js). Conservé même sans formulaire actif :
		// les prochains formulaires (contact, privatisation) s'appuieront dessus.
		wp_localize_script(
			'rumhora-main',
			'rumhoraAjax',
			array(
				'url'   => admin_url( 'admin-ajax.php' ),
				'nonce' => wp_create_nonce( 'rumhora_form_nonce' ),
				// Repli JS quand la requête échoue avant même d'atteindre le
				// serveur (ex: coupure réseau) : aucun message PHP n'est
				// disponible dans ce cas, celui-ci doit donc être traduisible ici.
				'genericError' => __( 'Une erreur est survenue. Merci de réessayer.', 'rumhora' ),
			)
		);
	}
}
add_action( 'wp_enqueue_scripts', 'rumhora_enqueue_scripts', 5 );

/**
 * Enqueue des scripts WordPress (navigation, comment-reply).
 */
function rumhora_scripts() {
	wp_enqueue_style( 'rumhora-style', get_stylesheet_uri(), array(), RUMHORA_VERSION );

	wp_enqueue_script( 'rumhora-navigation', get_template_directory_uri() . '/js/navigation.js', array( 'rumhora-gsap' ), RUMHORA_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'rumhora_scripts' );

/**
 * Coquilles ACF, chargées EN PREMIER : tout le reste du thème appelle
 * get_field(), y compris au niveau des templates. Sans ACF actif, l'absence de
 * ce require donne un écran blanc fatal, admin comprise.
 */
require get_template_directory() . '/inc/acf-fallback.php';

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Navigation principale (rendu + repli quand aucun menu n'est assigné).
 */
require get_template_directory() . '/inc/nav-menu.php';

/**
 * Composants réutilisables (rs_*) — voir CLAUDE.md.
 */
require get_template_directory() . '/inc/components.php';

/**
 * Newsletter (Brevo) — VOLONTAIREMENT NON CHARGÉE.
 *
 * Le footer de la maquette n'a pas de formulaire d'inscription, et la
 * newsletter est listée « hors périmètre » dans _planning-rhumora.md. Le
 * handler reste dans inc/ajax-newsletter.php, prêt à servir, mais n'est pas
 * requis ici : un endpoint admin-ajax enregistré sans formulaire pour l'appeler
 * est une surface exposée sans contrepartie.
 *
 * Pour le réactiver : décommenter la ligne ci-dessous, réimporter
 * initNewsletterFormAjax() dans src/js/main.js et src/js/barba.js, et poser le
 * markup du formulaire (voir l'en-tête de inc/ajax-newsletter.php).
 *
 * require get_template_directory() . '/inc/ajax-newsletter.php';
 */

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
	require get_template_directory() . '/inc/jetpack.php';
}

/**
 * Page d'options ACF (Options du Thème). Les groupes de champs eux-mêmes sont
 * définis en JSON dans acf-json/ (auto-chargé et synchronisé par ACF).
 */
require get_template_directory() . '/inc/acf-fields-theme-options.php';

/**
 * Meta Pixel (optionnel, gaté par Complianz).
 */
require get_template_directory() . '/inc/analytics.php';

/**
 * Désactive Gutenberg sur les pages pilotées par ACF.
 */
require get_template_directory() . '/inc/disable-editor.php';

/**
 * Masque la version de WordPress (meta generator, RSS, ?ver= du cœur).
 */
require get_template_directory() . '/inc/security.php';

/**
 * ACF : stocke/charge les groupes de champs dans acf-json/ plutôt qu'en base.
 * Les champs sont ainsi versionnés avec le thème et se synchronisent d'un
 * environnement à l'autre (local → staging → prod) sans export manuel.
 */
function rumhora_acf_json_save_point( $path ) {
	return get_template_directory() . '/acf-json';
}
add_filter( 'acf/settings/save_json', 'rumhora_acf_json_save_point' );

function rumhora_acf_json_load_point( $paths ) {
	unset( $paths[0] );
	$paths[] = get_template_directory() . '/acf-json';
	return $paths;
}
add_filter( 'acf/settings/load_json', 'rumhora_acf_json_load_point' );

/**
 * Convertit une URL d'image en sa version WebP si elle existe.
 * Compatible avec le plugin "WebP Converter for Media" (dossier
 * wp-content/uploads-webpc). Retourne l'URL d'origine si aucune version WebP
 * n'est disponible — jamais une URL cassée.
 */
function rs_get_webp_url( $image_url ) {
	if ( empty( $image_url ) ) {
		return $image_url;
	}

	$extensions     = array( 'jpg', 'jpeg', 'png' );
	$file_extension = pathinfo( $image_url, PATHINFO_EXTENSION );

	if ( ! in_array( strtolower( $file_extension ), $extensions, true ) ) {
		return $image_url;
	}

	$upload_dir = wp_upload_dir();
	$base_url   = $upload_dir['baseurl'];

	$webpc_base_dir = WP_CONTENT_DIR . '/uploads-webpc';
	$webpc_base_url = content_url( '/uploads-webpc' );

	// Image de la médiathèque
	if ( strpos( $image_url, $base_url ) !== false ) {
		$relative_path = str_replace( $base_url, '', $image_url );
		$webp_path     = $webpc_base_dir . '/uploads' . preg_replace( '/\.(jpe?g|png)$/i', '.webp', $relative_path );

		if ( file_exists( $webp_path ) ) {
			return $webpc_base_url . '/uploads' . preg_replace( '/\.(jpe?g|png)$/i', '.webp', $relative_path );
		}
	}

	// Image embarquée dans le thème (/img/)
	if ( strpos( $image_url, get_template_directory_uri() ) !== false ) {
		$relative_path  = str_replace( get_template_directory_uri(), '', $image_url );
		$theme_relative = 'themes/' . get_template() . $relative_path;
		$webp_path      = $webpc_base_dir . '/' . preg_replace( '/\.(jpe?g|png)$/i', '.webp', $theme_relative );

		if ( file_exists( $webp_path ) ) {
			return $webpc_base_url . '/' . preg_replace( '/\.(jpe?g|png)$/i', '.webp', $theme_relative );
		}
	}

	return $image_url;
}

/**
 * Remplace automatiquement l'URL d'une image ACF par sa version WebP
 * (uploads-webpc) quand elle existe.
 */
function rs_acf_webp_or_original( $image ) {
	if ( ! $image || empty( $image['url'] ) ) {
		return $image;
	}

	$upload_dir = wp_get_upload_dir();

	$original_path = str_replace( $upload_dir['baseurl'], $upload_dir['basedir'], $image['url'] );

	if ( function_exists( 'webpc_dir_path' ) ) {
		$webpc_base_path = webpc_dir_path();
	} else {
		$webpc_base_path = WP_CONTENT_DIR . '/uploads-webpc/';
	}

	$relative_path = str_replace( trailingslashit( $upload_dir['basedir'] ), '', $original_path );
	$webp_path     = preg_replace( '/\.(jpg|jpeg|png)$/i', '.webp', $webpc_base_path . $relative_path );
	$webp_url      = str_replace( $upload_dir['basedir'], $upload_dir['baseurl'], $webp_path );

	if ( file_exists( $webp_path ) ) {
		$image['url']       = $webp_url;
		$image['mime_type'] = 'image/webp';
	}

	return $image;
}
add_filter( 'acf/format_value/type=image', 'rs_acf_webp_or_original', 20, 1 );

/**
 * Reformate une date "YYYY-MM-DD" (format natif d'un <input type="date">,
 * toujours ISO quel que soit l'affichage local du navigateur) en "JJ/MM/AAAA"
 * pour les emails envoyés par les handlers AJAX. Toute valeur qui ne
 * correspond pas exactement à ce format (vide, déjà reformatée, autre champ)
 * est retournée telle quelle.
 */
function rumhora_format_date_fr( $value ) {
	if ( ! is_string( $value ) || ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $value ) ) {
		return $value;
	}
	$date = DateTime::createFromFormat( 'Y-m-d', $value );
	return $date ? $date->format( 'd/m/Y' ) : $value;
}

/**
 * wp_mail() avec Reply-To optionnel. Certains relais SMTP (Brevo notamment)
 * valident l'adresse Reply-To plus strictement que is_email() côté WordPress
 * et rejettent l'envoi ENTIER si elle est malformée (ex: un TLD invalide
 * laissé passer par is_email()). On ne veut jamais perdre la notification pour
 * une faute de frappe du visiteur : si l'envoi avec Reply-To échoue, on
 * retente aussitôt sans ce header — l'adresse saisie reste de toute façon
 * visible dans le corps du message.
 */
function rs_mail_with_reply_to( $to, $subject, $body, $reply_to ) {
	$headers = array( 'Content-Type: text/plain; charset=UTF-8' );

	if ( $reply_to && wp_mail( $to, $subject, $body, array_merge( $headers, array( 'Reply-To: ' . $reply_to ) ) ) ) {
		return true;
	}

	return wp_mail( $to, $subject, $body, $headers );
}

/**
 * Ferme les commentaires sur les pages (seuls les articles de blog en gardent).
 */
function rs_disable_comments_on_pages( $open, $post_id ) {
	$post = get_post( $post_id );
	if ( $post && 'page' === $post->post_type ) {
		return false;
	}
	return $open;
}
add_filter( 'comments_open', 'rs_disable_comments_on_pages', 10, 2 );

function rs_hide_comment_option_on_pages() {
	remove_post_type_support( 'page', 'comments' );
	remove_post_type_support( 'page', 'trackbacks' );
}
add_action( 'init', 'rs_hide_comment_option_on_pages' );

function rs_remove_comment_meta_boxes() {
	remove_meta_box( 'commentstatusdiv', 'page', 'normal' );
	remove_meta_box( 'commentsdiv', 'page', 'normal' );
}
add_action( 'admin_menu', 'rs_remove_comment_meta_boxes' );

/**
 * Normalise la police des champs ACF dans l'admin : certains thèmes d'admin /
 * plugins laissent les labels ACF en italique, difficilement lisible sur un
 * back-office très rempli de champs.
 */
function rs_acf_admin_styles() {
	echo '<style>
		.acf-field-margin-left .acf-input { margin-left: 20px; }
		.acf-field .acf-label label,
		.acf-field .acf-input,
		.acf-field .acf-label .description,
		.acf-field textarea,
		.acf-field input[type="text"],
		.acf-field input[type="url"],
		.acf-field input[type="email"],
		.acf-field select {
			font-style: normal !important;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif !important;
		}
	</style>';
}
add_action( 'acf/input/admin_head', 'rs_acf_admin_styles' );

/**
 * Walker du menu mobile : ajoute data-barba sur chaque lien (pour que Barba
 * intercepte la navigation) et permet de poser des classes sur les <li>/<a>
 * via les arguments add_li_class / link_class de wp_nav_menu().
 */
class Rumhora_Mobile_Nav_Walker extends Walker_Nav_Menu {
	public function start_el( &$output, $item, $depth = 0, $args = array(), $id = 0 ) {
		$classes = empty( $item->classes ) ? array() : (array) $item->classes;

		if ( isset( $args->add_li_class ) ) {
			$classes[] = $args->add_li_class;
		}

		$class_names = join( ' ', apply_filters( 'nav_menu_css_class', array_filter( $classes ), $item, $args ) );
		$class_names = $class_names ? ' class="' . esc_attr( $class_names ) . '"' : '';

		$item_id = apply_filters( 'nav_menu_item_id', 'menu-item-' . $item->ID, $item, $args );
		$item_id = $item_id ? ' id="' . esc_attr( $item_id ) . '"' : '';

		$output .= '<li' . $item_id . $class_names . '>';

		$atts               = array();
		$atts['title']      = ! empty( $item->attr_title ) ? $item->attr_title : '';
		$atts['target']     = ! empty( $item->target ) ? $item->target : '';
		$atts['rel']        = ! empty( $item->xfn ) ? $item->xfn : '';
		$atts['href']       = ! empty( $item->url ) ? $item->url : '';
		$atts['data-barba'] = '';

		if ( isset( $args->link_class ) ) {
			$atts['class'] = $args->link_class;
		}

		$atts = apply_filters( 'nav_menu_link_attributes', $atts, $item, $args );

		$attributes = '';
		foreach ( $atts as $attr => $value ) {
			if ( ! empty( $value ) ) {
				$value       = ( 'href' === $attr ) ? esc_url( $value ) : esc_attr( $value );
				$attributes .= ' ' . $attr . '="' . $value . '"';
			} else {
				$attributes .= ' ' . $attr;
			}
		}

		$item_output  = $args->before;
		$item_output .= '<a' . $attributes . '>';
		$item_output .= $args->link_before . apply_filters( 'the_title', $item->title, $item->ID ) . $args->link_after;
		$item_output .= '</a>';
		$item_output .= $args->after;

		$output .= apply_filters( 'walker_nav_menu_start_el', $item_output, $item, $depth, $args );
	}
}

/**
 * Permet de passer 'link_class' à wp_nav_menu() même sans walker custom
 * (utilisé par le menu du footer, voir footer.php).
 */
function rumhora_add_menu_link_class( $atts, $item, $args ) {
	if ( isset( $args->link_class ) ) {
		$atts['class'] = ( isset( $atts['class'] ) ? $atts['class'] . ' ' : '' ) . $args->link_class;
	}
	return $atts;
}
add_filter( 'nav_menu_link_attributes', 'rumhora_add_menu_link_class', 10, 3 );

/**
 * Logo de la page de connexion WordPress (img/logo-mini.png).
 */
function rumhora_login_logo() {
	if ( ! file_exists( get_template_directory() . '/img/logo-mini.png' ) ) {
		return;
	}
	?>
	<style type="text/css">
		body.login div#login h1 a {
			background-image: url('<?php echo esc_url( get_template_directory_uri() . '/img/logo-mini.png' ); ?>');
			background-size: contain;
			width: 100%;
			height: 100px;
		}
	</style>
	<?php
}
add_action( 'login_enqueue_scripts', 'rumhora_login_logo' );
