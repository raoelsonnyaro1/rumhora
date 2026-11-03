<?php
/**
 * Champ de formulaire à libellé flottant, ou bouton de soumission.
 * À utiliser à l'intérieur d'un <form class="reservation-form"> pour bénéficier
 * du style de libellé flottant (voir assets/sass/components/_form.scss) ;
 * ajouter .reservation-form-cream pour la variante sur fond sombre.
 *
 * Usage :
 *   rs_form_field(['type' => 'text',  'label' => 'Nom']);
 *   rs_form_field(['type' => 'email', 'label' => 'Email', 'name' => 'mail']); // 'name' déduit du label si omis
 *   rs_form_field(['type' => 'number', 'label' => 'Nombre de convives', 'min' => 1, 'required' => false]);
 *   rs_form_field(['type' => 'textarea', 'label' => 'Message', 'rows' => 3, 'required' => false]);
 *   rs_form_field(['type' => 'select', 'label' => "Type d'événement", 'options' => ['A', 'B'], 'selected' => 'A', 'required' => false]);
 *   rs_form_field(['type' => 'date', 'label' => 'Date souhaitée']); // Flatpickr, toujours JJ/MM/AAAA
 *   rs_form_field(['type' => 'date', 'label' => 'Date', 'min_date' => 'today']); // interdit les dates passées
 *   rs_form_field(['type' => 'time', 'label' => 'Heure souhaitée']); // Flatpickr, toujours 24h
 *   rs_form_field(['type' => 'checkbox', 'label' => "J'accepte ...", 'name' => 'consentement']);
 *   rs_form_field([
 *       'type'  => 'button', // rend un <button type="submit"> au lieu d'un champ
 *       'label' => 'Envoyer',
 *       'class' => 'w-full font-bold', // classes additionnelles du bouton
 *       'icon'  => '<svg>...</svg>',   // markup SVG affiché avant le label
 *   ]);
 *
 * @param array $args
 */
function rs_form_field($args = []) {
	$type  = $args['type']  ?? 'text';
	$label = $args['label'] ?? '';

	if ($type === 'button') {
		$class = $args['class'] ?? '';
		$icon  = $args['icon']  ?? '';
		?>
		<button type="submit" class="btn btn-primary <?php echo esc_attr($class); ?>">
			<?php echo $icon; ?>
			<?php echo esc_html($label); ?>
		</button>
		<?php
		return;
	}

	$name     = $args['name'] ?? sanitize_title($label);
	$required = $args['required'] ?? true;

	if ($type === 'checkbox') {
		?>
		<label class="form-field-checkbox flex items-center gap-3 text-sm">
			<input type="checkbox" name="<?php echo esc_attr($name); ?>" <?php echo $required ? 'required' : ''; ?>>
			<?php echo wp_kses_post($label); ?>
		</label>
		<?php
		return;
	}

	if ($type === 'select') {
		$options = $args['options'] ?? [];
		// 'selected' : pré-sélection (ex: une valeur passée en query string
		// depuis une autre page) - comparaison STRICTE contre les options
		// réelles, pour ignorer toute valeur invalide/absente plutôt que de
		// rendre un <option selected> qui ne correspond à rien.
		$selected = $args['selected'] ?? '';
		if (!in_array($selected, $options, true)) {
			$selected = '';
		}
		?>
		<div class="form-field custom-select<?php echo $selected !== '' ? ' has-value' : ''; ?>">
			<button type="button" class="custom-select-trigger" aria-haspopup="listbox" aria-expanded="false">
				<span class="custom-select-value"><?php echo esc_html($selected); ?></span>
			</button>
			<ul class="custom-select-options" role="listbox">
				<?php foreach ($options as $option) : ?>
				<li class="custom-select-option<?php echo $option === $selected ? ' is-selected' : ''; ?>" role="option" data-value="<?php echo esc_attr($option); ?>"><?php echo esc_html($option); ?></li>
				<?php endforeach; ?>
			</ul>
			<select name="<?php echo esc_attr($name); ?>" <?php echo $required ? 'required' : ''; ?> class="custom-select-native" tabindex="-1" aria-hidden="true">
				<option value="" disabled<?php echo $selected === '' ? ' selected' : ''; ?> hidden></option>
				<?php foreach ($options as $option) : ?>
				<option value="<?php echo esc_attr($option); ?>"<?php echo $option === $selected ? ' selected' : ''; ?>><?php echo esc_html($option); ?></option>
				<?php endforeach; ?>
			</select>
			<label><?php echo esc_html($label); ?></label>
		</div>
		<?php
		return;
	}

	if ($type === 'date') {
		// Flatpickr (voir functions.php, rumhora_enqueue_scripts()) remplace le
		// <input type="date"> natif : popup entièrement stylisable aux couleurs
		// du thème (voir assets/sass/components/_flatpickr.scss), format
		// JJ/MM/AAAA garanti sur tous les navigateurs - le natif affiche selon
		// la locale du visiteur, pas celle du site (même limite sur le champ
		// "time" plus bas dans ce fichier).
		// readonly : la saisie manuelle est désactivée (voir allowInput:false
		// dans initDatePickers(), src/js/components/date-picker.js) pour ne
		// jamais risquer qu'un format tapé à la main soit invalide.
		// 'min_date' => 'today' : interdit les dates passées (ex: une demande
		// de privatisation). Omis par défaut, pour ne pas imposer cette
		// contrainte à un champ date quelconque (date de naissance...).
		?>
		<div class="form-field">
			<input type="text" name="<?php echo esc_attr($name); ?>" placeholder=" " readonly data-flatpickr<?php echo ! empty($args['min_date']) ? ' data-min-date="' . esc_attr($args['min_date']) . '"' : ''; ?> <?php echo $required ? 'required' : ''; ?>>
			<label><?php echo esc_html($label); ?></label>
		</div>
		<?php
		return;
	}

	if ($type === 'time') {
		// Flatpickr en mode heure seule (enableTime + noCalendar, voir
		// initDatePickers(), src/js/components/date-picker.js) remplace le
		// <input type="time"> natif : affichage 24h garanti sur tous les
		// navigateurs - le natif choisit 12h/24h selon la locale du visiteur
		// plutôt que celle du site (lang="fr" posé directement sur le champ ne
		// suffisait pas, Chrome par exemple l'ignore et garde AM/PM). Même
		// readonly que le champ "date" : saisie manuelle désactivée, voir
		// allowInput:false dans initDatePickers().
		?>
		<div class="form-field">
			<input type="text" name="<?php echo esc_attr($name); ?>" placeholder=" " readonly data-flatpickr-time <?php echo $required ? 'required' : ''; ?>>
			<label><?php echo esc_html($label); ?></label>
		</div>
		<?php
		return;
	}

	if ($type === 'textarea') {
		$rows = $args['rows'] ?? 3;
		?>
		<div class="form-field">
			<textarea name="<?php echo esc_attr($name); ?>" rows="<?php echo esc_attr($rows); ?>" placeholder=" " <?php echo $required ? 'required' : ''; ?>></textarea>
			<label><?php echo esc_html($label); ?></label>
		</div>
		<?php
		return;
	}

	$min           = isset($args['min']) ? ' min="' . esc_attr($args['min']) . '"' : '';
	$wrapper_class = $args['wrapper_class'] ?? '';
	?>
	<div class="form-field <?php echo esc_attr($wrapper_class); ?>">
		<input type="<?php echo esc_attr($type); ?>" name="<?php echo esc_attr($name); ?>" placeholder=" "<?php echo $min; ?> <?php echo $required ? 'required' : ''; ?>>
		<label><?php echo esc_html($label); ?></label>
	</div>
	<?php
}
