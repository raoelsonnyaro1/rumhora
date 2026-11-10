<?php
/**
 * Hero « texte à gauche / photos décalées à droite » (maquette Accueil).
 *
 * Fond photo très sombre en pleine largeur, titre + accroche + 2 boutons à
 * gauche, et deux photos superposées en quinconce à droite.
 *
 * Hooks d'animation (voir src/js/animations.js, initHeroIntro) :
 *   .section_hero            déclenche la séquence d'entrée et signale au
 *                            header qu'il survole une section sombre
 *   h1                       titre, révélé ligne par ligne (SplitText)
 *   .section_hero_content
 *     .text-reveal           accroche, révélée juste après le titre
 *   .hero-bottom-row-line    filet qui se dessine
 *   .hero-bottom-row         bloc des boutons, monte depuis le bas
 *   .hero-media-item         photos de droite, révélées en cascade
 *
 * Le titre accepte du HTML : un <em> y est rendu en doré (voir .hero-title em
 * dans _hero.scss) — c'est le bouton « italique » de l'éditeur, donc pas
 * besoin d'expliquer une syntaxe au client pour mettre un mot en avant.
 *
 * Usage :
 *   rs_hero_split([
 *       'titre'       => 'A <em>Timeless</em> Culinary<br>& Musical Journey',
 *       'description' => '...',
 *       'boutons'     => [['texte' => '...', 'lien' => '...'], ...], // 2 max
 *       'image_fond'  => $url,
 *       'images'      => [$image1, $image2],
 *   ]);
 *
 * Sans argument, lit les champs ACF de la page courante (hero_titre,
 * hero_description, hero_image, hero_media_1, hero_media_2, hero_cta_*).
 *
 * @param array $args
 */
function rs_hero_split( $args = array() ) {
	$titre       = $args['titre'] ?? ( get_field( 'hero_titre' ) ?: '' );
	$description = $args['description'] ?? ( get_field( 'hero_description' ) ?: '' );

	// Fond : champ ACF, sinon valeur passée par le template, sinon l'image de
	// la maquette embarquée dans le thème.
	$image_fond = $args['image_fond'] ?? get_field( 'hero_image' );
	if ( is_array( $image_fond ) ) {
		$image_fond = $image_fond['url'] ?? '';
	}
	if ( ! $image_fond ) {
		$image_fond = get_template_directory_uri() . '/img/hero-accueil-bg.webp';
	}

	// Photos de droite : normalisées en ['url' => , 'alt' => ] quel que soit le
	// format d'entrée (tableau ACF ou simple URL).
	$images = $args['images'] ?? array( get_field( 'hero_media_1' ), get_field( 'hero_media_2' ) );
	$images = array_values(
		array_filter(
			array_map(
				function ( $img ) {
					if ( empty( $img ) ) {
						return null;
					}
					return is_array( $img ) ? $img : array( 'url' => $img, 'alt' => '' );
				},
				(array) $images
			)
		)
	);

	if ( empty( $images ) ) {
		$images = array(
			array( 'url' => get_template_directory_uri() . '/img/hero-accueil-1.webp', 'alt' => '' ),
			array( 'url' => get_template_directory_uri() . '/img/hero-accueil-2.webp', 'alt' => '' ),
		);
	}

	// Boutons : 2 maximum (la composition de la maquette n'en prévoit pas plus).
	if ( isset( $args['boutons'] ) ) {
		$boutons = $args['boutons'];
	} else {
		$boutons = array();
		foreach ( array( 1, 2 ) as $i ) {
			$texte = get_field( "hero_cta{$i}_texte" );
			if ( $texte ) {
				$boutons[] = array(
					'texte' => $texte,
					'lien'  => get_field( "hero_cta{$i}_lien" ) ?: '#',
				);
			}
		}
	}
	$boutons = array_slice( $boutons, 0, 2 );
	?>
	<section class="section_hero relative w-full min-h-[100svh] flex items-center overflow-hidden">

		<!-- Fond. <picture> volontairement (plutôt qu'un background-image CSS) :
		     initHeroIntro() attend `picture img` avant de lancer la séquence
		     d'entrée, pour ne jamais révéler le titre sur un fond encore vide.
		     Pas de lazyload non plus — c'est l'image LCP de la page. -->
		<picture class="hero-bg absolute inset-0">
			<img src="<?php echo esc_url( $image_fond ); ?>"
				alt=""
				aria-hidden="true"
				class="w-full h-full object-cover"
				fetchpriority="high">
		</picture>

		<!-- Voile : le fond est déjà très sombre, ce dégradé ne fait que creuser
		     la moitié gauche pour garantir le contraste du texte quelle que soit
		     la photo choisie par le client. -->
		<div class="hero-veil absolute inset-0 pointer-events-none" aria-hidden="true"></div>

		<!-- hero-grid : à partir de lg, le bloc texte et la grappe de photos
		     partagent la MÊME ligne de grille et se chevauchent volontairement —
		     le titre passe par-dessus la première photo, et la seconde file
		     au-delà du bord droit de l'écran. Toute la géométrie est dans
		     _hero.scss ; les classes Tailwind ne portent ici que les gouttières
		     et le rythme vertical. -->
		<div class="hero-grid relative z-10 w-full grid items-center xl:gap-12 gap-8 xl:px-14 md:px-8 px-5 md:pt-32 pt-28 md:pb-16 pb-12">

			<!-- Colonne texte. Pas de max-width ici : le titre doit pouvoir occuper
			     toute la colonne pour tenir sur 2 lignes comme dans la maquette
			     (c'est .hero-lead qui borne sa propre largeur de mesure). -->
			<div class="section_hero_content">
				<?php if ( $titre ) : ?>
					<h1 class="hero-title"><?php echo wp_kses_post( $titre ); ?></h1>
				<?php endif; ?>

				<?php if ( $description ) : ?>
					<p class="text-reveal hero-lead md:mt-8 mt-6"><?php echo wp_kses_post( $description ); ?></p>
				<?php endif; ?>

				<?php if ( $boutons ) : ?>
					<div class="hero-bottom-row flex flex-wrap items-center md:gap-14 gap-8 md:mt-16 mt-10">
						<?php foreach ( $boutons as $bouton ) : ?>
							<?php
							// data-barba omis pour une ancre (#...) : Barba ne doit pas
							// lancer un cycle de navigation complet pour un scroll sur
							// la page courante (voir initAnchorScroll).
							$lien      = $bouton['lien'] ?? '#';
							$is_anchor = 0 === strpos( $lien, '#' );
							?>
							<a href="<?php echo esc_url( $lien ); ?>" class="btn-circle"<?php echo $is_anchor ? '' : ' data-barba'; ?>>
								<span class="btn-circle__label"><?php echo esc_html( $bouton['texte'] ?? '' ); ?></span>
								<?php rs_circle_arc(); ?>
							</a>
						<?php endforeach; ?>
					</div>
				<?php endif; ?>
			</div>

			<!-- Colonne photos : quinconce, la 2e décalée vers le bas et la droite -->
			<div class="hero-media relative">
				<?php foreach ( array_slice( $images, 0, 2 ) as $i => $image ) : ?>
					<!-- Pas de `m-0` ici : cet utilitaire Tailwind est émis APRÈS le
					     SCSS compilé et écraserait le margin-top qui décale la 2e
					     photo (voir .hero-media-item--2). Le reset global `*{margin:0}`
					     suffit de toute façon. -->
					<figure class="hero-media-item hero-media-item--<?php echo (int) ( $i + 1 ); ?>">
						<img data-src="<?php echo esc_url( $image['url'] ); ?>"
							alt="<?php echo esc_attr( $image['alt'] ?? '' ); ?>"
							class="lazyload w-full h-full object-cover">
					</figure>
				<?php endforeach; ?>
			</div>

		</div>
	</section>
	<?php
}

/**
 * Arc doré ouvert sur la gauche, posé à droite du libellé d'un .btn-circle
 * (voir « Ellipse Button » dans les éléments de la maquette). L'ouverture est
 * du côté par lequel le texte entre dans le cercle : c'est ce qui permet au
 * libellé de chevaucher l'arc sans que le trait ne le coupe.
 *
 * Inline plutôt qu'un <img> : le trait doit suivre `currentColor` pour changer
 * au survol, ce qu'une image externe ne permet pas.
 */
function rs_circle_arc() {
	?>
	<svg class="btn-circle__arc" viewBox="0 0 52.714 60.724" fill="none" aria-hidden="true" focusable="false">
		<path d="M51.836,49.536A29.394,29.394,0,0,1,29.581,59.724,29.863,29.863,0,0,1,29.581,0,29.394,29.394,0,0,1,51.836,10.188"
			transform="translate(52.213 60.224) rotate(-180)"
			stroke="currentColor" stroke-width="1"/>
	</svg>
	<?php
}
