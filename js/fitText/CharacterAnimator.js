/**
 * CharacterAnimator
 * Anima ejes variables por carácter según cercanía del cursor.
 * No modifica wdth para no alterar el ancho total calculado por FitText.
 * Interpola entre valores mínimos y máximos de cada eje según cercanía.
 * Interpola entre colores según cercanía del cursor.
 */
export default class CharacterAnimator {
  constructor(span, baseAxes, config = {}) {
    this.span = span;
    this.base = { ...baseAxes };
    
    // Rangos de ejes para interpolación completa
    this.axisRanges = config.axisRanges || {
      wght: { min: 1, max: 1000 },
      GRAD: { min: 0, max: 100 },
      slnt: { min: 0, max: -10 }, // Invertido: punto de partida 0, al acercarse cursor va a -10
      ROND: { min: 0, max: 100 },
    };
    
    // Inicializar valores actuales y objetivo:
    // IMPORTANTE: Los valores iniciales deben coincidir exactamente con los aplicados en fit()
    // para evitar saltos cuando se activa la animación.
    // - wght: usa el valor base (desde data-relevance) - este es el MÁXIMO permitido
    // - slnt: empieza en 0 (valor cuando el mouse está lejos) - este es el MÁXIMO permitido
    // - GRAD, ROND: usar valores de baseAxes si existen, sino 0
    //   Estos valores son los que se aplicaron en fit(), y la animación solo puede
    //   aumentar desde estos valores (nunca disminuir por debajo)
    // - wdth: usa el valor base (calculado, no se anima)
    this.current = {
      wght: baseAxes.wght ?? this.axisRanges.wght.max,
      // Usar valores de baseAxes para GRAD y ROND si existen (valores aplicados en fit())
      // Si no existen, usar 0 (valores cuando el mouse está lejos)
      GRAD: baseAxes.GRAD ?? 0,
      slnt: baseAxes.slnt ?? 0, // Empieza en 0 (mouse lejos) - máximo (invertido)
      ROND: baseAxes.ROND ?? 0,
      wdth: baseAxes.wdth ?? 100,
    };
    this.target = { ...this.current };
    
    // Configuración de colores
    // Obtener el elemento padre (el elemento .var-text)
    const parentElement = span.parentElement;
    // Obtener el color por defecto del CSS
    const defaultColor = this.getComputedColor(parentElement);
    // Obtener el color hover desde data-hover o usar blanco por defecto
    const hoverColor = parentElement?.dataset.hover || '#ffffff';
    
    // Convertir colores a RGB para interpolación
    this.baseColor = this.parseColor(defaultColor);
    this.hoverColor = this.parseColor(hoverColor);
    this.currentColor = { ...this.baseColor };
    
    // Aplicar valores iniciales inmediatamente para evitar saltos
    // Esto asegura que los spans tengan los mismos valores que el elemento padre
    this.apply();

    this.radius = config.radius ?? 220;
    this.lerp = config.lerp ?? 0.1;
  }
  
  /**
   * Obtiene el color computado del elemento
   */
  getComputedColor(element) {
    if (!element) return '#ffffff';
    const computed = window.getComputedStyle(element);
    return computed.color || '#ffffff';
  }
  
  /**
   * Parsea un color en cualquier formato (hex, rgb, rgba, nombre) a RGB
   */
  parseColor(color) {
    if (!color) return { r: 255, g: 255, b: 255 };
    
    // Si es un nombre de color, usar un canvas temporal para obtener RGB
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    const hex = ctx.fillStyle;
    
    // Convertir hex a RGB
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    }
    
    // Si es rgb/rgba, extraer valores
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }
    
    // Fallback a blanco
    return { r: 255, g: 255, b: 255 };
  }
  
  /**
   * Interpola entre dos colores RGB
   */
  interpolateColor(color1, color2, t) {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t),
    };
  }
  
  /**
   * Convierte RGB a string CSS
   */
  rgbToString(rgb) {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
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

    // Calcular valores objetivo asegurando que nunca excedan los valores base calculados
    // Esto previene desbordamientos cuando se activa la animación
    const targetWght = wghtRange.max - (wghtRange.max - wghtRange.min) * influence;
    const targetGRAD = gradRange.min + (gradRange.max - gradRange.min) * influence;
    const targetSlnt = slntRange.max - (slntRange.max - slntRange.min) * influence;
    const targetROND = rondRange.min + (rondRange.max - rondRange.min) * influence;
    
    this.target = {
      // wght invertido: disminuye cuando el mouse se acerca para evitar desbordamientos
      // Asegurar que nunca exceda el valor base (máximo permitido)
      wght: Math.min(targetWght, this.base.wght ?? wghtRange.max),
      // GRAD normal: aumenta cuando el mouse se acerca
      // Asegurar que nunca sea menor que el valor base (si existe)
      GRAD: Math.max(targetGRAD, this.base.GRAD ?? 0),
      // slnt invertido: punto de partida 0 (max), al acercarse cursor va a -10 (min)
      // Asegurar que nunca exceda 0 (máximo permitido)
      slnt: Math.max(targetSlnt, slntRange.min),
      // ROND normal: aumenta cuando el mouse se acerca
      // Asegurar que nunca sea menor que el valor base (si existe)
      ROND: Math.max(targetROND, this.base.ROND ?? 0),
      wdth: this.base.wdth, // no se anima
    };

    // Interpolación de color: más lejano = color base, más cercano = color hover
    const targetColor = this.interpolateColor(this.baseColor, this.hoverColor, influence);

    // Interpolación suave
    this.current.wght += (this.target.wght - this.current.wght) * this.lerp;
    this.current.GRAD += (this.target.GRAD - this.current.GRAD) * this.lerp;
    this.current.slnt += (this.target.slnt - this.current.slnt) * this.lerp;
    this.current.ROND += (this.target.ROND - this.current.ROND) * this.lerp;
    this.current.wdth = this.target.wdth;
    
    // Interpolación suave del color
    this.currentColor.r += (targetColor.r - this.currentColor.r) * this.lerp;
    this.currentColor.g += (targetColor.g - this.currentColor.g) * this.lerp;
    this.currentColor.b += (targetColor.b - this.currentColor.b) * this.lerp;

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
    // Aplicar color interpolado
    this.span.style.color = this.rgbToString(this.currentColor);
  }

  /**
   * Cuando FitText cambia ejes base, sincronizamos el baseline.
   * wght se actualiza al nuevo valor base (que es el MÁXIMO permitido),
   * pero slnt, GRAD y ROND se mantienen en 0 (valores cuando el mouse está lejos).
   * IMPORTANTE: Asegurar que wght nunca exceda el valor base calculado.
   */
  setBaseAxes(newBase) {
    this.base = { ...newBase };
    // Actualizar wght al nuevo valor base (máximo permitido), pero nunca excederlo
    const newWght = newBase.wght ?? this.axisRanges.wght.max;
    this.current.wght = Math.min(newWght, this.axisRanges.wght.max);
    this.current.wdth = newBase.wdth ?? this.current.wdth;
    // slnt, GRAD y ROND se mantienen en 0 (valores iniciales cuando mouse está lejos)
    // Estos son los valores "base" para la animación (máximo para slnt, mínimo para GRAD/ROND)
    this.current.GRAD = 0;
    this.current.slnt = 0;
    this.current.ROND = 0;
    this.target = { ...this.current };
    
    // Actualizar color base si el elemento padre cambió
    const parentElement = this.span.parentElement;
    if (parentElement) {
      const newBaseColor = this.getComputedColor(parentElement);
      this.baseColor = this.parseColor(newBaseColor);
      // Resetear color actual al base (cuando no hay influencia del mouse)
      this.currentColor = { ...this.baseColor };
    }
    
    // Aplicar inmediatamente para evitar saltos
    this.apply();
  }
}

