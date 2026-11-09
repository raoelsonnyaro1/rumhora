<?php
/**
 * Section « grappe de médias + bloc éditorial » : deux photos décalées et un
 * cartouche décoratif d'un côté, surtitre / titre / texte de l'autre.
 *
 * Composant générique — c'est la composition « Chef's universe » de l'accueil,
 * mais rien n'y est propre à cette page. L'argument 'invert' place la grappe
 * à droite, pour alterner d'une section à l'autre.
 *
 * Hooks d'animation (voir src/js/animations.js) :
 *   .fade-in      surtitre et cartouche décoratif
 *   h2            titre, révélé ligne par ligne (SplitText)
 *   .text-reveal  paragraphe
 *   .reveal       les deux photos (glissement + fondu au scroll)
 *
 * Le titre accepte du HTML : un <em> y est rendu en doré. Pour un titre
 * ENTIÈREMENT doré comme sur la maquette, mettre le titre complet en italique
 * depuis l'éditeur.
 *
 * Usage :
 *   rs_media_cluster([
 *       'surtitre' => "Chef's universe",
 *       'titre'    => '<em>A culinary world<br>of bold flavours</em>',
 *       'texte'    => '...',
 *       'images'   => [$image1, $image2],   // 1 = grande photo, 2 = petite
 *       'invert'   => true,                 // grappe à droite
 *   ]);
 *
 * @param array $args
 */
function rs_media_cluster( $args = array() ) {
	$surtitre = $args['surtitre'] ?? '';
	$titre    = $args['titre'] ?? '';
	$texte    = $args['texte'] ?? '';
	$invert   = ! empty( $args['invert'] );
	$id       = $args['id'] ?? '';

	$images = array_values(
		array_filter(
			array_map(
				function ( $img ) {
					if ( empty( $img ) ) {
						return null;
					}
					return is_array( $img ) ? $img : array( 'url' => $img, 'alt' => '' );
				},
				(array) ( $args['images'] ?? array() )
			)
		)
	);

	// Sans aucune photo, la grappe n'a plus de sujet et la grille se
	// retrouverait avec une colonne vide : on ne rend rien.
	if ( empty( $images ) ) {
		return;
	}
	?>
	<section class="media-cluster xl:px-14 md:px-8 px-5 md:py-28 py-16"
		<?php echo $id ? ' id="' . esc_attr( $id ) . '"' : ''; ?>>

		<div class="media-cluster__grid">

			<!-- Grappe de médias.
			     Les trois éléments sont positionnés en pourcentages DANS un
			     conteneur à aspect-ratio fixe : la composition garde donc
			     exactement ses proportions à toutes les tailles d'écran, sans
			     breakpoint intermédiaire à régler. -->
			<div class="media-cluster__media <?php echo $invert ? 'lg:order-2' : ''; ?>">
				<div class="media-cluster__stage">

					<div class="reveal media-cluster__photo media-cluster__photo--1">
						<img data-src="<?php echo esc_url( $images[0]['url'] ); ?>"
							alt="<?php echo esc_attr( $images[0]['alt'] ?? '' ); ?>"
							class="lazyload">
					</div>

					<?php if ( isset( $images[1] ) ) : ?>
						<div class="reveal media-cluster__photo media-cluster__photo--2">
							<img data-src="<?php echo esc_url( $images[1]['url'] ); ?>"
								alt="<?php echo esc_attr( $images[1]['alt'] ?? '' ); ?>"
								class="lazyload">
						</div>
					<?php endif; ?>

					<!-- Cartouche décoratif : purement graphique, donc aria-hidden. -->
					<div class="media-cluster__decor fade-in" data-fade-delay="0.3" aria-hidden="true"></div>

				</div>
			</div>

			<!-- Bloc éditorial -->
			<div class="media-cluster__content <?php echo $invert ? 'lg:order-1' : ''; ?>">
				<?php if ( $surtitre ) : ?>
					<p class="eyebrow fade-in"><?php echo esc_html( $surtitre ); ?></p>
				<?php endif; ?>

				<?php if ( $titre ) : ?>
					<h2 class="media-cluster__title md:mt-5 mt-4"><?php echo wp_kses_post( $titre ); ?></h2>
				<?php endif; ?>

				<?php if ( $texte ) : ?>
					<p class="text-reveal media-cluster__text md:mt-8 mt-6"><?php echo wp_kses_post( $texte ); ?></p>
				<?php endif; ?>
			</div>

		</div>
	</section>
	<?php
}
