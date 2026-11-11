<?php
/**
 * Icônes de réseaux sociaux du footer.
 *
 * Les tracés viennent directement des SVG fournis avec la maquette
 * (assets/elements/_Footer Elements/), réécrits en `fill="currentColor"` : la
 * couleur est ainsi pilotée par le CSS et peut changer au survol, ce qu'un
 * <img> externe ne permettrait pas.
 *
 * Les URLs sont lues depuis Options du Thème > Réseaux sociaux. Un champ vide
 * masque simplement l'icône, plutôt que de pointer vers un faux lien.
 *
 * Usage :
 *   rs_social_icons();                             // taille par défaut
 *   rs_social_icons(['class' => 'gap-5']);         // classes du conteneur
 *
 * @param array $args
 */
function rs_social_icons( $args = array() ) {
	$class = $args['class'] ?? 'gap-4';

	$available = array(
		array(
			'key'   => 'facebook',
			'label' => 'Facebook',
			'svg'   => '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M2,0A2,2,0,0,0,0,2V14a2,2,0,0,0,2,2H8V10.5H6V8H8V6a3,3,0,0,1,3-3h2V5.5H12c-.552,0-1-.052-1,.5V8h2.5l-1,2.5H11V16h3a2,2,0,0,0,2-2V2a2,2,0,0,0-2-2Z"/></svg>',
		),
		array(
			'key'   => 'instagram',
			'label' => 'Instagram',
			'svg'   => '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false"><path d="M11.277,1.446a3.669,3.669,0,0,1,1.446.289,3.208,3.208,0,0,1,.964.578,2,2,0,0,1,.578.964,7.253,7.253,0,0,1,.289,1.446v6.554a3.671,3.671,0,0,1-.289,1.446,3.207,3.207,0,0,1-.578.964,2,2,0,0,1-.964.578,7.253,7.253,0,0,1-1.446.289H4.723a3.671,3.671,0,0,1-1.446-.289,3.208,3.208,0,0,1-.964-.578,2,2,0,0,1-.578-.964,7.244,7.244,0,0,1-.289-1.446V4.723a3.669,3.669,0,0,1,.289-1.446,3.208,3.208,0,0,1,.578-.964,2,2,0,0,1,.964-.578,7.244,7.244,0,0,1,1.446-.289h6.554ZM4.723,0A4.837,4.837,0,0,0,2.8.386a4.209,4.209,0,0,0-1.446.964A4.746,4.746,0,0,0,.386,2.8,7.463,7.463,0,0,0,0,4.723v6.554A4.837,4.837,0,0,0,.386,13.2a4.209,4.209,0,0,0,.964,1.446,4.747,4.747,0,0,0,1.446.964A7.467,7.467,0,0,0,4.723,16h6.554a4.838,4.838,0,0,0,1.928-.385,4.21,4.21,0,0,0,1.446-.964,4.747,4.747,0,0,0,.964-1.446A7.467,7.467,0,0,0,16,11.277V4.723A4.839,4.839,0,0,0,15.615,2.8a4.21,4.21,0,0,0-.964-1.446A4.745,4.745,0,0,0,13.2.386,7.463,7.463,0,0,0,11.277,0H4.723ZM3.855,8A4.145,4.145,0,1,0,8,3.855,4.114,4.114,0,0,0,3.855,8ZM5.3,8a2.7,2.7,0,0,1,5.4,0A2.758,2.758,0,0,1,8,10.7,2.694,2.694,0,0,1,5.3,8Zm7.9-4.241a.964.964,0,1,0-.964.964A.964.964,0,0,0,13.2,3.759Z"/></svg>',
		),
		array(
			'key'   => 'whatsapp',
			'label' => 'WhatsApp',
			'svg'   => '<svg viewBox="0 0 18 18" fill="currentColor" aria-hidden="true" focusable="false"><path d="M9,0A8.957,8.957,0,0,0,1.238,13.5L0,18l4.725-1.237A9.686,9.686,0,0,0,9,17.888a9.026,9.026,0,0,0,9-9,8.959,8.959,0,0,0-2.7-6.3A8.848,8.848,0,0,0,9,0ZM5.175,15.413,4.95,15.3l-2.812.787.788-2.7L2.7,13.05A7.238,7.238,0,0,1,1.575,9.113,7.491,7.491,0,0,1,9,1.688a7.688,7.688,0,0,1,5.288,2.138,7.214,7.214,0,0,1,2.137,5.288A7.4,7.4,0,0,1,9,16.425,7.482,7.482,0,0,1,5.175,15.413Zm6.3-5.288c-.225-.113-.338-.113-.45.113s-.562.675-.675.9c-.113.113-.225.113-.45.113a6.291,6.291,0,0,1-1.8-1.125A5.468,5.468,0,0,1,6.863,8.55c-.113-.225,0-.338.112-.45l.337-.338c.113-.112.113-.225.225-.337s0-.225,0-.338A12.84,12.84,0,0,0,6.863,5.4a.42.42,0,0,0-.45-.338h-.45a.727.727,0,0,0-.562.225A2.518,2.518,0,0,0,4.613,7.2a4.813,4.813,0,0,0,.9,2.363,9.69,9.69,0,0,0,3.825,3.375,4.487,4.487,0,0,0,2.7.563A1.982,1.982,0,0,0,13.5,12.488c.225-.562.225-1.012.113-1.012a.727.727,0,0,0-.562-.675A9.481,9.481,0,0,0,11.475,10.125Z"/></svg>',
		),
	);

	$icons = array();
	foreach ( $available as $icon ) {
		// WhatsApp n'a pas d'URL propre : il se déduit du téléphone du footer
		// (format wa.me, sans le "+"), comme le lien de contact rapide.
		// rumhora_contact() et non get_field() en direct : ACF n'étant pas
		// installé, get_field() renvoie toujours null et aucune icône ne se
		// rendait — alors que la maquette en montre trois.
		if ( 'whatsapp' === $icon['key'] ) {
			$phone = rumhora_contact( 'phone' );
			$icon['url'] = $phone ? 'https://wa.me/' . preg_replace( '/[^0-9]/', '', $phone ) : '';
		} else {
			$icon['url'] = rumhora_contact( $icon['key'] );
		}

		if ( $icon['url'] ) {
			$icons[] = $icon;
		}
	}

	if ( empty( $icons ) ) {
		return;
	}
	?>
	<ul class="social-icons flex items-center <?php echo esc_attr( $class ); ?>">
		<?php foreach ( $icons as $icon ) : ?>
			<li class="social-reveal-item">
				<a href="<?php echo esc_url( $icon['url'] ); ?>"
					target="_blank"
					rel="noopener"
					aria-label="<?php echo esc_attr( $icon['label'] ); ?>"
					class="social-icon">
					<?php echo $icon['svg']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- SVG codé en dur ci-dessus, pas une saisie utilisateur. ?>
				</a>
			</li>
		<?php endforeach; ?>
	</ul>
	<?php
}
