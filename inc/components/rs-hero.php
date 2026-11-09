<?php
/**
 * Section hero plein écran : image de fond (desktop/mobile), titre +
 * description, et bande basse (texte à gauche, indicateur de scroll, CTA).
 *
 * Lit directement les champs ACF de la page courante (hero_image,
 * hero_image_mobile, hero_titre, hero_description, hero_col1_texte,
 * hero_col3_texte, hero_col3_lien) ; les $args ne servent qu'à fournir les
 * valeurs de repli propres à chaque template quand le champ ACF est vide.
 *
 * La classe .section_hero est un hook : elle déclenche la séquence d'entrée
 * GSAP (initHeroIntro) ET indique à header.js qu'il survole une section sombre
 * (logo clair, logo complet plutôt que logomark centré). Ne pas la renommer.
 *
 * Usage :
 *   rs_hero([
 *       'titre_defaut'       => '...',
 *       'description_defaut' => '...',
 *       'image_defaut'       => get_template_directory_uri() . '/img/...',
 *       'col1_texte_defaut'  => '...', // optionnel
 *       'col3_texte_defaut'  => '...', // optionnel
 *       'col3_lien_defaut'   => '...', // optionnel
 *   ]);
 *
 * @param array $args
 */
function rs_hero( $args = array() ) {
	// is_array() : selon le groupe de champs, hero_image peut être en
	// return_format "array" ou "url". Cette fonction n'a besoin que de l'URL ;
	// sans cette normalisation, rs_get_webp_url()/esc_url() reçoivent un
	// tableau dès qu'une vraie image est uploadée (TypeError fatal sur
	// pathinfo() — le fallback texte masque le bug tant que le champ est vide).
	$hero_image        = get_field( 'hero_image' );
	$hero_image_mobile = get_field( 'hero_image_mobile' );

	if ( is_array( $hero_image ) ) {
		$hero_image = $hero_image['url'] ?? '';
	}
	if ( is_array( $hero_image_mobile ) ) {
		$hero_image_mobile = $hero_image_mobile['url'] ?? '';
	}

	$hero_titre       = get_field( 'hero_titre' ) ?: ( $args['titre_defaut'] ?? get_bloginfo( 'name' ) );
	$hero_description = get_field( 'hero_description' ) ?: ( $args['description_defaut'] ?? '' );

	if ( ! $hero_image ) {
		$hero_image = $args['image_defaut'] ?? '';
	}

	$hero_col1_texte = get_field( 'hero_col1_texte' ) ?: ( $args['col1_texte_defaut'] ?? '' );
	$hero_col3_texte = get_field( 'hero_col3_texte' ) ?: ( $args['col3_texte_defaut'] ?? __( 'Book a table', 'rumhora' ) );
	$hero_col3_lien  = get_field( 'hero_col3_lien' ) ?: ( $args['col3_lien_defaut'] ?? home_url( '/book-a-table' ) );
	?>
	<section class="section_hero relative w-full h-[100svh]">
		<?php if ( $hero_image ) : ?>
			<picture class="absolute inset-0">
				<?php if ( $hero_image_mobile ) : ?>
					<source media="(max-width: 560px)" data-srcset="<?php echo esc_url( rs_get_webp_url( $hero_image_mobile ) ); ?>" type="image/webp">
					<source media="(max-width: 560px)" data-srcset="<?php echo esc_url( $hero_image_mobile ); ?>">
				<?php endif; ?>
				<source data-srcset="<?php echo esc_url( rs_get_webp_url( $hero_image ) ); ?>" type="image/webp">
				<img data-src="<?php echo esc_url( $hero_image ); ?>" alt="<?php bloginfo( 'name' ); ?>" class="lazyload w-full h-full object-cover">
			</picture>
			<div class="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none"></div>
		<?php endif; ?>

		<div class="relative z-10 h-full flex flex-col justify-end md:px-5 px-[10px]">
			<div class="lg:pb-8 pb-4 section_hero_content md:w-1/2 w-3/4">
				<h1 class="text-heading lg:mb-8 mb-4"><?php echo wp_kses_post( $hero_titre ); ?></h1>
				<?php if ( $hero_description ) : ?>
					<p class="text-reveal text-heading lg:text-xl text-base m-0 mt-3"><?php echo wp_kses_post( $hero_description ); ?></p>
				<?php endif; ?>
			</div>

			<div class="hero-bottom-row-line h-px bg-heading"></div>

			<div class="hero-bottom-row grid grid-cols-3">
				<div class="md:py-5 py-3">
					<?php if ( $hero_col1_texte ) : ?>
						<p class="text-heading m-0 lg:text-base text-sm"><?php echo wp_kses_post( $hero_col1_texte ); ?></p>
					<?php endif; ?>
				</div>

				<div class="md:py-5 py-3 text-center">
					<!-- Descend vers la section suivante au clic (voir
					     initScrollDownButton dans src/js/animations.js) -->
					<div class="scroll-down">
						<div class="scroll-down__mouse">
							<span class="scroll-down__wheel"></span>
						</div>
						<span class="scroll-down__text"><?php esc_html_e( 'Scroll', 'rumhora' ); ?></span>
					</div>
				</div>

				<div class="md:py-5 py-3 flex items-end justify-end">
					<?php if ( $hero_col3_texte ) : ?>
						<!-- data-barba omis pour une ancre (#...) : Barba ne doit pas
						     lancer un cycle de navigation complet pour un scroll sur
						     la page courante (voir initAnchorScroll). -->
						<a href="<?php echo esc_url( $hero_col3_lien ); ?>" class="btn btn-primary"<?php echo ( strpos( $hero_col3_lien, '#' ) !== 0 ) ? ' data-barba' : ''; ?>>
							<?php echo esc_html( $hero_col3_texte ); ?>
						</a>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</section>
	<?php
}
