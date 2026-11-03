/**
 * Datepicker / timepicker Flatpickr pour les champs générés par
 * rs_form_field() : type "date" (attribut data-flatpickr) et type "time"
 * (attribut data-flatpickr-time) — voir inc/components/form/rs-form-field.php.
 *
 * Remplace les <input type="date"> / [type="time"] natifs, dont le format
 * affiché dépend du navigateur/OS du visiteur plutôt que du site : le natif
 * affiche la date selon la locale de l'appareil, et choisit 12h/24h de la même
 * façon (lang="fr" sur le champ ne suffit pas, Chrome l'ignore et garde AM/PM).
 *
 * dateFormat sert à la fois d'affichage ET de valeur soumise (pas de altInput) :
 * rumhora_format_date_fr() côté PHP laisse déjà passer inchangée une valeur qui
 * n'est pas au format ISO, donc rien à adapter côté serveur.
 *
 * Doit être rappelée après chaque transition Barba (nouveau <form> dans le DOM
 * à chaque fois).
 */
export function initDatePickers() {
  if (typeof flatpickr === 'undefined') return;

  document.querySelectorAll('input[data-flatpickr]').forEach((input) => {
    // _flatpickr : évite de ré-initialiser un champ déjà prêt (défensif, comme
    // initCustomSelects() — ne devrait normalement jamais arriver puisque le
    // <form> est un nouveau nœud à chaque transition Barba).
    if (input._flatpickr) return;

    flatpickr(input, {
      locale: 'fr',
      dateFormat: 'd/m/Y',
      // Saisie manuelle désactivée (le champ est readonly côté markup) : on ne
      // veut jamais risquer qu'un format tapé à la main soit invalide.
      allowInput: false,
      // Flatpickr bascule par défaut vers le sélecteur natif du téléphone sur
      // mobile (voir flatpickr.js.org/mobile-support) — ce qui annulerait le
      // format JJ/MM/AAAA garanti ci-dessus, redevenu dépendant de la locale
      // de l'appareil.
      disableMobile: true,
      // data-min-date="today" sur le champ : interdit les dates passées (ex:
      // une demande de privatisation). Omis par défaut, pour ne pas imposer
      // cette contrainte à un champ date quelconque (date de naissance...).
      ...(input.dataset.minDate ? { minDate: input.dataset.minDate } : {}),
    });
  });

  initTimePickers();
}

/**
 * Champs heure (data-flatpickr-time) : noCalendar — juste le sélecteur
 * heure/minute, pas de grille de jours. Affichage 24h garanti sur tous les
 * navigateurs.
 */
function initTimePickers() {
  document.querySelectorAll('input[data-flatpickr-time]').forEach((input) => {
    if (input._flatpickr) return;

    flatpickr(input, {
      locale: 'fr',
      enableTime: true,
      noCalendar: true,
      dateFormat: 'H:i',
      time_24hr: true,
      allowInput: false,
      // Même raison que les champs date : évite le fallback natif mobile, qui
      // réintroduirait le 12h/24h selon la locale de l'appareil.
      disableMobile: true,
    });
  });
}
