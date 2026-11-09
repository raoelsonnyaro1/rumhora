<?php
/**
 * Template Name: Exemple (démo des composants)
 *
 * Template de DÉMONSTRATION, à dupliquer comme point de départ pour une vraie
 * page (page-accueil.php, page-menus.php, ...) puis à supprimer du dépôt.
 *
 * Il montre comment assembler les composants rs_* et quels hooks de classe
 * déclenchent quelle animation :
 *   .section_hero     → séquence d'entrée + header en mode section sombre
 *   .text-reveal      → révélation ligne par ligne (SplitText)
 *   .reveal           → révélation d'image (glissement + fondu)
 *   .line-reveal      → ligne qui se dessine de gauche à droite
 *   .slide-up         → montée au scroll
 *   .list-reveal      → <li> révélés un par un
 *   .text-scrub       → remplissage lettre par lettre au fil du scroll
 *   [data-stagger-group] / [data-stagger-item] → cascade sur une série d'items
 *
 * Le namespace Barba de cette page est déduit du nom du fichier par
 * rumhora_get_barba_namespace() : « exemple ».
 *
 * @package rumhora
 */

get_header();
?>

<?php
// Hero : lit les champs ACF de la page (voir acf-json/group_pages_globales.json),
// les valeurs passées ici ne servent que de repli quand un champ est vide.
rs_hero(
	array(
		'titre_defaut'       => __( 'Un comptoir à rhum au cœur de la ville', 'rumhora' ),
		'description_defaut' => __( 'Cuisine de partage, carte de rhums signature et un lieu à privatiser.', 'rumhora' ),
		'col1_texte_defaut'  => __( 'Bar à rhum & cuisine de partage', 'rumhora' ),
	)
);
?>

<!-- Section éditoriale : titre + texte au scrub -->
<section class="md:px-5 px-[10px] md:py-20 py-12">
	<div class="grid md:grid-cols-3 grid-cols-1 md:gap-10 gap-8">
		<h2 class="m-0 md:col-span-1"><?php esc_html_e( 'Notre maison', 'rumhora' ); ?></h2>

		<div class="md:col-span-2">
			<p class="text-scrub font-serif lg:text-3xl text-lg m-0">
				<?php esc_html_e( 'Remplacer ce paragraphe par le texte de la maquette. Les caractères se révèlent au fil du scroll.', 'rumhora' ); ?>
			</p>

			<!-- Liserés + liste : .line-reveal se dessine, puis .list-reveal
			     révèle chaque <li>. data-reveal-delay décale la liste pour
			     qu'elle arrive APRÈS la ligne plutôt qu'en même temps. -->
			<div class="line-reveal h-px bg-dark/30 md:mt-10 mt-8"></div>

			<ul class="list-reveal md:mt-8 mt-6 flex flex-col gap-2" data-reveal-delay="0.3">
				<li><?php esc_html_e( 'Ouvert du mardi au samedi', 'rumhora' ); ?></li>
				<li><?php esc_html_e( 'Service continu de 18h à 23h', 'rumhora' ); ?></li>
				<li><?php esc_html_e( 'Réservation conseillée le week-end', 'rumhora' ); ?></li>
			</ul>
		</div>
	</div>
</section>

<?php
// Galerie plein écran (Swiper) : vignettes sur desktop, flèches sur mobile.
// 'images' => [] déclenche la lecture des champs ACF galerie_* ; sans photo,
// le composant ne rend rien du tout.
rs_galerie(
	array(
		'titre'       => __( 'Le lieu', 'rumhora' ),
		'description' => __( 'Quelques mots sur l’ambiance, la salle, la terrasse.', 'rumhora' ),
		'classes'     => 'lg:h-screen h-[70vw]',
		'bouton'      => array(
			'texte' => __( 'Voir la galerie', 'rumhora' ),
			'lien'  => home_url( '/gallery' ),
		),
	)
);
?>

<!-- Cascade sur une série d'items : le GROUPE est déclaré dans le markup
     (data-stagger-group) et chaque item porte data-stagger-item. Grouper par
     conteneur est nécessaire dès qu'une page affiche plusieurs listes du même
     type — voir initStaggerReveal() dans src/js/animations.js. -->
<section class="md:px-5 px-[10px] md:py-20 py-12 border-t border-dark/20">
	<h2 class="m-0 md:mb-14 mb-10"><?php esc_html_e( 'Nos espaces', 'rumhora' ); ?></h2>

	<div class="grid md:grid-cols-3 grid-cols-1 md:gap-8 gap-6" data-stagger-group data-stagger-start="top 85%">
		<?php for ( $i = 1; $i <= 3; $i++ ) : ?>
			<div data-stagger-item class="border-t border-dark pt-4">
				<h4 class="m-0 mb-2"><?php printf( esc_html__( 'Espace %d', 'rumhora' ), $i ); ?></h4>
				<p class="m-0 text-sm"><?php esc_html_e( 'Capacité, prestations, usage. À remplacer par un repeater ACF.', 'rumhora' ); ?></p>
			</div>
		<?php endfor; ?>
	</div>
</section>

<?php
// CTA : photo (parallax + masque) avec titre en overlay, texte et bouton.
rs_contact_cta(
	array(
		'titre'        => __( 'Privatiser<br>le lieu', 'rumhora' ),
		'texte'        => __( 'Dîner d’entreprise, anniversaire, lancement : nous construisons le format avec vous.', 'rumhora' ),
		'bouton_texte' => __( 'Faire une demande', 'rumhora' ),
		'bouton_lien'  => home_url( '/privatisations' ),
	)
);

// FAQ : accordéon, un seul item ouvert à la fois. Remplacer le tableau par un
// repeater ACF (get_field('faq_items')) une fois les contenus connus.
rs_faq(
	array(
		'titre' => __( 'Questions fréquentes', 'rumhora' ),
		'items' => array(
			array(
				'question' => __( 'Faut-il réserver ?', 'rumhora' ),
				'reponse'  => __( 'Réponse à renseigner.', 'rumhora' ),
			),
			array(
				'question' => __( 'Proposez-vous des options végétariennes ?', 'rumhora' ),
				'reponse'  => __( 'Réponse à renseigner.', 'rumhora' ),
			),
		),
	)
);

get_footer();
