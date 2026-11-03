<?php
/**
 * Vidéo plein écran qui se lance automatiquement quand elle entre dans le
 * viewport et se met en pause quand elle en sort (voir scroll-video.js).
 * Accepte un fichier vidéo (mp4) ou une URL YouTube.
 *
 * Usage :
 *   rs_video([
 *       'video'   => ..., // URL (fichier mp4 ou YouTube) ou tableau ACF (champ fichier)
 *       'video_mobile' => ..., // optionnel : fichier mp4 utilisé à la place sous 768px (ex: cadrage
 *                         // vertical) - sans effet si 'video' est une URL YouTube
 *       'poster'  => ..., // image ACF affichée avant lecture / si pas de vidéo, et pour masquer
 *                         // l'habillage YouTube (titre/chaîne) tant que la vidéo n'est pas en
 *                         // lecture active ; à défaut, la miniature YouTube est utilisée
 *       'loop'    => true, // relance la vidéo en boucle (défaut : true)
 *       'classes' => 'aspect-video', // ratio/hauteur ; défaut 16:9 pour suivre la largeur sans bandes noires
 *       'reveal'  => false, // désactive l'agrandissement (1/3 -> 100% de largeur) au scroll (actif par défaut)
 *       'mute_toggle' => false, // masque le bouton son ON/OFF (affiché par défaut)
 *       'lien_youtube' => '...', // optionnel : bouton flèche en haut à droite (visible au survol)
 *                                // vers la version YouTube complète - utile quand 'video' est un
 *                                // fichier auto-hébergé (extrait court) plutôt que la vidéo YouTube elle-même
 *   ]);
 *
 * @param array $args
 */

/**
 * Extrait l'ID d'une URL YouTube (watch, youtu.be, embed, shorts).
 * Retourne null si l'URL n'est pas une URL YouTube reconnue.
 */
function rs_video_get_youtube_id($url) {
	if (preg_match('~(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})~', $url, $matches)) {
		return $matches[1];
	}
	return null;
}

function rs_video($args = []) {
	$video_raw = $args['video'] ?? null;
	$video_url = is_array($video_raw) ? ($video_raw['url'] ?? '') : (string) $video_raw;

	$video_mobile_raw = $args['video_mobile'] ?? null;
	$video_mobile_url = is_array($video_mobile_raw) ? ($video_mobile_raw['url'] ?? '') : (string) $video_mobile_raw;

	$youtube_id = $video_url ? rs_video_get_youtube_id($video_url) : null;

	$poster     = $args['poster'] ?? null;
	$poster_url = '';
	$poster_alt = '';
	if (!empty($poster)) {
		$poster_url = is_array($poster) ? ($poster['url'] ?? '') : $poster;
		$poster_alt = is_array($poster) ? ($poster['alt'] ?? '') : '';
	}

	$loop         = $args['loop'] ?? true;
	$classes      = $args['classes'] ?? 'aspect-video';
	$reveal       = $args['reveal'] ?? true;
	$mute_toggle  = $args['mute_toggle'] ?? true;
	$lien_youtube = $args['lien_youtube'] ?? null;
	$has_video    = $youtube_id || $video_url;
	?>
	<div class="<?php echo $reveal ? 'scroll-video-outer' : ''; ?> overflow-hidden">
	<section class="scroll-video-section relative w-full <?php echo esc_attr($classes); ?> overflow-hidden">
		<?php if ($youtube_id) : ?>
			<?php $youtube_poster_url = $poster_url ?: "https://img.youtube.com/vi/{$youtube_id}/maxresdefault.jpg"; ?>
			<div class="scroll-video youtube-video absolute inset-0 w-full h-full" data-scroll-video data-loop="<?php echo $loop ? '1' : '0'; ?>">
				<img data-src="<?php echo esc_url($youtube_poster_url); ?>" alt="<?php echo esc_attr($poster_alt); ?>" class="lazyload youtube-video-poster absolute inset-0 w-full h-full object-cover">
				<div class="youtube-video-target absolute inset-0 w-full h-full" data-youtube-id="<?php echo esc_attr($youtube_id); ?>"></div>
			</div>
		<?php elseif ($video_url) : ?>
			<video
				class="scroll-video w-full h-full object-cover"
				src="<?php echo esc_url($video_url); ?>"
				<?php echo $video_mobile_url ? 'data-src-mobile="' . esc_url($video_mobile_url) . '"' : ''; ?>
				<?php echo $poster_url ? 'poster="' . esc_url($poster_url) . '"' : ''; ?>
				<?php echo $loop ? 'loop' : ''; ?>
				muted
				playsinline
				preload="metadata"
				data-scroll-video
			></video>
		<?php elseif ($poster_url) : ?>
			<img data-src="<?php echo esc_url($poster_url); ?>" alt="<?php echo esc_attr($poster_alt); ?>" class="lazyload w-full h-full object-cover">
		<?php endif; ?>
		<?php if ($has_video && $mute_toggle) : ?>
			<?php
			$video_mute_on_label  = __('Activer le son', 'rumhora');
			$video_mute_off_label = __('Couper le son', 'rumhora');
			?>
			<button type="button" class="scroll-video-mute-toggle absolute z-10" data-scroll-video-mute data-label-muted="<?php echo esc_attr($video_mute_on_label); ?>" data-label-unmuted="<?php echo esc_attr($video_mute_off_label); ?>" aria-pressed="false" aria-label="<?php echo esc_attr($video_mute_on_label); ?>" title="<?php echo esc_attr($video_mute_on_label); ?>">
				<svg class="icon-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 5 6 9H2v6h4l5 4V5Z"/>
					<line x1="23" y1="9" x2="17" y2="15"/>
					<line x1="17" y1="9" x2="23" y2="15"/>
				</svg>
				<svg class="icon-unmuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 5 6 9H2v6h4l5 4V5Z"/>
					<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
					<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
				</svg>
			</button>
		<?php endif; ?>
		<?php if ($lien_youtube) : ?>
			<?php $video_youtube_link_label = __('Voir la vidéo complète sur YouTube', 'rumhora'); ?>
			<a href="<?php echo esc_url($lien_youtube); ?>" target="_blank" rel="noopener" class="scroll-video-youtube-link absolute z-10" aria-label="<?php echo esc_attr($video_youtube_link_label); ?>" title="<?php echo esc_attr($video_youtube_link_label); ?>">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<line x1="7" y1="17" x2="17" y2="7"/>
					<polyline points="7 7 17 7 17 17"/>
				</svg>
			</a>
		<?php endif; ?>
	</section>
	</div>
	<?php
}
