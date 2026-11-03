/**
 * Soumission AJAX du formulaire newsletter (voir footer.php et
 * inc/ajax-newsletter.php - contact ajouté à une liste Brevo via leur API).
 * Doit être rappelée après chaque transition Barba : le footer est remplacé
 * en bloc à chaque changement de langue (voir updatePersistentLayoutLinks()
 * dans barba.js), donc le <form> est un nouveau nœud DOM à chaque fois.
 */
import { submitFormAjax, showFormAjaxMessage, trackFormSubmit } from './form-ajax.js';

export function initNewsletterFormAjax() {
  const form = document.querySelector('form[data-ajax-form="newsletter"]');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const submitHtml = submitBtn ? submitBtn.innerHTML : '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Envoi en cours...';
    }

    try {
      const result = await submitFormAjax(form, 'rumhora_submit_newsletter');
      showFormAjaxMessage(form, result.success, result.data.message);
      if (result.success) {
        form.reset();
        trackFormSubmit('newsletter');
      }
    } catch (error) {
      console.error('Error in initNewsletterFormAjax:', error);
      showFormAjaxMessage(form, false, "Une erreur est survenue. Merci de réessayer.");
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitHtml;
    }
  });
}
