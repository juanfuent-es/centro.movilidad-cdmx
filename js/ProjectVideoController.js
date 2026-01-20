/**
 * Controla reproducción y volumen de videos dentro de secciones .project
 * en función de visibilidad (IntersectionObserver) y hover.
 * Usa GSAP (global) para tween de volumen.
 */
export default class ProjectVideoController {
  constructor({
    selector = ".project",
    threshold = 0.5,
    volumeDuration = 0.22,
    volumeMax = 1,
    onAudioStart,
    onAudioEnd,
  } = {}) {
    this.selector = selector;
    this.threshold = threshold;
    this.volumeDuration = volumeDuration;
    this.volumeMax = volumeMax;
    this.onAudioStart = onAudioStart;
    this.onAudioEnd = onAudioEnd;
    this.items = [];
    this.documentHidden = false;

    this.handleIntersect = this.handleIntersect.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.init();
  }

  init() {
    const sections = document.querySelectorAll(this.selector);
    if (!sections.length) return;

    this.observer = new IntersectionObserver(this.handleIntersect, {
      root: null,
      threshold: this.threshold,
    });

    sections.forEach((section) => {
      const video = section.querySelector("video");
      if (!video) return;

      // Estado interno por sección
      const state = {
        section,
        video,
        hover: false,
        visible: false,
        tween: null,
      };

      // Estado inicial seguro: todo pausado, silencioso y muted.
      video.pause();
      video.volume = 0;
      video.muted = true;

      // Suscribir hover
      section.addEventListener("mouseenter", () => {
        state.hover = true;
        this.updatePlayback(state);
      });
      section.addEventListener("mouseleave", () => {
        state.hover = false;
        this.updatePlayback(state);
      });

      this.observer.observe(section);
      this.items.push(state);
    });

    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
      false
    );
  }

  handleVisibilityChange() {
    this.documentHidden = document.visibilityState === "hidden";
    if (this.documentHidden) {
      this.items.forEach((state) => this.fadeOutAndPause(state));
    } else {
      this.items.forEach((state) => this.updatePlayback(state));
    }
  }

  handleIntersect(entries) {
    entries.forEach((entry) => {
      const state = this.items.find((item) => item.section === entry.target);
      if (!state) return;
      state.visible =
        entry.isIntersecting && entry.intersectionRatio >= this.threshold;
      this.updatePlayback(state);
    });
  }

  updatePlayback(state) {
    if (this.documentHidden) {
      this.fadeOutAndPause(state);
      return;
    }

    const shouldPlay = state.visible && state.hover;
    if (shouldPlay) {
      this.playWithAudio(state);
    } else {
      this.fadeOutAndPause(state);
    }
  }

  playWithAudio(state) {
    const { video } = state;

    // Cancelar tween previo
    if (state.tween) {
      state.tween.kill();
      state.tween = null;
    }

    video.muted = false;

    const playPromise = video.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        // Si el autoplay policy bloquea, dejamos mute y sin volumen.
        video.muted = true;
        video.volume = 0;
      });
    }

    const targetVolume = Math.max(0, Math.min(this.volumeMax, 1));
    state.tween = gsap.to(video, {
      duration: this.volumeDuration,
      volume: targetVolume,
      ease: "power2.out",
      onStart: () => {
        if (typeof this.onAudioStart === "function") {
          this.onAudioStart(state);
        }
      },
      onComplete: () => {
        state.tween = null;
      },
    });
  }

  fadeOutAndPause(state) {
    const { video } = state;

    if (state.tween) {
      state.tween.kill();
      state.tween = null;
    }

    state.tween = gsap.to(video, {
      duration: this.volumeDuration,
      volume: 0,
      ease: "power2.in",
      onComplete: () => {
        video.pause();
        video.muted = true;
        state.tween = null;
        if (typeof this.onAudioEnd === "function") {
          this.onAudioEnd(state);
        }
      },
    });
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
      false
    );
    this.items.forEach((state) => {
      if (state.tween) state.tween.kill();
      state.video.pause();
      state.video.muted = true;
      state.video.volume = 0;
    });
    this.items = [];
  }
}

