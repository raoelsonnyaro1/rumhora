<?php
/**
 * Pied de page : fermeture du container Barba puis footer.
 *
 * Le <footer> est volontairement EN DEHORS du container Barba, donc persistant
 * entre les pages — son contenu est resynchronisé à chaque transition par
 * updatePersistentLayoutLinks() dans src/js/barba.js.
 *
 * Composition (maquette) : 3 colonnes — accroche + liens à gauche, logo au
 * centre, réseaux + coordonnées à droite — puis un filet et la barre légale.
 *
 * @package rumhora
 */

// L'accroche a un repli : c'est de la copie marketing, elle peut sans risque
// afficher le texte de la maquette tant que le champ est vide.
//
// Adresse, téléphone et email n'en ont PAS, volontairement : un numéro ou une
// adresse de repli inventés s'afficheraient comme de vraies coordonnées et
// finiraient par partir en production. Les blocs correspondants ne sont tout
// simplement pas rendus tant que le client ne les a pas renseignés.
$rumhora_tagline = get_field( 'footer_tagline', 'option' )
	?: __( 'A premium, timeless, elegant fine dining and musical lounge experience in the heart of Montreal.', 'rumhora' );

$rumhora_address = get_field( 'footer_address', 'option' );
$rumhora_phone   = get_field( 'footer_phone', 'option' );

// Repli en cascade : adresse dédiée au footer, sinon celle qui reçoit les
// formulaires, sinon l'adresse d'administration — il y a toujours un email
// affichable, jamais un "mailto:" vide.
$rumhora_email = get_field( 'footer_email', 'option' )
	?: ( get_field( 'formulaires_email', 'option' ) ?: get_option( 'admin_email' ) );

$rumhora_copyright = get_field( 'footer_copyright', 'option' )
	?: sprintf(
		/* translators: 1: année en cours, 2: nom du site. */
		__( '© %1$s %2$s. All rights reserved.', 'rumhora' ),
		date_i18n( 'Y' ),
		get_bloginfo( 'name' )
	);
?>
		</main>
	</div><!-- #page -->
</div><!-- [data-barba="container"] -->

<footer class="site-footer header-dark-section relative">
	<div class="footer-inner xl:px-14 md:px-8 px-5 md:pt-20 pt-14 md:pb-6 pb-5">

		<div class="footer-top grid lg:grid-cols-3 grid-cols-1 lg:gap-10 gap-12 items-center">

			<!-- Colonne gauche : accroche + liens -->
			<div class="footer-col">
				<?php if ( $rumhora_tagline ) : ?>
					<p class="footer-tagline"><?php echo wp_kses_post( $rumhora_tagline ); ?></p>
				<?php endif; ?>

				<nav class="footer-nav md:mt-8 mt-6" aria-label="<?php esc_attr_e( 'Liens du pied de page', 'rumhora' ); ?>">
					<?php rumhora_footer_nav(); ?>
				</nav>
			</div>

			<!-- Colonne centrale : logo complet (logomark + nom + signature) -->
			<div class="footer-col flex justify-center">
				<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" data-barba class="footer-logo">
					<img data-src="<?php echo esc_url( get_template_directory_uri() . '/img/logo-full.png' ); ?>"
						alt="<?php bloginfo( 'name' ); ?>"
						width="482" height="542"
						class="lazyload">
				</a>
			</div>

			<!-- Colonne droite : réseaux + coordonnées -->
			<div class="footer-col flex flex-col lg:items-end items-start">
				<?php rs_social_icons(); ?>

				<address class="footer-contact lg:text-right md:mt-6 mt-5">
					<?php if ( $rumhora_address ) : ?>
						<span class="block"><?php echo esc_html( $rumhora_address ); ?></span>
					<?php endif; ?>

					<?php if ( $rumhora_phone ) : ?>
						<span class="block">
							<?php esc_html_e( 'Phone:', 'rumhora' ); ?>
							<a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $rumhora_phone ) ); ?>" class="hover-underline"><?php echo esc_html( $rumhora_phone ); ?></a>
						</span>
					<?php endif; ?>

					<span class="block">
						<?php esc_html_e( 'Email:', 'rumhora' ); ?>
						<a href="mailto:<?php echo esc_attr( $rumhora_email ); ?>" class="hover-underline"><?php echo esc_html( $rumhora_email ); ?></a>
					</span>
				</address>
			</div>

		</div>

		<!-- Barre légale, séparée par un filet (voir .footer-bottom) -->
		<div class="footer-bottom flex flex-wrap justify-between items-center gap-3 md:mt-16 mt-12 md:pt-5 pt-4">
			<span class="footer-copyright"><?php echo esc_html( $rumhora_copyright ); ?></span>

			<nav class="footer-legal" aria-label="<?php esc_attr_e( 'Mentions légales', 'rumhora' ); ?>">
				<?php rumhora_legal_nav(); ?>
			</nav>
		</div>

	</div>
</footer>

</div><!-- [data-barba="wrapper"] -->

<?php wp_footer(); ?>
</body>
</html>
