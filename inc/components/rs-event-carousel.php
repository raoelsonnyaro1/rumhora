<?php
/**
 * Carrousel d'événements : bloc de titre à gauche, défilé horizontal de
 * cartes à droite qui déborde volontairement du bord droit de l'écran.
 *
 * Chaque carte porte sa photo, sa date, son titre, son intervenant et son
 * CTA. Le slider est initialisé par initEventCarousels()
 * (src/js/animations.js), rappelé après chaque transition Barba.
 *
 * Hooks d'animation (voir src/js/animations.js) :
 *   .fade-in      surtitre et navigation
 *   h2            titre, révélé ligne par ligne (SplitText)
 *
 * Les cartes ne portent PAS .reveal : elles vivent dans un slider dont Swiper
 * transforme et masque les slides. Un reveal au scroll y mesurerait des
 * positions faussées par ces transforms, et les slides hors écran resteraient
 * bloquées en visibility:hidden.
 *
 * Usage :
 *   rs_event_carousel([
 *       'surtitre' => 'The lounge',
 *       'titre'    => '<em>Upcoming<br>Evenings</em>',
 *       'events'   => [
 *           [
 *               'date'         => 'Friday, Nov 10',
 *               'titre'        => 'Midnight Jazz Sessions',
 *               'intervenant'  => 'Thabo & The Quintet',
 *               'image'        => $image_acf,
 *               'bouton_texte' => 'Reserve Lounge',
 *               'bouton_lien'  => home_url('/book-a-table'),
 *           ],
 *       ],
 *   ]);
 *
 * @param array $args
 */
function rs_event_carousel( $args = array() ) {
	$surtitre = $args['surtitre'] ?? '';
	$titre    = $args['titre'] ?? '';
	$id       = $args['id'] ?? '';

	$events = array_values( array_filter( (array) ( $args['events'] ?? array() ) ) );

	if ( empty( $events ) ) {
		return;
	}

	// Identifiant unique par instance : initEventCarousels() retrouve les
	// flèches par ces id, et une page peut afficher plusieurs carrousels.
	static $rs_event_carousel_count = 0;
	$rs_event_carousel_count++;
	$uid = 'rs-events-' . $rs_event_carousel_count;
	?>
	<section class="event-carousel md:py-28 py-16"
		<?php echo $id ? ' id="' . esc_attr( $id ) . '"' : ''; ?>>

		<div class="event-carousel__grid">

			<!-- Bloc de titre -->
			<div class="event-carousel__head">
				<?php if ( $surtitre ) : ?>
					<p class="eyebrow fade-in"><?php echo esc_html( $surtitre ); ?></p>
				<?php endif; ?>

				<?php if ( $titre ) : ?>
					<h2 class="event-carousel__title md:mt-5 mt-4"><?php echo wp_kses_post( $titre ); ?></h2>
				<?php endif; ?>
			</div>

			<!-- Slider. overflow:hidden posé sur ce conteneur, qui s'étend
			     jusqu'au bord droit de l'écran : les cartes suivantes sont donc
			     rognées par le bord de la fenêtre, pas par une gouttière — c'est
			     ce qui produit le débordement de la maquette. -->
			<div class="event-carousel__slider">
				<div class="swiper event-carousel__swiper" id="<?php echo esc_attr( $uid ); ?>">
					<?php // Groupe à décalage plutôt qu'un .reveal par carte : les cartes
					      // suivantes sont rognées par l'overflow du slider, donc jamais
					      // « visibles » pour un IntersectionObserver — elles resteraient
					      // cachées à jamais. Ici le déclencheur est la PREMIÈRE carte, et
					      // toutes suivent en cascade, y compris hors cadre.
					      //
					      // « top 100% » : même seuil que les titres de carte et la
					      // navigation, le carrousel étant bas dans la section.
					      //
					      // Le délai de 0.4s laisse passer le surtitre et le titre de section
					      // avant que les cartes n'entrent : les trois partaient sinon
					      // ensemble. Un délai plutôt qu'un seuil plus tardif — il tient
					      // l'ordre d'apparition quelle que soit la vitesse de défilement,
					      // là où un seuil se fait rattraper par un scroll rapide. ?>
					<div class="swiper-wrapper" data-stagger-group data-stagger-start="top 100%" data-stagger-delay="0.4">
						<?php foreach ( $events as $event ) : ?>
							<?php
							$image = $event['image'] ?? null;
							if ( $image && ! is_array( $image ) ) {
								$image = array( 'url' => $image, 'alt' => '' );
							}
							$lien      = $event['bouton_lien'] ?? '';
							$is_anchor = $lien && 0 === strpos( $lien, '#' );
							?>
							<article class="swiper-slide event-card" data-stagger-item>
								<?php if ( $image ) : ?>
									<div class="event-card__media">
										<img data-src="<?php echo esc_url( $image['url'] ); ?>"
											alt="<?php echo esc_attr( $image['alt'] ?? '' ); ?>"
											class="lazyload">
									</div>
								<?php endif; ?>

								<div class="event-card__body md:mt-6 mt-5">
									<div class="event-card__meta">
										<?php if ( ! empty( $event['date'] ) ) : ?>
											<p class="event-card__date"><?php echo esc_html( $event['date'] ); ?></p>
										<?php endif; ?>

										<?php if ( ! empty( $event['titre'] ) ) : ?>
											<?php // data-reveal-start="100" : la légende est tout en bas de la
									      // carte, donc son seuil par défaut (80% de la hauteur
									      // d'écran) n'était atteint que bien après l'arrivée du
									      // carrousel. À 100, le titre se révèle dès qu'il touche le
									      // bas de l'écran. ?>
									<h3 class="event-card__title" data-reveal-start="100"><?php echo esc_html( $event['titre'] ); ?></h3>
										<?php endif; ?>

										<?php if ( ! empty( $event['intervenant'] ) ) : ?>
											<p class="event-card__artist"><?php echo esc_html( $event['intervenant'] ); ?></p>
										<?php endif; ?>
									</div>

									<?php if ( ! empty( $event['bouton_texte'] ) && $lien ) : ?>
										<a href="<?php echo esc_url( $lien ); ?>" class="btn-pill event-card__cta"<?php echo $is_anchor ? '' : ' data-barba'; ?>>
											<?php rs_slide_label( $event['bouton_texte'] ); ?>
										</a>
									<?php endif; ?>
								</div>
							</article>
						<?php endforeach; ?>
					</div>
				</div>
			</div>

		</div>

		<!-- Navigation. Dans son propre conteneur, avec la gouttière droite
		     standard : elle reste alignée sur le reste de la page alors que le
		     slider, lui, va jusqu'au bord. Masquée s'il n'y a qu'un événement —
		     il n'y a alors rien à faire défiler. -->
		<?php if ( count( $events ) > 1 ) : ?>
			<?php // Même raison que pour les titres de carte : la navigation est le
			      // dernier élément de la section. Seuil remonté à 100 et délai ramené
			      // de 0.3s à 0.1s — il la décalait d'un cran supplémentaire après un
			      // déclenchement déjà tardif. ?>
			<div class="event-carousel__nav fade-in" data-fade-start="100" data-fade-delay="0.1">
				<button type="button" class="event-carousel__arrow event-carousel__arrow--prev" id="<?php echo esc_attr( $uid ); ?>-prev" aria-label="<?php esc_attr_e( 'Événement précédent', 'rumhora' ); ?>">
					<?php rs_arrow_icon( 'left' ); ?>
				</button>
				<button type="button" class="event-carousel__arrow event-carousel__arrow--next" id="<?php echo esc_attr( $uid ); ?>-next" aria-label="<?php esc_attr_e( 'Événement suivant', 'rumhora' ); ?>">
					<?php rs_arrow_icon( 'right' ); ?>
				</button>
			</div>
		<?php endif; ?>

	</section>
	<?php
}

/**
 * Flèche fine à hampe longue (voir Left-arrow.svg / Right-arrow.svg dans les
 * éléments de la maquette). Inline plutôt qu'un <img> : le trait doit suivre
 * `currentColor` pour changer au survol.
 *
 * @param string $direction 'left' ou 'right'.
 */
function rs_arrow_icon( $direction = 'right' ) {
	// Même tracé pour les deux sens, pivoté de 180° — c'est exactement ce que
	// font les deux SVG de la maquette.
	$transform = 'left' === $direction
		? 'translate(53.719 22.359) rotate(180)'
		: 'translate(0 0.359)';
	?>
	<svg viewBox="0 0 53.719 22.718" fill="none" aria-hidden="true" focusable="false">
		<path d="M41.643,0,53,11,41.643,22M53,11H0"
			transform="<?php echo esc_attr( $transform ); ?>"
			stroke="currentColor" stroke-width="1"/>
	</svg>
	<?php
}
