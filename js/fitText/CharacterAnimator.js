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
    
    // Rangos de ejes para interpolación completa
    this.axisRanges = config.axisRanges || {
      wght: { min: 100, max: 1000 },
      GRAD: { min: 0, max: 100 },
      slnt: { min: 0, max: -10 }, // Invertido: punto de partida 0, al acercarse cursor va a -10
      ROND: { min: 0, max: 100 },
    };
    
    // Inicializar valores actuales y objetivo:
    // - wght: usa el valor base (desde data-relevance)
    // - slnt, GRAD, ROND: empiezan en 0 (valores cuando el mouse está lejos)
    // - wdth: usa el valor base (calculado, no se anima)
    this.current = {
      wght: baseAxes.wght ?? this.axisRanges.wght.max,
      GRAD: 0, // Empieza en 0 (mouse lejos)
      slnt: 0, // Empieza en 0 (mouse lejos)
      ROND: 0, // Empieza en 0 (mouse lejos)
      wdth: baseAxes.wdth ?? 100,
    };
    this.target = { ...this.current };
    this.opacity = config.opacity?.max ?? 1;

    this.radius = config.radius ?? 220;
    this.lerp = config.lerp ?? 0.1;
    
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

    // Interpolación: wght y slnt son INVERTIDOS (mouse lejos = max, mouse cerca = min)
    // GRAD y ROND son NORMALES (mouse lejos = min, mouse cerca = max)
    const wghtRange = this.axisRanges.wght;
    const gradRange = this.axisRanges.GRAD;
    const slntRange = this.axisRanges.slnt;
    const rondRange = this.axisRanges.ROND;

    this.target = {
      // wght invertido: disminuye cuando el mouse se acerca para evitar desbordamientos
      wght: wghtRange.max - (wghtRange.max - wghtRange.min) * influence,
      // GRAD normal: aumenta cuando el mouse se acerca
      GRAD: gradRange.min + (gradRange.max - gradRange.min) * influence,
      // slnt invertido: punto de partida 0 (max), al acercarse cursor va a -10 (min)
      // Con rango { min: -10, max: 0 }, la fórmula invertida es: max - (max - min) * influence
      // Cuando influence = 0: 0 - (0 - (-10)) * 0 = 0 ✓
      // Cuando influence = 1: 0 - (0 - (-10)) * 1 = 0 - 10 = -10 ✓
      slnt: slntRange.max - (slntRange.max - slntRange.min) * influence,
      // ROND normal: aumenta cuando el mouse se acerca
      ROND: rondRange.min + (rondRange.max - rondRange.min) * influence,
      wdth: this.base.wdth, // no se anima
    };

    // Opacidad invertida: más lejano = más opaco, más cercano = más transparente
    const tOpacity =
      this.opacityRange.max -
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
   * wght se actualiza al nuevo valor base, pero slnt, GRAD y ROND se mantienen en 0
   * (valores cuando el mouse está lejos).
   */
  setBaseAxes(newBase) {
    this.base = { ...newBase };
    // Actualizar wght al nuevo valor base, mantener slnt, GRAD y ROND en 0
    this.current.wght = newBase.wght ?? this.axisRanges.wght.max;
    this.current.wdth = newBase.wdth ?? this.current.wdth;
    // slnt, GRAD y ROND se mantienen en 0 (valores iniciales cuando mouse está lejos)
    this.current.GRAD = 0;
    this.current.slnt = 0;
    this.current.ROND = 0;
    this.target = { ...this.current };
  }
}

