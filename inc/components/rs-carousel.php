<?php
/**
 * Carrousel d'images légendées (Swiper, slides partiellement visibles pour
 * signaler qu'on peut faire défiler), avec titre et bouton optionnels.
 *
 * Usage :
 *   rs_carousel([
 *       'titre'        => '...',
 *       'items'        => [['nom' => '...', 'image' => $image_acf], ...],
 *       'bouton_texte' => '...',   // ou false pour masquer
 *       'bouton_lien'  => '...',
 *   ]);
 *
 * @param array $args
 */
function rs_carousel( $args = array() ) {
	$titre        = $args['titre'] ?? '';
	$bouton_texte = array_key_exists( 'bouton_texte', $args ) ? $args['bouton_texte'] : false;
	$bouton_lien  = $args['bouton_lien'] ?? '#';
	$items        = $args['items'] ?? array();

	if ( empty( $items ) || ! is_array( $items ) ) {
		return;
	}

	$slides = array_values(
		array_filter(
			array_map(
				function ( $item ) {
					$image = $item['image'] ?? null;
					if ( ! $image ) {
						return null;
					}
					return array(
						'nom'   => $item['nom'] ?? '',
						'image' => is_array( $image ) ? $image : array( 'url' => $image, 'alt' => '' ),
					);
				},
				$items
			)
		)
	);

	if ( empty( $slides ) ) {
		return;
	}

	// Identifiant unique par instance : une page peut afficher plusieurs
	// rs_carousel().
	static $rs_carousel_count = 0;
	$rs_carousel_count++;
	$id = 'rs-carousel-' . $rs_carousel_count;
	?>
	<section class="rs-carousel md:px-5 px-[10px] md:py-16 py-10" id="<?php echo esc_attr( $id ); ?>">
		<?php if ( $titre ) : ?>
			<div class="grid md:grid-cols-2 grid-cols-1 md:mb-14 mb-10">
				<h2 class="text-reveal m-0"><?php echo wp_kses_post( $titre ); ?></h2>
			</div>
		<?php endif; ?>

		<div class="overflow-hidden">
			<div class="swiper rs-carousel-swiper">
				<div class="swiper-wrapper">
					<?php foreach ( $slides as $slide ) : ?>
						<!-- .rs-carousel-slide : hook du léger zoom au survol
						     (initCardHoverAnimations → initHoverZoom). -->
						<div class="swiper-slide rs-carousel-slide relative aspect-square overflow-hidden">
							<img data-src="<?php echo esc_url( $slide['image']['url'] ); ?>"
								alt="<?php echo esc_attr( $slide['image']['alt'] ?? '' ); ?>"
								class="lazyload w-full h-full object-cover">

							<?php if ( $slide['nom'] ) : ?>
								<!-- Dégradé seulement s'il y a une légende : sans texte
								     par-dessus, il assombrirait la photo pour rien. -->
								<div class="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
								<div class="absolute bottom-0 left-0 right-0 flex items-end md:p-5 p-4">
									<div class="border-b border-cream/40 w-full pb-2 md:pb-3">
										<span class="text-cream lg:text-xl text-base m-0"><?php echo esc_html( $slide['nom'] ); ?></span>
									</div>
								</div>
							<?php endif; ?>
						</div>
					<?php endforeach; ?>
				</div>
			</div>
		</div>

		<?php if ( $bouton_texte ) : ?>
			<div class="flex justify-center md:mt-10 mt-8">
				<a href="<?php echo esc_url( $bouton_lien ); ?>" class="btn btn-primary" data-barba><?php echo esc_html( $bouton_texte ); ?></a>
			</div>
		<?php endif; ?>
	</section>
	<?php
}
