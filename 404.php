<?php
/**
 * Template de la page 404.
 *
 * Renvoie une vraie page 404, PAS une redirection 301 vers l'accueil : une
 * redirection permanente depuis une URL inexistante est interprétée par Google
 * comme un « soft 404 » et finit par faire désindexer la page de destination
 * autant que l'URL d'origine. Le projet reposant exclusivement sur le
 * référencement naturel (voir _planning-rhumora.md), la bonne réponse HTTP
 * compte autant que le contenu affiché.
 *
 * @link https://codex.wordpress.org/Creating_an_Error_404_Page
 *
 * @package rumhora
 */

get_header();
?>

<section class="md:px-5 px-[10px] flex flex-col justify-center min-h-[70vh] md:py-20 py-12">
	<h1 class="m-0 mb-6"><?php esc_html_e( 'Page introuvable', 'rumhora' ); ?></h1>

	<p class="text-reveal font-serif-display lg:text-2xl text-base max-w-xl m-0 mb-10">
		<?php esc_html_e( "Cette page n'existe pas ou a été déplacée.", 'rumhora' ); ?>
	</p>

	<div class="flex flex-wrap gap-4">
		<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn btn-primary" data-barba>
			<?php esc_html_e( "Retour à l'accueil", 'rumhora' ); ?>
		</a>
		<a href="<?php echo esc_url( home_url( '/book-a-table' ) ); ?>" class="btn" data-barba>
			<?php esc_html_e( 'Book a table', 'rumhora' ); ?>
		</a>
	</div>
</section>

<?php
get_footer();
