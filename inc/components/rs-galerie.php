<?php
/**
 * Galerie slider (Swiper) : photo principale, vignettes desktop, flèches
 * mobile, avec titre/description/bouton optionnels en surimpression.
 *
 * Usage :
 *   rs_galerie([
 *       'titre'       => '...',   // ou false pour masquer
 *       'description' => '...',   // ou false pour masquer
 *       'images'      => ['url1', 'url2', ...], // ou [['url'=>..,'alt'=>..], ...]
 *       'bouton'      => ['texte' => '...', 'lien' => '...', 'telechargement' => false],
 *                       // 'telechargement' => true : fichier (PDF...) téléchargé
 *                       // directement (attribut "download"), sans interception
 *                       // Barba (qui casserait le téléchargement)
 *       'clip_path'   => false,   // désactive le masque clip-path au scroll (actif par défaut)
 *       'classes'     => 'lg:h-screen h-[70vw]', // hauteur, ou '' pour remplir le parent
 *   ]);
 *
 * Sans argument, retombe sur les champs ACF de la page courante
 * (galerie_titre, galerie_description, galerie_slides, galerie_btn_*).
 *
 * Le bloc a un reveal au scroll par défaut, comme toutes les photos du site
 * (classe .reveal) — c'est automatique, aucune option à passer.
 *
 * @param array $args
 */
function rs_galerie( $args = array() ) {
	// array_key_exists plutôt que ?? : permet de passer explicitement false
	// pour masquer un élément, là où ?? retomberait sur la valeur ACF.
	$titre       = array_key_exists( 'titre', $args ) ? $args['titre'] : get_field( 'galerie_titre' );
	$description = array_key_exists( 'description', $args ) ? $args['description'] : get_field( 'galerie_description' );
	$clip_path   = $args['clip_path'] ?? true;
	$classes     = $args['classes'] ?? 'h-screen';
	$classes     = '' !== $classes ? $classes : 'h-full';

	// Pleine largeur (hero-like) vs galerie contenue dans une colonne : seule
	// la première passe sous le header et doit donc le garder en mode "section
	// sombre" (voir .header-dark-section dans src/js/header.js). 'h-full' n'est
	// utilisé que par les galeries imbriquées dans une colonne.
	$full_width = 'h-full' !== $classes;

	if ( array_key_exists( 'bouton', $args ) ) {
		$bouton = $args['bouton']; // false = pas de bouton
	} else {
		$btn_texte = get_field( 'galerie_btn_texte' );
		$bouton    = $btn_texte ? array(
			'texte' => $btn_texte,
			'lien'  => get_field( 'galerie_btn_lien' ) ?: '#',
		) : false;
	}

	if ( ! empty( $args['images'] ) ) {
		$slides = array_map(
			function ( $img ) {
				return is_array( $img ) ? $img : array( 'url' => $img, 'alt' => '' );
			},
			$args['images']
		);
	} else {
		$acf_slides = get_field( 'galerie_slides' );
		$slides     = $acf_slides ? array_map(
			function ( $s ) {
				return $s['image'];
			},
			$acf_slides
		) : array();
	}

	// Pas de photo : rien à afficher. Mieux vaut ne rien rendre qu'un slider
	// vide (Swiper se plaint en console et le conteneur garde sa hauteur).
	if ( empty( $slides ) ) {
		return;
	}

	// Identifiant unique par instance : une page peut afficher plusieurs
	// rs_galerie(), et initGalerieSwipers() les retrouve par cet id.
	static $rs_galerie_count = 0;
	$rs_galerie_count++;
	$id        = 'rs-galerie-' . $rs_galerie_count;
	$thumbs_id = $id . '-thumbs';

	$has_text   = $titre || $description;
	$has_thumbs = count( $slides ) > 1;
	?>
	<!-- overflow-hidden seulement avec clip_path (nécessaire pour rogner
	     l'animation) : .section_galerie a déjà le sien, et sans cette condition
	     les flèches mobile ajoutées SOUS le slider seraient rognées par ce
	     conteneur au lieu d'apparaître sous la photo.
	     .has-mobile-dots réduit ce wrapper de 36px (place des flèches, sibling
	     hors de .section_galerie) — posée seulement ici, pas sur
	     .section_galerie dont le h-full retombe naturellement sur les 100%
	     déjà réduits de son parent. -->
	<div class="<?php echo $clip_path ? 'galerie-outer overflow-hidden' : ''; ?> h-full <?php echo $has_thumbs ? 'has-mobile-dots' : ''; ?>">
		<div class="section_galerie reveal <?php echo $full_width ? 'header-dark-section' : ''; ?> relative w-full xl:max-h-screen <?php echo esc_attr( $classes ); ?> overflow-hidden"
			id="<?php echo esc_attr( $id ); ?>"
			data-reveal-companion="#<?php echo esc_attr( $thumbs_id ); ?>, #<?php echo esc_attr( $id ); ?>-arrows">

			<div class="swiper rs-slider-main w-full h-full">
				<div class="swiper-wrapper">
					<?php foreach ( $slides as $slide ) : ?>
						<div class="swiper-slide">
							<img data-src="<?php echo esc_url( $slide['url'] ); ?>"
								alt="<?php echo esc_attr( $slide['alt'] ?? '' ); ?>"
								class="lazyload w-full h-full object-cover object-center scroll-parallax-img">
						</div>
					<?php endforeach; ?>
				</div>
			</div>

			<!-- Barre basse : titre à gauche, vignettes à droite -->
			<div class="section_galerie-content absolute bottom-0 left-0 right-0 z-10 md:px-5 px-[10px] md:pb-5 pb-[10px]">
				<div class="flex flex-col-reverse md:flex-row md:items-end gap-4 lg:pb-8 pb-4 <?php echo $has_text ? 'border-b border-cream' : ''; ?>">
					<?php if ( $titre ) : ?>
						<div class="flex-1">
							<h2 class="text-cream m-0" data-reveal-start="95%"><?php echo wp_kses_post( $titre ); ?></h2>
						</div>
					<?php endif; ?>

					<?php if ( $has_thumbs ) : ?>
						<!-- Wrapper dédié à la visibilité responsive (hidden/md:block) :
						     posée directement sur .swiper, cette classe Tailwind serait
						     battue par le display:block du CSS Swiper (chargé après
						     dist/styles.css), de spécificité égale mais plus tardif. -->
						<div class="hidden md:block flex-shrink-0 w-[160px] lg:w-[280px] ml-auto">
							<div class="swiper rs-slider-thumbs" id="<?php echo esc_attr( $thumbs_id ); ?>">
								<div class="swiper-wrapper">
									<?php foreach ( $slides as $slide ) : ?>
										<?php $thumb_src = ! empty( $slide['sizes']['medium'] ) ? $slide['sizes']['medium'] : $slide['url']; ?>
										<div class="swiper-slide galerie-thumb-slide aspect-square">
											<img data-src="<?php echo esc_url( $thumb_src ); ?>" alt="" class="lazyload w-full h-full object-cover object-center">
										</div>
									<?php endforeach; ?>
								</div>
							</div>
						</div>
					<?php endif; ?>
				</div>

				<?php if ( $description || $bouton ) : ?>
					<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8 mt-4 md:mt-8">
						<?php if ( $description ) : ?>
							<p class="text-reveal text-cream lg:text-lg text-base max-w-lg font-serif" data-reveal-start="95%"><?php echo wp_kses_post( $description ); ?></p>
						<?php endif; ?>

						<?php if ( $bouton ) : ?>
							<?php if ( ! empty( $bouton['telechargement'] ) ) : ?>
								<a href="<?php echo esc_url( $bouton['lien'] ); ?>" class="btn btn-primary flex-shrink-0" download><?php echo esc_html( $bouton['texte'] ); ?></a>
							<?php else : ?>
								<a href="<?php echo esc_url( $bouton['lien'] ); ?>" class="btn btn-primary flex-shrink-0" data-barba><?php echo esc_html( $bouton['texte'] ); ?></a>
							<?php endif; ?>
						<?php endif; ?>
					</div>
				<?php endif; ?>
			</div>

		</div>
	</div>

	<?php if ( $has_thumbs ) : ?>
		<!-- Flèches précédent/suivant mobile, côte à côte à droite, SOUS le
		     slider (pas superposées à la photo) — les vignettes sont
		     l'équivalent desktop. Hauteur totale 36px, qui correspond à la marge
		     réservée par .has-mobile-dots dans _galerie.scss. Swiper les
		     désactive automatiquement en début/fin de slider, sauf en mode loop.
		     L'id est ciblé par data-reveal-companion ci-dessus : elles
		     n'apparaissent qu'une fois le reveal de la photo terminé. -->
		<div class="md:hidden flex items-end justify-end gap-2 h-[36px] px-[10px]" id="<?php echo esc_attr( $id ); ?>-arrows">
			<button type="button" class="galerie-nav-arrow" id="<?php echo esc_attr( $id ); ?>-prev" aria-label="<?php esc_attr_e( 'Photo précédente', 'rumhora' ); ?>">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<line x1="19" y1="12" x2="5" y2="12"/>
					<polyline points="12 5 5 12 12 19"/>
				</svg>
			</button>
			<button type="button" class="galerie-nav-arrow" id="<?php echo esc_attr( $id ); ?>-next" aria-label="<?php esc_attr_e( 'Photo suivante', 'rumhora' ); ?>">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<line x1="5" y1="12" x2="19" y2="12"/>
					<polyline points="12 5 19 12 12 19"/>
				</svg>
			</button>
		</div>
	<?php endif; ?>
	<?php
}
