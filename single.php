<?php
/**
 * Template d'un article seul.
 *
 * Pas de sidebar ni de commentaires : le blog, s'il est utilisé, sert de
 * support éditorial (actualités, événements) plutôt que d'espace de
 * discussion. Pour réactiver les commentaires, voir
 * rs_disable_comments_on_pages() dans functions.php (il ne ferme que les
 * pages) et ajouter comments_template() ci-dessous.
 *
 * @package rumhora
 */

get_header();

while ( have_posts() ) :
	the_post();
	$rumhora_post_id = get_the_ID();
	?>

	<?php
	// Hero de l'article : image mise en avant en fond, titre + extrait.
	rs_hero(
		array(
			'titre_defaut'       => get_the_title(),
			'description_defaut' => get_the_excerpt(),
			'image_defaut'       => has_post_thumbnail() ? get_the_post_thumbnail_url( $rumhora_post_id, 'full' ) : '',
			'col1_texte_defaut'  => get_the_date( 'j F Y' ),
			'col3_texte_defaut'  => __( 'Tous les articles', 'rumhora' ),
			'col3_lien_defaut'   => get_permalink( get_option( 'page_for_posts' ) ) ?: home_url( '/' ),
		)
	);
	?>

	<article class="md:px-5 px-[10px] md:py-16 py-10">
		<div class="md:grid md:grid-cols-3 md:gap-6">
			<!-- Colonne vide : décale le texte sur les 2/3 droits, en écho à la
			     grille titre/contenu utilisée dans les sections éditoriales. -->
			<div class="hidden md:block"></div>

			<div class="md:col-span-2 max-w-2xl text-reveal md:text-base text-sm font-serif wp-text-block-container">
				<div class="content">
					<?php the_content(); ?>
				</div>
			</div>
		</div>
	</article>

<?php
endwhile;

get_footer();
