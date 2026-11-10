<?php
/**
 * Libellé de bouton à glissement vertical au survol.
 *
 * Le texte est rendu DEUX fois dans une boîte à `overflow: hidden` : la copie
 * visible glisse vers le haut, la seconde entre par le bas. Le relais est
 * invisible parce que les deux copies occupent exactement la même boîte (voir
 * .btn-slide dans _buttons.scss).
 *
 * La copie est un vrai <span aria-hidden="true"> plutôt qu'un
 * `::after { content: attr(data-text) }` : plusieurs lecteurs d'écran
 * annoncent le contenu des pseudo-éléments, et le libellé serait alors lu deux
 * fois. Avec aria-hidden, l'arbre d'accessibilité ne voit qu'un seul texte.
 *
 * Usage (à l'intérieur d'un .btn-pill ou d'un .btn-circle, qui portent l'état
 * de survol) :
 *   <a class="btn-pill"><?php rs_slide_label( 'Book Table' ); ?></a>
 *
 * @param string $texte   Libellé, échappé ici.
 * @param string $classes Classes supplémentaires sur la boîte (ex: le
 *                        btn-circle__label qui porte le z-index au-dessus de
 *                        l'arc).
 */
function rs_slide_label( $texte, $classes = '' ) {
	if ( '' === $texte || null === $texte ) {
		return;
	}
	?>
	<span class="btn-slide <?php echo esc_attr( $classes ); ?>">
		<span class="btn-slide__in"><?php echo esc_html( $texte ); ?></span>
		<span class="btn-slide__in btn-slide__in--dup" aria-hidden="true"><?php echo esc_html( $texte ); ?></span>
	</span>
	<?php
}
