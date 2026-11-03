<?php
/**
 * Composants réutilisables (rs_*), appelables directement depuis n'importe quel template.
 *
 * Chaque composant vit dans son propre fichier sous inc/components/, ou dans
 * un sous-dossier thématique (ex: inc/components/form/ pour les composants
 * de formulaire) - un seul niveau de sous-dossier est parcouru.
 *
 * @package rumhora
 */

$rs_component_files = array_merge(
	glob(get_template_directory() . '/inc/components/*.php'),
	glob(get_template_directory() . '/inc/components/*/*.php')
);

foreach ($rs_component_files as $rs_component_file) {
	require $rs_component_file;
}
