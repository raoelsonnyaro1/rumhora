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
$rumhora_tagline = get_field( 'footer_tagline', 'option' )
	?: __( 'A premium, timeless, elegant fine dining and musical lounge experience in the heart of Montreal.', 'rumhora' );

// Coordonnées : repli sur les valeurs de la maquette, centralisé dans
// rumhora_contact() (inc/template-tags.php) parce que rs_social_icons() lit
// le même téléphone pour en déduire l'URL WhatsApp.
// ⚠ Contenu de maquette, à remplacer avant mise en ligne — voir la note de
// l'accesseur.
$rumhora_address = rumhora_contact( 'address' );
$rumhora_phone   = rumhora_contact( 'phone' );
$rumhora_email   = rumhora_contact( 'email' );

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
					<?php // .text-reveal : même révélation ligne à ligne que les descriptions
					      // des sections. À noter — initTextRevealAnimations ne dispatche
					      // « textRevealStarted » qu'une fois TOUS ses éléments démarrés ;
					      // en ajouter un dans le footer repousse donc cet évènement au
					      // moment où le visiteur y arrive. Sans conséquence aujourd'hui,
					      // rien n'utilise data-fade-wait-for — à savoir si ça change. ?>
					<p class="footer-tagline text-reveal"><?php echo wp_kses_post( $rumhora_tagline ); ?></p>
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

				<?php // Groupe à décalage plutôt que .text-reveal : SplitText devrait ici
					      // recouper des <span> de bloc contenant des liens, ce qui est
					      // fragile. Chaque ligne est déjà un élément — autant les animer
					      // telles quelles. ?>
					<address class="footer-contact lg:text-right md:mt-6 mt-5"
						data-stagger-group data-stagger-start="top 100%">
					<?php if ( $rumhora_address ) : ?>
						<span class="block" data-stagger-item><?php echo esc_html( $rumhora_address ); ?></span>
					<?php endif; ?>

					<?php if ( $rumhora_phone ) : ?>
						<span class="block" data-stagger-item>
							<?php esc_html_e( 'Phone:', 'rumhora' ); ?>
							<a href="tel:<?php echo esc_attr( preg_replace( '/[^0-9+]/', '', $rumhora_phone ) ); ?>" class="hover-underline"><?php echo esc_html( $rumhora_phone ); ?></a>
						</span>
					<?php endif; ?>

					<span class="block" data-stagger-item>
						<?php esc_html_e( 'Email:', 'rumhora' ); ?>
						<a href="mailto:<?php echo esc_attr( $rumhora_email ); ?>" class="hover-underline"><?php echo esc_html( $rumhora_email ); ?></a>
					</span>
				</address>
			</div>

		</div>

		<?php // Seuil à 105% — au-DELÀ de 100 — et ce n'est pas un excès de zèle :
	      // ce bloc est le dernier élément de la page, et un seuil à 95% exigeait
	      // un scroll que la page n'a pas toujours. Mesuré : à 1200px de hauteur
	      // de fenêtre il fallait atteindre 4899 pour un maximum de 4885, donc la
	      // barre ne s'affichait JAMAIS ; à 900px elle passait à 1 pixel près.
	      // 105% ramène le scroll requis sous le maximum avec ~100px de marge à
	      // toutes les hauteurs testées.
	      //
	      // data-fade-y="0" : le fade-in fait normalement MONTER l'élément de 50px.
	      // Ici la barre finit à 4px du bas du footer — elle était donc dessinée
	      // 46px EN DESSOUS de lui pendant toute l'animation, c'est-à-dire sur le
	      // fond de page. On garde le fondu, sans le déplacement. ?>
	<!-- Barre légale, séparée par un filet (voir .footer-bottom) -->
		<div class="footer-bottom fade-in flex flex-wrap justify-between items-center gap-3 md:mt-16 mt-12 md:pt-5 pt-4"
			data-fade-start="105" data-fade-duration="0.8" data-fade-y="0">
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
