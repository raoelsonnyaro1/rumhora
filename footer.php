<?php
/**
 * Pied de page : fermeture du container Barba puis footer (volontairement
 * EN DEHORS du container, pour rester persistant entre les pages — son
 * contenu est resynchronisé à chaque transition par
 * updatePersistentLayoutLinks() dans src/js/barba.js).
 *
 * @package rumhora
 */

$rumhora_phone     = get_field( 'footer_phone', 'option' );
// Même champ que le destinataire des notifications de formulaire.
$rumhora_email     = get_field( 'formulaires_email', 'option' ) ?: get_option( 'admin_email' );
$rumhora_address   = get_field( 'footer_address', 'option' );
$rumhora_copyright = get_field( 'footer_copyright', 'option' ) ?: date( 'Y' ) . ' © ' . get_bloginfo( 'name' );
?>
		</main>
	</div><!-- #page -->
</div><!-- [data-barba="container"] -->

<footer class="header-dark-section relative overflow-hidden flex flex-col">

	<div class="relative z-10 flex flex-col flex-1 md:px-5 px-[10px] md:pt-10 pt-8 text-cream">

		<!-- Logo -->
		<div class="flex justify-center md:pb-10 pb-8 border-b border-cream/20 mb-5">
			<img data-src="<?php echo esc_url( get_template_directory_uri() . '/img/logo-full.png' ); ?>" alt="<?php bloginfo( 'name' ); ?>" class="lazyload md:h-28 h-24 w-auto">
		</div>

		<div class="grid grid-cols-1 md:grid-cols-4 md:gap-20 gap-8 md:pb-5 pb-10 mb-5 border-b border-cream/20">

			<!-- Colonne gauche : menu footer -->
			<nav id="footer-nav" class="md:col-start-1">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'menu-footer',
						'container'      => false,
						'menu_class'     => 'flex flex-col gap-2',
						'link_class'     => 'hover-underline text-cream text-base md:text-lg font-medium footer-menu-link',
						'fallback_cb'    => false,
					)
				);
				?>
			</nav>

			<!-- Colonne droite : newsletter + réseaux sociaux -->
			<div class="md:col-start-4 flex flex-col gap-4 md:items-end">
				<div id="newsletter" class="w-full md:min-w-[280px]">
					<form method="post" class="reservation-form reservation-form-cream flex items-end" data-ajax-form="newsletter">
						<?php
						rs_form_field(
							array(
								'type'          => 'email',
								'label'         => __( 'Email', 'rumhora' ),
								'name'          => 'email',
								'wrapper_class' => 'newsletter-reveal-item flex-1',
							)
						);
						?>
						<button type="submit" class="newsletter-reveal-item btn-pill text-xs ml-4 mb-1 flex-shrink-0">
							<?php esc_html_e( "S'inscrire", 'rumhora' ); ?>
						</button>
						<p class="form-ajax-message m-0" role="status" aria-live="polite"></p>
					</form>
				</div>

				<div class="footer-social mt-6 md:mt-auto flex items-center gap-3">
					<?php rs_social_icons( array( 'variant' => 'outline' ) ); ?>
				</div>
			</div>

		</div>

		<!-- Bande du bas : adresse, téléphone, contact rapide -->
		<!-- data-reveal-start="95%" : ce bloc est le tout dernier élément de la
		     page — le scroll ne peut jamais atteindre le seuil par défaut
		     ("top 80%", voir initTextRevealAnimations) une fois arrivé en bas,
		     ce qui laisserait le reveal bloqué à opacity:0 pour toujours. -->
		<div class="pb-5">
			<div class="text-xs md:text-sm text-cream/80 leading-relaxed">
				<?php if ( $rumhora_address ) : ?>
					<p class="text-reveal m-0" data-reveal-start="95%"><?php echo esc_html( $rumhora_address ); ?></p>
				<?php endif; ?>

				<?php if ( $rumhora_phone ) : ?>
					<p class="text-reveal m-0" data-reveal-start="95%">
						<a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $rumhora_phone ) ); ?>" class="hover-underline"><?php echo esc_html( $rumhora_phone ); ?></a>
					</p>
				<?php endif; ?>

				<div class="flex items-center gap-3 mt-4">
					<?php if ( $rumhora_phone ) : ?>
						<!-- WhatsApp : numéro sans le "+", format attendu par wa.me -->
						<a href="https://wa.me/<?php echo esc_attr( preg_replace( '/[^0-9]/', '', $rumhora_phone ) ); ?>" target="_blank" rel="noopener" aria-label="<?php esc_attr_e( 'WhatsApp', 'rumhora' ); ?>" class="w-8 h-8 rounded-full flex items-center justify-center border border-cream/60 hover:bg-cream/20 hover:border-cream transition-colors">
							<img data-src="<?php echo esc_url( get_template_directory_uri() . '/img/icon/whatsapp.svg' ); ?>" alt="" class="lazyload w-4 h-4">
						</a>
					<?php endif; ?>
					<a href="mailto:<?php echo esc_attr( $rumhora_email ); ?>" aria-label="<?php esc_attr_e( 'Email', 'rumhora' ); ?>" class="w-8 h-8 rounded-full flex items-center justify-center border border-cream/60 hover:bg-cream/20 hover:border-cream transition-colors">
						<img data-src="<?php echo esc_url( get_template_directory_uri() . '/img/icon/mail.svg' ); ?>" alt="" class="lazyload w-4 h-4">
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Barre copyright -->
	<div class="relative z-10 border-t border-cream/20 md:px-5 px-[10px] py-3 flex justify-between items-center text-cream/60 text-xs">
		<span><?php echo esc_html( $rumhora_copyright ); ?></span>
		<a href="<?php echo esc_url( home_url( '/mentions-legales' ) ); ?>" class="hover-underline"><?php esc_html_e( 'Mentions légales', 'rumhora' ); ?></a>
	</div>

</footer>

</div><!-- [data-barba="wrapper"] -->

<?php wp_footer(); ?>
</body>
</html>
