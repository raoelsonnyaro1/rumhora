<?php
/**
 * Icônes de réseaux sociaux en cercle. Les URLs sont lues depuis la page
 * d'options ACF (Options du Thème > Réseaux sociaux, voir
 * acf-json/group_theme_options.json) — un champ vide masque simplement
 * l'icône correspondante, plutôt que de pointer vers un faux lien.
 *
 * 3 variantes visuelles :
 *   'outline'       cercle transparent, bordure/icône crème — fond sombre (footer)
 *   'outline-dark'  identique mais bordure/icône sombres — fond clair
 *   'solid'         cercle plein sombre, icône crème
 *
 * Usage :
 *   rs_social_icons();                               // variante 'outline'
 *   rs_social_icons(['variant' => 'outline-dark']);
 *   rs_social_icons(['variant' => 'solid']);
 *
 * @param array $args
 */
function rs_social_icons( $args = array() ) {
	$variant = $args['variant'] ?? 'outline';

	// Les SVG utilisent fill="currentColor" (pas une couleur en dur) pour
	// suivre la couleur de chaque variante.
	$available = array(
		array(
			'label' => 'Instagram',
			'url'   => get_field( 'footer_instagram', 'option' ),
			'svg'   => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none"/></svg>',
		),
		array(
			'label' => 'Facebook',
			'url'   => get_field( 'footer_facebook', 'option' ),
			'svg'   => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.7 1.7-1.7H17V2.4A23 23 0 0 0 14.6 2c-2.4 0-4.1 1.5-4.1 4.2v3.3H7.5V13h3v9h3Z"/></svg>',
		),
		array(
			'label' => 'TripAdvisor',
			'url'   => get_field( 'footer_tripadvisor', 'option' ),
			'svg'   => '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="13" r="4.2"/><circle cx="17" cy="13" r="4.2"/><circle cx="7" cy="13" r="1.4" fill="currentColor" stroke="none"/><circle cx="17" cy="13" r="1.4" fill="currentColor" stroke="none"/><path d="M4.2 9.3A12.4 12.4 0 0 1 12 6.8c2.9 0 5.6.9 7.8 2.5"/></svg>',
		),
		array(
			'label' => 'LinkedIn',
			'url'   => get_field( 'footer_linkedin', 'option' ),
			'svg'   => '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM2.4 21h5.2V9.6H2.4V21Zm7.8 0h5.2v-6.3c0-1.7.6-2.8 2.1-2.8 1.4 0 1.9 1 1.9 2.8V21h5.2v-6.9c0-3.5-1.9-5.2-4.4-5.2a3.8 3.8 0 0 0-3.5 1.9h-.1V9.6h-5.2c.1 1.5 0 11.4 0 11.4Z"/></svg>',
		),
		array(
			'label' => 'YouTube',
			'url'   => get_field( 'footer_youtube', 'option' ),
			'svg'   => '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.5 7.4a2.8 2.8 0 0 0-1.9-2C18.9 5 12 5 12 5s-6.9 0-8.6.4a2.8 2.8 0 0 0-1.9 2A29 29 0 0 0 1.1 12a29 29 0 0 0 .4 4.6 2.8 2.8 0 0 0 1.9 2C5.1 19 12 19 12 19s6.9 0 8.6-.4a2.8 2.8 0 0 0 1.9-2 29 29 0 0 0 .4-4.6 29 29 0 0 0-.4-4.6ZM9.8 15.1V8.9l5.6 3.1-5.6 3.1Z"/></svg>',
		),
	);

	$icons = array_filter(
		$available,
		function ( $icon ) {
			return ! empty( $icon['url'] );
		}
	);

	if ( empty( $icons ) ) {
		return;
	}

	if ( 'solid' === $variant ) {
		// ring (box-shadow) plutôt que border : une bordure se dessine à
		// l'INTÉRIEUR de la boîte et se ferait recouvrir par le voile ::before
		// de .social-icon-wipe ; le ring se dessine à l'extérieur, jamais
		// affecté par un pseudo-élément interne.
		$circle_class = 'bg-dark text-heading social-icon-wipe hover:ring-2 hover:ring-heading';
	} elseif ( 'outline-dark' === $variant ) {
		$circle_class = 'border border-dark/40 text-dark hover:bg-dark/10 hover:border-dark transition-colors';
	} else {
		$circle_class = 'border border-heading/60 text-heading hover:bg-heading/20 hover:border-heading transition-colors';
	}

	foreach ( $icons as $icon ) :
		?>
		<a href="<?php echo esc_url( $icon['url'] ); ?>"
			target="_blank"
			rel="noopener"
			aria-label="<?php echo esc_attr( $icon['label'] ); ?>"
			class="social-reveal-item w-8 h-8 rounded-full flex items-center justify-center <?php echo esc_attr( $circle_class ); ?>">
			<?php echo $icon['svg']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG codé en dur ci-dessus, pas une saisie utilisateur. ?>
		</a>
		<?php
	endforeach;
}
