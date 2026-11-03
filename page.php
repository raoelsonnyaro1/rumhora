<?php
/**
 * The template for displaying all pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package rumhora
 */

get_header();
?>

	<div id="primary" class="md:px-5 px-[10px] md:py-16 py-10"><!-- Pas un <main> : header.php en ouvre déjà un (voir .site-main), et imbriquer deux <main> est invalide. -->

		<?php
		while ( have_posts() ) :
			the_post();

			get_template_part( 'template-parts/content', 'page' );

			// If comments are open or we have at least one comment, load up the comment template.
			if ( comments_open() || get_comments_number() ) :
				comments_template();
			endif;

		endwhile; // End of the loop.
		?>

	</div><!-- #primary -->

<?php
get_sidebar();
get_footer();
