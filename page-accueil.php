<?php
/**
 * Template Name: Accueil
 *
 * Page d'accueil. Le namespace Barba de cette page est déduit du nom du
 * fichier par rumhora_get_barba_namespace() : « accueil ».
 *
 * Les sections sont ajoutées ici au fur et à mesure de l'intégration de la
 * maquette ; chacune doit passer par un composant rs_* réutilisable plutôt
 * que par du markup écrit en dur dans ce fichier (voir CLAUDE.md).
 *
 * @package rumhora
 */

get_header();

/**
 * Hero.
 *
 * Les valeurs passées ici ne servent QUE de repli : dès que les champs ACF de
 * la page sont renseignés (voir acf-json/group_accueil.json), ce sont eux qui
 * s'affichent. Elles reprennent le contenu de la maquette pour que la page
 * soit juste visuellement avant même la saisie du client.
 *
 * Le <em> autour de « Timeless » le passe en doré (voir .hero-title em) :
 * c'est le bouton « italique » de l'éditeur, donc modifiable sans toucher au
 * code.
 */
rs_hero_split(
	array(
		'titre'       => sprintf(
			/* translators: %s : mot mis en avant (affiché en doré) dans le titre du hero. */
			__( 'A %s Culinary<br>& Musical Journey', 'rumhora' ),
			'<em>' . __( 'Timeless', 'rumhora' ) . '</em>'
		),
		'description' => __( 'Gastronomy and immersive soundscapes in a precise, architectural space.', 'rumhora' ),
		'boutons'     => array(
			array(
				'texte' => __( 'Book A Table', 'rumhora' ),
				'lien'  => home_url( '/book-a-table' ),
			),
			array(
				'texte' => __( 'Explore Menu', 'rumhora' ),
				'lien'  => home_url( '/menu' ),
			),
		),
	)
);

get_footer();
