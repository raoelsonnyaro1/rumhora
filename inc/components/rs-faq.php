<?php
/**
 * Accordéon FAQ.
 *
 * Composant purement présentationnel : chaque page va chercher ses propres
 * champs ACF (le nom du repeater peut différer d'une page à l'autre) et les
 * passe ici.
 *
 * L'ouverture/fermeture au clic est gérée par initFaqAccordion()
 * (src/js/animations.js) — volontairement pas en <script> inline : un script
 * injecté via le HTML d'un container Barba ne s'exécute jamais.
 *
 * Usage :
 *   rs_faq([
 *       'titre' => get_field('faq_titre') ?: 'FAQ',
 *       'items' => get_field('faq_items'), // [['question' => '', 'reponse' => ''], ...]
 *   ]);
 *
 * @param array $args
 */
function rs_faq( $args = array() ) {
	$titre = $args['titre'] ?? __( 'FAQ', 'rumhora' );
	$items = $args['items'] ?? array();

	if ( empty( $items ) || ! is_array( $items ) ) {
		return;
	}

	// Identifiant unique par instance : une page peut afficher plusieurs
	// rs_faq(), et les aria-controls/id doivent rester uniques dans le document.
	static $rs_faq_count = 0;
	$rs_faq_count++;
	$id = 'rs-faq-' . $rs_faq_count;
	?>
	<section class="md:px-5 px-[10px] md:pt-10 pt-6 md:pb-28 pb-12 border-t border-dark">
		<div class="grid md:grid-cols-3 grid-cols-1 md:gap-6 gap-8">

			<div>
				<h2 class="m-0"><?php echo wp_kses_post( $titre ); ?></h2>
			</div>

			<!-- .faq-list : groupe l'accordéon (un seul item ouvert à la fois PAR
			     groupe, voir initFaqAccordion) et le reveal en cascade de ses
			     items (voir initStaggerReveal). -->
			<div class="faq-list md:col-span-2">
				<?php foreach ( $items as $i => $item ) : ?>
					<div class="faq-item border-b border-dark">
						<button
							class="faq-question w-full text-left flex justify-between items-center md:p-5 p-4 gap-4"
							aria-expanded="false"
							aria-controls="<?php echo esc_attr( $id . '-answer-' . $i ); ?>"
						>
							<span class="lg:text-xl text-base font-semibold"><?php echo wp_kses_post( $item['question'] ?? '' ); ?></span>
							<!-- Icône "+" en 2 barres : la verticale pivote à 90° à
							     l'ouverture (CSS, voir .faq-icon-v dans style.scss). -->
							<span class="faq-icon flex-shrink-0 w-5 h-5 relative opacity-60" aria-hidden="true">
								<span class="block absolute top-1/2 left-0 w-full h-px bg-current transform -translate-y-1/2"></span>
								<span class="faq-icon-v block absolute top-0 left-1/2 h-full w-px bg-current"></span>
							</span>
						</button>
						<!-- max-height animée en JS (scrollHeight) : on ne peut pas
						     transitionner vers "height:auto" en CSS pur. -->
						<div
							id="<?php echo esc_attr( $id . '-answer-' . $i ); ?>"
							class="faq-answer overflow-hidden"
							style="max-height:0; transition: max-height 0.4s ease;"
						>
							<?php if ( ! empty( $item['reponse'] ) ) : ?>
								<p class="text-sm md:pb-5 pb-4 md:px-5 px-4 m-0"><?php echo wp_kses_post( $item['reponse'] ); ?></p>
							<?php endif; ?>
						</div>
					</div>
				<?php endforeach; ?>
			</div>

		</div>
	</section>
	<?php
}
