/**
 * CharacterAnimator
 * Anima ejes variables por carácter según cercanía del cursor.
 * No modifica wdth para no alterar el ancho total calculado por FitText.
 * Interpola entre valores mínimos y máximos de cada eje según cercanía.
 */
export default class CharacterAnimator {
  constructor(span, baseAxes, config = {}) {
    this.span = span;
    this.base = { ...baseAxes };
    this.current = { ...baseAxes };
    this.target = { ...baseAxes };
    this.opacity = config.opacity?.max ?? 1;

    this.radius = config.radius ?? 220;
    this.lerp = config.lerp ?? 0.1;
    
    // Rangos de ejes para interpolación completa (min -> max según cercanía)
    this.axisRanges = config.axisRanges || {
      wght: { min: 100, max: 1000 },
      GRAD: { min: 0, max: 100 },
      slnt: { min: -10, max: 0 },
      ROND: { min: 0, max: 100 },
    };
    
    this.opacityRange = {
      min: config.opacity?.min ?? 0.5,
      max: config.opacity?.max ?? 1,
    };
  }

  /**
   * Actualiza el objetivo en función del cursor
   * Interpola entre valores mínimos y máximos de cada eje según cercanía.
   * @param {{x:number,y:number,active:boolean}} pointer
   */
  update(pointer) {
    const { active, x, y } = pointer || {};
    const rect = this.span.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let influence = 0;
    if (active && x != null && y != null) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      influence = Math.max(0, Math.min(1, 1 - dist / this.radius));
    }

    // Interpolación entre min y max de cada eje según influence (0 = min, 1 = max)
    const wghtRange = this.axisRanges.wght;
    const gradRange = this.axisRanges.GRAD;
    const slntRange = this.axisRanges.slnt;
    const rondRange = this.axisRanges.ROND;

    this.target = {
      wght: wghtRange.min + (wghtRange.max - wghtRange.min) * influence,
      GRAD: gradRange.min + (gradRange.max - gradRange.min) * influence,
      slnt: slntRange.min + (slntRange.max - slntRange.min) * influence,
      ROND: rondRange.min + (rondRange.max - rondRange.min) * influence,
      wdth: this.base.wdth, // no se anima
    };

    const tOpacity =
      this.opacityRange.min +
      (this.opacityRange.max - this.opacityRange.min) * influence;

    // Interpolación suave
    this.current.wght += (this.target.wght - this.current.wght) * this.lerp;
    this.current.GRAD += (this.target.GRAD - this.current.GRAD) * this.lerp;
    this.current.slnt += (this.target.slnt - this.current.slnt) * this.lerp;
    this.current.ROND += (this.target.ROND - this.current.ROND) * this.lerp;
    this.current.wdth = this.target.wdth;

    this.opacity += (tOpacity - this.opacity) * this.lerp;

    this.apply();
  }

  apply() {
    this.span.style.fontVariationSettings = `"wght" ${Math.round(
      this.current.wght,
    )}, "wdth" ${Math.round(this.current.wdth)}, "GRAD" ${Math.round(
      this.current.GRAD,
    )}, "slnt" ${Math.round(this.current.slnt)}, "ROND" ${Math.round(
      this.current.ROND,
    )}`;
    this.span.style.opacity = this.opacity.toFixed(3);
  }

  /**
   * Cuando FitText cambia ejes base, sincronizamos el baseline.
   */
  setBaseAxes(newBase) {
    this.base = { ...newBase };
    this.current = { ...newBase };
    this.target = { ...newBase };
  }
}

