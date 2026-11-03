/**
 * Mécanique commune de soumission AJAX d'un formulaire.
 *
 * Chaque module de formulaire (voir newsletter-form.js) reste responsable de
 * son propre état visuel (bouton, message) et n'a qu'à appeler
 * submitFormAjax() avec le nom de l'action WordPress correspondant à son
 * handler PHP (voir inc/ajax-newsletter.php).
 *
 * @param {HTMLFormElement} form
 * @param {string} action - nom de l'action wp_ajax_<action> côté PHP
 * @returns {Promise<{success: boolean, data: {message: string}}>}
 */
export async function submitFormAjax(form, action) {
  const formData = new FormData(form);
  formData.append('action', action);
  formData.append('nonce', window.rumhoraAjax.nonce);

  // Langue de la page courante (voir <html lang="...">, posé par
  // language_attributes() dans header.php) : admin-ajax.php tourne en contexte
  // "admin" côté WordPress/WPML/Polylang, qui ne déduit donc PAS la langue du
  // visiteur depuis l'URL comme pour une page normale. Sans ça, les __() du
  // handler PHP (message de confirmation, erreurs) peuvent résoudre dans la
  // langue par défaut du site plutôt que celle de la page qui a soumis le
  // formulaire (voir le do_action('wpml_switch_language') dans inc/ajax-*.php).
  formData.append('lang', document.documentElement.lang.split('-')[0]);

  const response = await fetch(window.rumhoraAjax.url, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

/**
 * Affiche le résultat d'une soumission dans le <p class="form-ajax-message">
 * du formulaire. Disparaît automatiquement après 10s.
 *
 * clearTimeout au cas où une soumission précédente avait déjà programmé une
 * disparition sur ce même élément — sinon l'ancien timeout masquerait le
 * nouveau message avant ses 10s.
 * @param {HTMLFormElement} form
 * @param {boolean} success
 * @param {string} message
 */
export function showFormAjaxMessage(form, success, message) {
  const el = form.querySelector('.form-ajax-message');
  if (!el) return;

  el.textContent = message;
  el.classList.add('is-visible');
  el.classList.toggle('is-success', success);
  el.classList.toggle('is-error', !success);

  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => {
    el.classList.remove('is-visible');
  }, 10000);
}

/**
 * Évènements GA4 "form_submit" + Meta Pixel "Lead", déclenchés uniquement sur
 * une soumission RÉUSSIE (voir result.success dans chaque module de
 * formulaire) — pas sur un simple submit natif, qui compterait aussi les
 * échecs (validation, email non envoyé...).
 *
 * gtag/fbq n'existent que si un ID est configuré dans Options du Thème >
 * Analytics (voir inc/analytics.php) ; absents sinon, ou si un bloqueur
 * empêche leur script de charger — d'où la vérification avant chaque appel
 * plutôt que de risquer une erreur qui interromprait la suite de la soumission.
 * @param {string} formName - identifie le formulaire dans les rapports GA4
 *   (ex: "newsletter", "contact", "privatisation")
 */
export function trackFormSubmit(formName) {
  if (typeof gtag === 'function') {
    gtag('event', 'form_submit', { form_name: formName });
  }
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', { content_name: formName });
  }
}
