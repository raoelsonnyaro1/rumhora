<?php
/**
 * Dégradation propre quand ACF n'est pas actif.
 *
 * Le thème appelle get_field() un peu partout (header, footer, composants).
 * Sans ACF, chacun de ces appels provoque une erreur fatale « Call to
 * undefined function » : écran blanc complet, y compris dans l'admin, donc
 * impossible d'aller installer le plugin manquant sans passer par FTP.
 *
 * On définit donc des coquilles vides, qui font retomber tous les composants
 * sur leurs valeurs par défaut — le site s'affiche, simplement avec le contenu
 * de repli. Une notice d'admin signale ce qui manque.
 *
 * WordPress charge les EXTENSIONS avant le THÈME : si ACF est actif, ses
 * fonctions existent déjà au moment où ce fichier s'exécute et les
 * function_exists() ci-dessous empêchent toute redéfinition. Ces coquilles ne
 * peuvent donc jamais prendre le pas sur le vrai ACF.
 *
 * @package rumhora
 */

// Les signatures reprennent exactement celles d'ACF, paramètres inutilisés
// compris : une coquille à zéro paramètre fonctionnerait au runtime (PHP
// ignore les arguments en trop sur une fonction utilisateur) mais ferait
// remonter une erreur « too many arguments » sur CHAQUE appel du thème dans
// l'analyse statique de l'IDE — du bruit qui masquerait les vrais problèmes.

if ( ! function_exists( 'get_field' ) ) {
	/**
	 * @param string    $selector     Ignoré.
	 * @param int|bool  $post_id      Ignoré.
	 * @param bool      $format_value Ignoré.
	 * @param bool      $escape_html  Ignoré.
	 * @return null Toujours null : chaque appelant retombe sur son `?:` ou son
	 *              tableau de valeurs par défaut.
	 */
	function get_field( $selector = '', $post_id = false, $format_value = true, $escape_html = false ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound -- coquille d'un nom imposé par ACF.
		return null;
	}
}

if ( ! function_exists( 'get_sub_field' ) ) {
	/**
	 * @return null
	 */
	function get_sub_field( $selector = '', $format_value = true, $escape_html = false ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		return null;
	}
}

if ( ! function_exists( 'have_rows' ) ) {
	/**
	 * @return bool Toujours false : les boucles de repeater ne s'exécutent pas.
	 */
	function have_rows( $selector = '', $post_id = false ) { // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedFunctionFound
		return false;
	}
}

/**
 * Notice d'admin : ACF n'est pas un confort, c'est la source de TOUS les
 * contenus éditables du site. Sans lui, l'admin ne voit aucun champ et pourrait
 * croire le thème cassé — autant le dire explicitement.
 */
function rumhora_acf_missing_notice() {
	// acf_add_options_page() est la fonction réellement requise par le thème
	// (voir inc/acf-fields-theme-options.php) : la tester distingue ACF Pro
	// d'une version gratuite, qui ne propose pas les pages d'options.
	if ( function_exists( 'acf_add_options_page' ) ) {
		return;
	}

	if ( ! current_user_can( 'activate_plugins' ) ) {
		return;
	}

	$message = function_exists( 'get_field' ) && ! function_exists( 'acf_add_options_page' )
		? __( 'Le thème Rumhora nécessite <strong>ACF Pro</strong> : la version gratuite d\'ACF ne gère pas les pages d\'options, utilisées par les réglages globaux du site (footer, réseaux sociaux, réservation).', 'rumhora' )
		: __( 'Le thème Rumhora nécessite l\'extension <strong>ACF Pro</strong>. Tant qu\'elle n\'est pas active, le site s\'affiche avec ses contenus par défaut et aucun champ n\'est éditable.', 'rumhora' );

	printf(
		'<div class="notice notice-warning"><p>%s</p></div>',
		wp_kses( $message, array( 'strong' => array() ) )
	);
}
add_action( 'admin_notices', 'rumhora_acf_missing_notice' );
