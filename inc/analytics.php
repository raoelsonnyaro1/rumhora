<?php
/**
 * Facebook (Meta) Pixel, bloqué par défaut et activé uniquement après
 * consentement via le plugin Complianz (RGPD) - voir
 * type="text/plain" data-category="marketing" ci-dessous, la méthode
 * documentée par Complianz pour un script tiers non ajouté via leur
 * interface : Complianz scanne la page au chargement et ne convertit cette
 * balise en vrai <script> exécutable (et ne l'exécute) qu'une fois la
 * catégorie "marketing" acceptée par le visiteur sur la bannière.
 *
 * Pas de Google Analytics 4 ici : GA4 est généré directement par Complianz
 * (intégration Google native du plugin, gère aussi le Consent Mode) - un
 * 2e appel gtag('config', ...) depuis le thème ferait doublon (pages vues
 * comptées deux fois). Le suivi des soumissions de formulaire
 * (gtag('event', 'form_submit', ...), voir trackFormSubmit() dans
 * src/js/forms/form-ajax.js) continue de fonctionner normalement : il se
 * contente d'utiliser le gtag déjà défini par Complianz, sans avoir besoin
 * de le déclarer lui-même.
 */

/**
 * Facebook (Meta) Pixel. L'ID vient du champ ACF facebook_pixel_id (Options
 * du Thème > Analytics, voir acf-json/group_theme_options.json) - champ vide
 * = rien ne se charge (utile en local/staging, sans toucher au code).
 * Catégorie "marketing" (pas "statistics") : c'est la catégorie RGPD standard
 * pour un pixel publicitaire/retargeting, distincte de l'analytics pur.
 */
function rumhora_output_facebook_pixel() {
	$pixel_id = get_field('facebook_pixel_id', 'option');
	if (!$pixel_id) {
		return;
	}
	?>
	<script type="text/plain" data-category="marketing">
		!function(f,b,e,v,n,t,s)
		{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
		n.callMethod.apply(n,arguments):n.queue.push(arguments)};
		if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
		n.queue=[];t=b.createElement(e);t.async=!0;
		t.src=v;s=b.getElementsByTagName(e)[0];
		s.parentNode.insertBefore(t,s)}(window, document,'script',
		'https://connect.facebook.net/en_US/fbevents.js');
		fbq('init', '<?php echo esc_js($pixel_id); ?>');
		fbq('track', 'PageView');
	</script>
	<?php
	// Pas de gating possible sur le <noscript> (s'applique seulement quand JS
	// est désactivé - Complianz, basé sur JS, ne peut alors de toute façon pas
	// intercepter de choix de consentement). Limitation connue, commune à
	// tous les outils de gestion de consentement ; cas marginal (visiteur
	// sans JS).
	?>
	<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=<?php echo esc_attr($pixel_id); ?>&ev=PageView&noscript=1" /></noscript>
	<?php
}
add_action('wp_head', 'rumhora_output_facebook_pixel');
