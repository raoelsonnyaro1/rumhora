<?php
/**
 * Section CTA : photo (parallax léger + masque de reveal) avec titre en
 * overlay, à côté d'un texte et d'un bouton.
 *
 * Lit directement les champs ACF de la page courante (contact_titre,
 * contact_texte, contact_bouton_texte, contact_bouton_lien, contact_image) ;
 * les $args ne servent qu'à fournir des valeurs de repli.
 *
 * .cta-title-overlay est un hook : le titre n'a pas de déclencheur propre, il
 * se joue une fois le reveal de la photo terminé (voir
 * initTextRevealAnimations, qui écoute l'évènement 'revealcomplete' dispatché
 * par mediaRevealImage).
 *
 * Usage :
 *   rs_contact_cta();
 *   rs_contact_cta([ 'titre' => '...', 'texte' => '...', ... ]);
 *
 * @param array $args
 */
function rs_contact_cta( $args = array() ) {
	$titre        = get_field( 'contact_titre' ) ?: ( $args['titre'] ?? '' );
	$texte        = get_field( 'contact_texte' ) ?: ( $args['texte'] ?? '' );
	$bouton_texte = get_field( 'contact_bouton_texte' ) ?: ( $args['bouton_texte'] ?? __( 'Nous contacter', 'rumhora' ) );
	$bouton_lien  = get_field( 'contact_bouton_lien' ) ?: ( $args['bouton_lien'] ?? home_url( '/contact' ) );
	$image        = get_field( 'contact_image' ) ?: ( $args['image'] ?? null );

	if ( $image && ! is_array( $image ) ) {
		$image = array( 'url' => $image, 'alt' => '' );
	}
	?>
	<section class="grid md:grid-cols-2 grid-cols-1 md:pb-10 pb-6">

		<!-- Colonne image + titre en overlay -->
		<div class="relative aspect-square overflow-hidden slide-up">
			<?php if ( $image ) : ?>
				<div class="reveal h-full" data-reveal-mask="right">
					<img
						data-src="<?php echo esc_url( $image['url'] ); ?>"
						alt="<?php echo esc_attr( $image['alt'] ?? '' ); ?>"
						class="lazyload w-full h-full object-cover scroll-parallax-img">
				</div>
			<?php endif; ?>

			<?php if ( $titre ) : ?>
				<div class="absolute top-0 left-0 md:p-8 p-5 cta-title-overlay">
					<h2 class="text-cream m-0"><?php echo wp_kses_post( $titre ); ?></h2>
				</div>
			<?php endif; ?>
		</div>

		<!-- Colonne texte + bouton -->
		<div class="md:px-10 px-[10px] md:py-10 py-6 flex flex-col justify-between">
			<?php if ( $texte ) : ?>
				<p class="text-reveal lg:text-4xl text-xl max-w-lg font-serif mb-6 md:mb-0"><?php echo wp_kses_post( $texte ); ?></p>
			<?php endif; ?>

			<a href="<?php echo esc_url( $bouton_lien ); ?>" class="btn btn-primary w-full text-center text-base mt-auto" data-barba>
				<?php echo esc_html( $bouton_texte ); ?>
			</a>
		</div>

	</section>
	<?php
}
