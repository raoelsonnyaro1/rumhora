<?php
/**
 * Désactiver l'éditeur Gutenberg pour certains templates
 * Ce fichier gère la désactivation de l'éditeur pour les pages utilisant uniquement ACF
 */

/**
 * Désactiver l'éditeur Gutenberg sur toutes les pages sauf mentions légales et données personnelles
 */
function rs_disable_editor_on_pages($use_block_editor, $post) {
    if (!$post) {
        return $use_block_editor;
    }

    // Vérifier que c'est bien une page
    if ($post->post_type !== 'page') {
        return $use_block_editor;
    }

    $template = get_page_template_slug($post->ID);

    // Liste des templates qui GARDENT l'éditeur (exceptions)
    $templates_with_editor = array(
        'page-mentions-legales.php',
        'page-donnees-personnelles.php'
    );

    // Si le template est dans la liste des exceptions, garder l'éditeur
    if (in_array($template, $templates_with_editor)) {
        return true;
    }

    // Pour toutes les autres pages, désactiver l'éditeur
    return false;
}
add_filter('use_block_editor_for_post', 'rs_disable_editor_on_pages', 10, 2);
