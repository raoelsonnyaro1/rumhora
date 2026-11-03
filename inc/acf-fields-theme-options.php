<?php
/**
 * Page d'options du thème (ACF). Le groupe de champs lui-même est défini via
 * JSON (voir acf-json/group_theme_options.json, auto-chargé par ACF) plutôt
 * qu'ici en PHP, comme tous les autres groupes de champs du thème - seule la
 * page d'options proprement dite doit rester enregistrée en PHP (non
 * synchronisable via JSON).
 */

if (function_exists('acf_add_options_page')) :

acf_add_options_page(array(
    'page_title'    => 'Options du Thème',
    'menu_title'    => 'Options du Thème',
    'menu_slug'     => 'theme-options',
    'capability'    => 'edit_posts',
    'redirect'      => false,
    'icon_url'      => 'dashicons-admin-generic',
    'position'      => 60,
));

endif;
