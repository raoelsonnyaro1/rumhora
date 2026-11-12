<?php
/**
 * Section à deux colonnes : bloc éditorial (surtitre, titre, texte, bouton)
 * d'un côté, photo de l'autre.
 *
 * À partir de lg, les deux blocs se CHEVAUCHENT : le titre déborde sur la
 * photo, comme dans le hero. Le paragraphe et le bouton, eux, restent dans la
 * colonne de gauche — c'est leur mesure courte (36ch) qui les en empêche, pas
 * une largeur codée en dur (voir _text-media.scss).
 *
 * Composant générique — c'est la composition de la section « About us » de
 * l'accueil, mais rien n'y est propre à cette page : elle resservira pour
 * Story, Privatisations, etc. L'argument 'invert' place la photo à gauche,
 * pour alterner d'une section à l'autre.
 *
 * Hooks d'animation (voir src/js/animations.js) :
 *   .fade-in      surtitre et bouton
 *   h2            titre, révélé ligne par ligne (SplitText)
 *   .text-reveal  paragraphe
 *   .reveal       photo (glissement + fondu au scroll)
 *
 * Usage :
 *   rs_text_media([
 *       'surtitre'     => 'About us',
 *       'titre'        => 'An architecture of flavor and sound.',
 *       'texte'        => '...',
 *       'bouton_texte' => 'Discover Our Story',
 *       'bouton_lien'  => home_url('/story'),
 *       'image'        => $image_acf,          // tableau ACF ou URL
 *       'invert'       => true,                // photo à gauche
 *       'fond'         => 'surface',           // 'surface' (défaut) | 'page'
 *       'id'           => 'about',             // ancre
 *   ]);
 *
 * @param array $args
 */
function rs_text_media( $args = array() ) {
	$surtitre     = $args['surtitre'] ?? '';
	$titre        = $args['titre'] ?? '';
	$texte        = $args['texte'] ?? '';
	$bouton_texte = $args['bouton_texte'] ?? '';
	$bouton_lien  = $args['bouton_lien'] ?? '#';
	$invert       = ! empty( $args['invert'] );
	$id           = $args['id'] ?? '';

	// 'page' laisse apparaître le fond du site ; 'surface' pose le ton
	// intermédiaire de la maquette (depth tone 1), qui détache la section.
	$fond = ( 'page' === ( $args['fond'] ?? 'surface' ) ) ? '' : 'text-media--surface';

	$image = $args['image'] ?? null;
	if ( $image && ! is_array( $image ) ) {
		$image = array( 'url' => $image, 'alt' => '' );
	}

	// Sans titre NI image, il ne reste rien qui justifie de rendre la section.
	if ( ! $titre && ! $image ) {
		return;
	}
	?>
	<?php // Pas de `md:py-28 py-16` ici : le rythme vertical est déclaré en SCSS,
	      // où le desktop reçoit les 125pt de la maquette. Tailwind émet ses
	      // utilitaires APRÈS le SCSS compilé et écraserait ce padding. ?>
	<section class="text-media <?php echo esc_attr( $fond ); ?> <?php echo $invert ? 'text-media--invert' : ''; ?> gutter-x"
		<?php echo $id ? ' id="' . esc_attr( $id ) . '"' : ''; ?>>

		<!-- Pas de classes `grid lg:grid-cols-2 items-center` ici : à partir de
		     lg, le bloc éditorial et la photo partagent la MÊME ligne de grille
		     et se chevauchent (voir _text-media.scss). Ces utilitaires Tailwind
		     sont émis APRÈS le SCSS compilé et écraseraient la grille — c'est
		     exactement ce qui avait fait disparaître les photos du hero. Seules
		     les gouttières restent en utilitaires, elles ne sont pas en conflit. -->
		<div class="text-media__grid xl:gap-20 lg:gap-12 gap-10">

			<!-- Colonne éditoriale. L'ordre DOM garde le texte en premier (c'est
			     lui qui porte le sens) ; seul l'ordre visuel s'inverse, par les
			     numéros de colonne posés en SCSS — un lecteur d'écran lit donc
			     toujours le texte avant la photo, quelle que soit la variante. -->
			<div class="text-media__content">
				<?php if ( $surtitre ) : ?>
					<p class="eyebrow fade-in"><?php echo esc_html( $surtitre ); ?></p>
				<?php endif; ?>

				<?php if ( $titre ) : ?>
					<h2 class="text-media__title md:mt-5 mt-4"><?php echo wp_kses_post( $titre ); ?></h2>
				<?php endif; ?>

				<?php if ( $texte ) : ?>
					<p class="text-reveal text-media__text md:mt-8 mt-6"><?php echo wp_kses_post( $texte ); ?></p>
				<?php endif; ?>

				<?php if ( $bouton_texte ) : ?>
					<?php
					// data-barba omis pour une ancre : Barba ne doit pas lancer un
					// cycle de navigation complet pour un scroll sur la page courante.
					$is_anchor = 0 === strpos( $bouton_lien, '#' );
					?>
					<div class="md:mt-12 mt-9 fade-in" data-fade-delay="0.25">
						<a href="<?php echo esc_url( $bouton_lien ); ?>" class="btn-circle"<?php echo $is_anchor ? '' : ' data-barba'; ?>>
							<?php rs_slide_label( $bouton_texte, 'btn-circle__label' ); ?>
							<?php rs_circle_arc(); ?>
						</a>
					</div>
				<?php endif; ?>
			</div>

			<!-- Colonne photo. Volontairement SANS voile ni dégradé là où le titre
			     la chevauche : la photo est rendue fidèlement, telle qu'elle a été
			     chargée. C'est donc au choix de l'image de garantir le contraste du
			     titre — prévoir une zone sombre sur son tiers gauche. -->
			<?php if ( $image ) : ?>
				<div class="text-media__media">
					<div class="reveal text-media__frame scroll-parallax-box">
						<img data-src="<?php echo esc_url( $image['url'] ); ?>"
							alt="<?php echo esc_attr( $image['alt'] ?? '' ); ?>"
							class="lazyload">
					</div>
				</div>
			<?php endif; ?>

		</div>
	</section>
	<?php
}
