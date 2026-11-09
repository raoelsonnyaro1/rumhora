<?php
/**
 * Section « portrait + citation » : bloc éditorial à gauche, portrait en
 * grand format au centre, citation à droite, le tout en composition
 * superposée (le portrait chevauche le titre et le cartouche décoratif).
 *
 * Composant générique malgré son usage « Featured chef » sur l'accueil :
 * c'est une mise en avant de personne, réutilisable pour un artiste, un
 * sommelier, un invité.
 *
 * Hooks d'animation (voir src/js/animations.js) :
 *   .fade-in      surtitre et cartouche décoratif
 *   h2            titre, révélé ligne par ligne (SplitText)
 *   .text-reveal  paragraphe et citation
 *   .reveal       portrait (glissement + fondu au scroll)
 *
 * Le titre accepte du HTML : un <em> y est rendu en doré (voir .hero-title em
 * et .portrait-quote__title em) — c'est le bouton « italique » de l'éditeur.
 *
 * Usage :
 *   rs_portrait_quote([
 *       'surtitre' => 'Featured chef',
 *       'titre'    => 'The Chef <em>behind the experience</em>',
 *       'texte'    => '...',
 *       'image'    => $image_acf,
 *       'citation' => 'Food is about bringing people together…',
 *   ]);
 *
 * @param array $args
 */
function rs_portrait_quote( $args = array() ) {
	$surtitre = $args['surtitre'] ?? '';
	$titre    = $args['titre'] ?? '';
	$texte    = $args['texte'] ?? '';
	$citation = $args['citation'] ?? '';
	$id       = $args['id'] ?? '';

	$image = $args['image'] ?? null;
	if ( $image && ! is_array( $image ) ) {
		$image = array( 'url' => $image, 'alt' => '' );
	}

	// Sans portrait, la composition entière n'a plus de sujet : mieux vaut ne
	// rien rendre qu'une grille vide aux proportions bancales.
	if ( ! $image ) {
		return;
	}
	?>
	<section class="portrait-quote xl:px-14 md:px-8 px-5 md:py-28 py-16"
		<?php echo $id ? ' id="' . esc_attr( $id ) . '"' : ''; ?>>

		<div class="portrait-quote__grid">

			<!-- Bloc éditorial -->
			<div class="portrait-quote__text">
				<?php if ( $surtitre ) : ?>
					<p class="eyebrow fade-in"><?php echo esc_html( $surtitre ); ?></p>
				<?php endif; ?>

				<?php if ( $titre ) : ?>
					<h2 class="portrait-quote__title md:mt-5 mt-4"><?php echo wp_kses_post( $titre ); ?></h2>
				<?php endif; ?>

				<?php if ( $texte ) : ?>
					<p class="text-reveal portrait-quote__body md:mt-10 mt-6"><?php echo wp_kses_post( $texte ); ?></p>
				<?php endif; ?>
			</div>

			<!-- Cartouche décoratif : purement graphique, donc aria-hidden et
			     masqué sous lg où la composition se déplie en pile. -->
			<div class="portrait-quote__decor fade-in" aria-hidden="true"></div>

			<!-- Portrait -->
			<div class="portrait-quote__portrait">
				<div class="reveal portrait-quote__frame">
					<img data-src="<?php echo esc_url( $image['url'] ); ?>"
						alt="<?php echo esc_attr( $image['alt'] ?? '' ); ?>"
						class="lazyload">
				</div>
			</div>

			<?php if ( $citation ) : ?>
				<!-- Les guillemets sont concaténés au texte, PAS posés en CSS via
				     ::before/::after : .text-reveal fait passer le contenu par
				     SplitText, qui le redécoupe en <div> de ligne — les
				     pseudo-éléments du blockquote se retrouvent alors éjectés sur
				     leurs propres lignes, au-dessus et en dessous de la citation.
				     Intégrés au texte, ils suivent le flux normalement.

				     Le gabarit passe par _x() : une version française du site
				     pourra le traduire en « … » sans que le champ ACF n'ait à
				     contenir de guillemets. -->
				<blockquote class="portrait-quote__quote text-reveal"><?php
					printf(
						/* translators: %s : texte de la citation. Adapter les guillemets à la typographie de la langue. */
						wp_kses_post( _x( '“%s”', 'guillemets encadrant une citation', 'rumhora' ) ),
						wp_kses_post( $citation )
					);
				?></blockquote>
			<?php endif; ?>

		</div>
	</section>
	<?php
}
