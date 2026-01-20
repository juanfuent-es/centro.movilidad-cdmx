/**
 * AnimationController
 * Un solo requestAnimationFrame + un solo set de listeners para controlar animaciones.
 * Llama en cascada a `fitText.update({ pointer })` por cada instancia registrada.
 */
export default class AnimationController {
  constructor(options = {}) {
    this.pointer = { x: null, y: null, active: false };
    this.instances = new Set();
    this._rafId = null;

    this._enabled = options.enabled ?? true;

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.loop = this.loop.bind(this);

    window.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("pointerleave", this.onPointerLeave, { passive: true });

    if (this._enabled) this.start();
  }

  register(fitTextInstance) {
    if (!fitTextInstance) return;
    this.instances.add(fitTextInstance);
  }

  unregister(fitTextInstance) {
    if (!fitTextInstance) return;
    this.instances.delete(fitTextInstance);
  }

  onPointerMove(evt) {
    this.pointer.x = evt.clientX;
    this.pointer.y = evt.clientY;
    this.pointer.active = true;
  }

  onPointerLeave() {
    this.pointer.active = false;
  }

  start() {
    if (this._rafId) return;
    this._rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  loop() {
    // Cascada: cada FitText decide qué animar y cómo.
    for (const instance of this.instances) {
      if (typeof instance.update === "function") {
        instance.update({ pointer: this.pointer });
      }
    }
    this._rafId = requestAnimationFrame(this.loop);
  }
}


