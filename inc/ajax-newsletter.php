<?php
/**
 * Handler AJAX du formulaire newsletter (voir footer.php et
 * src/js/forms/newsletter-form.js) : ajoute l'email à une liste de contacts
 * Brevo via leur API REST (pas de plugin tiers - clé API + ID de liste
 * configurés dans Options du Thème > Newsletter, voir
 * acf-json/group_theme_options.json).
 */
function rumhora_ajax_submit_newsletter() {
	check_ajax_referer('rumhora_form_nonce', 'nonce');

	// admin-ajax.php tourne en contexte "admin" côté WPML, qui ne déduit donc
	// pas la langue du visiteur depuis l'URL comme sur une page normale (voir
	// 'lang' ajouté côté JS dans form-ajax.js) - sans ce switch, les __() de
	// ce fichier résolvent dans la langue par défaut du site plutôt que celle
	// de la page qui a soumis le formulaire.
	if (!empty($_POST['lang'])) {
		do_action('wpml_switch_language', sanitize_text_field($_POST['lang']));
	}

	$email = sanitize_email($_POST['email'] ?? '');
	if (!$email || !is_email($email)) {
		wp_send_json_error(['message' => __('Adresse email invalide.', 'rumhora')]);
	}

	$api_key = get_field('brevo_api_key', 'option');
	$list_id = get_field('brevo_list_id', 'option');

	if (!$api_key || !$list_id) {
		// Config manquante (clé API ou ID de liste pas encore renseignés dans
		// Options du Thème) : échec propre côté visiteur plutôt qu'un appel
		// API voué à échouer silencieusement ou une erreur PHP.
		wp_send_json_error(['message' => __("Une erreur est survenue lors de l'envoi. Merci de réessayer.", 'rumhora')]);
	}

	// updateEnabled:true : un email déjà abonné (ex: déjà présent dans une
	// autre liste, ou resoumission) est rattaché à CETTE liste plutôt que de
	// provoquer une erreur 400 "contact already exists" - le formulaire ne
	// doit jamais afficher une erreur pour un cas normal (quelqu'un se
	// réinscrit, ou est déjà client par un autre canal).
	$response = wp_remote_post('https://api.brevo.com/v3/contacts', [
		'headers' => [
			'api-key'      => $api_key,
			'Content-Type' => 'application/json',
			'Accept'       => 'application/json',
		],
		'body' => wp_json_encode([
			'email'          => $email,
			'listIds'        => [(int) $list_id],
			'updateEnabled'  => true,
		]),
		'timeout' => 10,
	]);

	if (is_wp_error($response)) {
		wp_send_json_error(['message' => __("Une erreur est survenue lors de l'envoi. Merci de réessayer.", 'rumhora')]);
	}

	// Brevo renvoie 201 (nouveau contact) ou 204 (contact existant mis à jour,
	// corps vide) pour un succès - tout le reste (400, 401...) est une erreur.
	$status = wp_remote_retrieve_response_code($response);
	if ($status !== 201 && $status !== 204) {
		wp_send_json_error(['message' => __("Une erreur est survenue lors de l'envoi. Merci de réessayer.", 'rumhora')]);
	}

	wp_send_json_success(['message' => __('Merci pour votre inscription !', 'rumhora')]);
}
add_action('wp_ajax_rumhora_submit_newsletter', 'rumhora_ajax_submit_newsletter');
add_action('wp_ajax_nopriv_rumhora_submit_newsletter', 'rumhora_ajax_submit_newsletter');
