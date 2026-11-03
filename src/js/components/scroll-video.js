/**
 * Scroll Video Component
 * Lance la lecture d'une vidéo (fichier <video> ou YouTube) quand elle entre
 * dans le viewport, la met en pause quand elle en sort.
 */

let observer = null;
let youtubeApiPromise = null;
const youtubePlayers = new Map(); // wrapperEl -> YT.Player

function loadYoutubeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') previousCallback();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

function initYoutubePlayer(wrapperEl, targetEl) {
  const videoId = targetEl.dataset.youtubeId;
  if (!videoId || youtubePlayers.has(wrapperEl)) return;

  const loop = wrapperEl.dataset.loop === '1';

  loadYoutubeApi().then((YT) => {
    // La page a pu changer (transition Barba) avant que l'API soit prête
    if (!document.body.contains(targetEl)) return;

    let loopWatcher = null;

    const stopLoopWatcher = () => {
      if (loopWatcher) {
        clearInterval(loopWatcher);
        loopWatcher = null;
      }
    };

    const player = new YT.Player(targetEl, {
      videoId,
      playerVars: {
        // autoplay:1 fait passer le lecteur en lecture dès qu'il est prêt : ça
        // évite l'état "en pause" de YouTube qui affiche le titre/la chaîne en
        // surimpression. L'IntersectionObserver le remet en pause aussitôt
        // après si la vidéo n'est pas encore visible à l'écran.
        autoplay: 1,
        mute: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (e) => {
          e.target.mute();
          // Force la meilleure qualité possible : par défaut YouTube choisit
          // automatiquement selon la bande passante estimée, ce qui peut
          // rester en basse résolution même en local/haut débit. L'API ne
          // garantit pas ce niveau exact (retombe sur la qualité disponible
          // la plus proche), d'où le rappel dans onStateChange ci-dessous —
          // YouTube peut re-choisir automatiquement à chaque changement d'état.
          e.target.setPlaybackQuality('hd1080');
          if (!wrapperEl.dataset.inView) {
            e.target.pauseVideo();
          }
        },
        // Boucle maison : on ne laisse jamais la vidéo atteindre sa toute fin
        // (contrairement à loop/playlist natifs) car YouTube y affiche une
        // carte "vidéos suggérées" en surimpression dans les dernières
        // secondes, qu'aucun paramètre d'API ne permet de désactiver.
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            e.target.setPlaybackQuality('hd1080');
          }
          if (!loop) return;

          if (e.data === YT.PlayerState.PLAYING) {
            stopLoopWatcher();
            loopWatcher = setInterval(() => {
              const duration = e.target.getDuration();
              const current = e.target.getCurrentTime();
              if (duration && duration - current < 2) {
                e.target.seekTo(0, true);
              }
            }, 500);
          } else {
            stopLoopWatcher();
          }
        },
      },
    });
    youtubePlayers.set(wrapperEl, player);
  });
}

function toggleMute(button) {
  const section = button.closest('.scroll-video-section');
  const target = section && section.querySelector('[data-scroll-video]');
  if (!target) return;

  // title/aria-label : "Activer le son"/"Couper le son" selon l'état résultant
  // (pas seulement aria-pressed) - sinon l'infobulle reste bloquée sur
  // "Activer le son" même une fois le son activé. Lus depuis data-label-muted/
  // data-label-unmuted (voir rs-video.php, posés via __() côté PHP) plutôt que
  // codés en dur ici, pour rester traduisibles via WPML comme le reste du thème.
  const setLabel = (isUnmuted) => {
    const label = isUnmuted ? button.dataset.labelUnmuted : button.dataset.labelMuted;
    if (!label) return;
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  };

  if (target.tagName === 'VIDEO') {
    target.muted = !target.muted;
    button.classList.toggle('is-unmuted', !target.muted);
    button.setAttribute('aria-pressed', String(!target.muted));
    setLabel(!target.muted);
    return;
  }

  // YouTube
  const player = youtubePlayers.get(target);
  if (!player || typeof player.isMuted !== 'function') return;

  const wasMuted = player.isMuted();
  if (wasMuted) {
    player.unMute();
  } else {
    player.mute();
  }
  // wasMuted === true veut dire qu'on vient de démuter (nouvel état : son actif)
  button.classList.toggle('is-unmuted', wasMuted);
  button.setAttribute('aria-pressed', String(wasMuted));
  setLabel(wasMuted);
}

function initMuteToggles() {
  document.querySelectorAll('[data-scroll-video-mute]').forEach((button) => {
    button.addEventListener('click', () => toggleMute(button));
  });
}

export function initScrollVideo() {
  // Détruire l'observer et les players YouTube dont l'élément n'est plus dans le DOM
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  youtubePlayers.forEach((player, wrapperEl) => {
    if (!document.body.contains(wrapperEl)) {
      try {
        player.destroy();
      } catch (e) {
        // ignore
      }
      youtubePlayers.delete(wrapperEl);
    }
  });

  const elements = document.querySelectorAll('[data-scroll-video]');
  if (!elements.length) return;

  elements.forEach((el) => {
    const target = el.querySelector('[data-youtube-id]');
    if (target) {
      initYoutubePlayer(el, target);
    }
  });

  // data-src-mobile (voir rs-video.php, 'video_mobile') : un seul <video>
  // dans le DOM (pas deux éléments togglés en CSS) pour éviter toute
  // ambiguïté avec les sélecteurs [data-scroll-video] utilisés ailleurs
  // (toggleMute() ci-dessus, cet IntersectionObserver) - ils ne matcheraient
  // alors plus forcément l'élément réellement visible. Le breakpoint suit le
  // "md:" de Tailwind (768px) ; vérifié une seule fois ici, pas en live sur
  // resize (même logique que les autres variantes mobile/desktop du thème,
  // ex: hero_image_mobile dans rs-hero.php).
  const MOBILE_BREAKPOINT = '(max-width: 767px)';
  elements.forEach((el) => {
    if (el.tagName === 'VIDEO' && el.dataset.srcMobile && window.matchMedia(MOBILE_BREAKPOINT).matches) {
      el.src = el.dataset.srcMobile;
    }
  });

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;

      // Utilisé par onReady() du player YouTube pour savoir s'il doit rester
      // en lecture ou se remettre en pause dès qu'il est prêt.
      if (entry.isIntersecting) {
        el.dataset.inView = '1';
      } else {
        delete el.dataset.inView;
      }

      // Wrapper YouTube (voir initYoutubePlayer) : distingué par la présence
      // d'un [data-youtube-id], PAS par youtubePlayers.get(el) — le player
      // est créé de façon asynchrone (API externe à charger), donc la Map
      // peut encore être vide ici si la vidéo entre/sort du viewport avant
      // que l'API ne soit prête. Sans cette distinction, ce cas tombait dans
      // la branche <video> native ci-dessous et appelait .play()/.pause()
      // sur un <div>, qui n'a pas ces méthodes ("el.pause is not a
      // function"). onReady() applique déjà le bon état une fois le player
      // disponible (voir dataset.inView mis à jour juste au-dessus), donc il
      // n'y a rien d'autre à faire ici tant qu'il ne l'est pas.
      if (el.querySelector('[data-youtube-id]')) {
        const player = youtubePlayers.get(el);
        if (!player || typeof player.playVideo !== 'function') return;
        if (entry.isIntersecting) {
          player.playVideo();
        } else {
          player.pauseVideo();
        }
        return;
      }

      // <video> natif (fichier mp4)
      if (typeof el.play !== 'function') return;
      if (entry.isIntersecting) {
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, { threshold: 0.5 });

  elements.forEach((el) => observer.observe(el));

  initMuteToggles();
}
