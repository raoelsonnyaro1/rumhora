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

/**
 * « About us » — bloc éditorial + photo.
 *
 * Même logique de repli que le hero : les valeurs ci-dessous sont celles de la
 * maquette et ne s'affichent que tant que les champs ACF de la page sont vides.
 */
$rumhora_about_image = get_field( 'about_image' );
if ( ! $rumhora_about_image ) {
	$rumhora_about_image = get_template_directory_uri() . '/img/accueil-about.webp';
}

rs_text_media(
	array(
		'id'           => 'about',
		'surtitre'     => get_field( 'about_surtitre' ) ?: __( 'About us', 'rumhora' ),
		'titre'        => get_field( 'about_titre' ) ?: __( 'An architecture of flavor and sound.', 'rumhora' ),
		'texte'        => get_field( 'about_texte' ) ?: __( 'RUMHORA is born from the intersection of haute cuisine and curated sonic environments. We believe in the power of precision—where every ingredient, every note, and every shadow is placed with intent.', 'rumhora' ),
		'bouton_texte' => get_field( 'about_cta_texte' ) ?: __( 'Discover Our Story', 'rumhora' ),
		'bouton_lien'  => get_field( 'about_cta_lien' ) ?: home_url( '/story' ),
		'image'        => $rumhora_about_image,
	)
);

/**
 * « Featured chef » — portrait, texte et citation en composition superposée.
 */
$rumhora_chef_image = get_field( 'chef_image' );
if ( ! $rumhora_chef_image ) {
	$rumhora_chef_image = get_template_directory_uri() . '/img/accueil-chef.webp';
}

rs_portrait_quote(
	array(
		'id'       => 'chef',
		'surtitre' => get_field( 'chef_surtitre' ) ?: __( 'Featured chef', 'rumhora' ),
		'titre'    => get_field( 'chef_titre' ) ?: sprintf(
			/* translators: %s : fin du titre, affichée en doré. */
			__( 'The Chef %s', 'rumhora' ),
			'<em>' . __( 'behind the experience', 'rumhora' ) . '</em>'
		),
		'texte'    => get_field( 'chef_texte' ) ?: __( 'Born and raised in South Africa, Chef Naledi Mokoena brings together refined technique and deep cultural influences through a cuisine that feels both elegant and heartfelt. Having trained in acclaimed kitchens across Cape Town and abroad, she has developed a culinary style rooted in bold flavours, seasonality, and authenticity.', 'rumhora' ),
		// Apostrophe typographique (’) et non droite : c'est la forme correcte
		// dans une citation, et elle évite d'avoir à l'échapper ici.
		'citation' => get_field( 'chef_citation' ) ?: __( 'Food is about bringing people together through moments they’ll always remember.', 'rumhora' ),
		'image'    => $rumhora_chef_image,
	)
);

get_footer();
