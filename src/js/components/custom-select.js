/**
 * Sélectionne par valeur une option d'un <select> custom déjà initialisé.
 * Utile pour pré-remplir un champ depuis ailleurs dans la page (ex: un bouton
 * « Réserver cet espace » qui renseigne le select du formulaire plus bas).
 *
 * Sans effet si le wrapper n'a pas encore été initialisé par
 * initCustomSelects() (pas de .custom-select-value) ou si `value` ne
 * correspond à aucune option — jamais d'erreur dans ces deux cas.
 * @param {HTMLSelectElement} nativeSelect
 * @param {string} value
 */
export function selectCustomSelectOption(nativeSelect, value) {
  const wrapper = nativeSelect.closest('.custom-select');
  if (!wrapper) return;
  const valueEl = wrapper.querySelector('.custom-select-value');
  const options = Array.from(wrapper.querySelectorAll('.custom-select-option'));
  const option = options.find(o => o.dataset.value === value);
  if (!valueEl || !option) return;

  nativeSelect.value = value;
  valueEl.textContent = option.textContent;
  wrapper.classList.add('has-value');
  options.forEach(o => o.classList.toggle('is-selected', o === option));
  // Déclenche 'change' pour tout code (validation native, listeners tiers)
  // qui écoute la valeur du <select> réel.
  nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Dropdown custom pour les champs <select> (rs_form_field type="select") :
 * remplace le popup natif — dont le survol des options est dessiné par l'OS
 * et n'est pas stylable de façon fiable en CSS cross-navigateur — par une
 * liste HTML entièrement stylée. Le <select> natif reste dans le DOM (name=
 * conservé, visuellement caché) pour porter la valeur soumise avec le
 * formulaire ; le JS garde les deux synchronisés.
 */
export function initCustomSelects() {
  document.querySelectorAll('.custom-select').forEach(wrapper => {
    // Évite de ré-attacher les listeners si déjà initialisé (ex: après une
    // transition Barba qui rejoue initCustomSelects() sur un DOM déjà en place).
    if (wrapper.dataset.customSelectInit) return;
    wrapper.dataset.customSelectInit = '1';

    const trigger = wrapper.querySelector('.custom-select-trigger');
    const valueEl = wrapper.querySelector('.custom-select-value');
    const optionsList = wrapper.querySelector('.custom-select-options');
    const nativeSelect = wrapper.querySelector('.custom-select-native');
    const options = Array.from(wrapper.querySelectorAll('.custom-select-option'));
    if (!trigger || !valueEl || !optionsList || !nativeSelect) return;

    const closeDropdown = () => {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const openDropdown = () => {
      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    const selectOption = (option) => {
      selectCustomSelectOption(nativeSelect, option.dataset.value);
      closeDropdown();
    };

    trigger.addEventListener('click', () => {
      if (wrapper.classList.contains('open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    options.forEach(option => {
      option.addEventListener('click', () => selectOption(option));
    });

    // Clic en dehors du composant : referme la liste ouverte.
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) closeDropdown();
    });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeDropdown();
    });
  });
}
