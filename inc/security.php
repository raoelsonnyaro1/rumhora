<?php
/**
 * Masque la version de WordPress affichée publiquement (balise meta
 * "generator", flux RSS, "?ver=X.X.X" sur les assets du cœur) - une
 * information utile pour cibler des failles connues d'une version précise,
 * sans bénéfice pour un visiteur normal.
 */

// Retire <meta name="generator" content="WordPress X.X"> du <head>.
remove_action('wp_head', 'wp_generator');

// the_generator est aussi utilisé directement par les flux RSS/Atom (pas
// seulement par wp_generator() ci-dessus, qui s'appuie dessus) - le vider
// couvre ce cas en plus du <head>.
add_filter('the_generator', '__return_empty_string');

/**
 * Retire "?ver=X.X.X" des scripts/styles du cœur WordPress uniquement (pas
 * ceux des extensions ou du thème, dont le "ver" sert à autre chose - ex:
 * dist/main.js?ver=<filemtime>, qui invalide le cache navigateur après un
 * déploiement, pas une info à cacher).
 */
function rumhora_remove_wp_version_strings($src) {
	if (strpos($src, 'ver=' . get_bloginfo('version')) !== false) {
		$src = remove_query_arg('ver', $src);
	}
	return $src;
}
add_filter('script_loader_src', 'rumhora_remove_wp_version_strings');
add_filter('style_loader_src', 'rumhora_remove_wp_version_strings');

/**
 * Retire la balise <meta name="generator" content="WPML ver:...">, posée par
 * le plugin WPML lui-même (sitepress.class.php, méthode meta_generator_tag()
 * sur l'instance globale $sitepress, via add_action('wp_head', ...)) - même
 * logique que wp_generator() ci-dessus, pour une extension plutôt que le
 * cœur. remove_action() a besoin de la même instance d'objet que celle
 * utilisée pour enregistrer le hook, d'où le global $sitepress ; posé sur
 * 'init' pour laisser le temps à WPML (plugins_loaded) de créer cette
 * instance et d'enregistrer son hook avant qu'on ne le retire.
 */
function rumhora_remove_wpml_generator_tag() {
	global $sitepress;
	if ($sitepress) {
		remove_action('wp_head', array($sitepress, 'meta_generator_tag'));
	}
}
add_action('init', 'rumhora_remove_wpml_generator_tag');
