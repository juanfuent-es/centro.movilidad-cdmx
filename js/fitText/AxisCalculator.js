/**
 * AxisCalculator - Cálculo de valores de ejes variables
 * Responsabilidad: Calcular valores de ejes basados en relevance, dimensiones y algoritmos iterativos
 */

export default class AxisCalculator {
  constructor(options = {}) {
    // Rangos de ejes para Google Sans Flex
    this.axisRanges = {
      wght: { min: 1, max: 1000, default: 400 },
      GRAD: { min: 0, max: 100, default: 0 },
      wdth: { min: 25, max: 151, default: 100 },
      slnt: { min: -10, max: 0, default: 0 },
      ROND: { min: 0, max: 100, default: 0 },
      opsz: { min: 6, max: 144, default: 14 } // Automático en CSS, pero incluido para referencia
    };

    // Configuración
    this.lineHeightRatio = options.lineHeightRatio || 1.2;
    this.minFontSize = options.minFontSize || 8;
    this.maxFontSize = options.maxFontSize || 1000;
    this.widthStep = options.widthStep || 5;
    this.fontSizeStep = options.fontSizeStep || 1;
  }

  /**
   * Calcula el valor de weight basado en relevance (mapeo lineal)
   * @param {number} relevance - Valor de 0 a 1
   * @returns {number} Valor de weight (1-1000)
   */
  calculateWeight(relevance) {
    const clamped = this.clamp(relevance, 0, 1);
    const { min, max } = this.axisRanges.wght;
    return Math.round(min + (max - min) * clamped);
  }

  /**
   * Calcula el valor de grade basado en relevance (mapeo lineal)
   * @param {number} relevance - Valor de 0 a 1
   * @returns {number} Valor de GRAD (0-100)
   */
  calculateGrade(relevance) {
    const clamped = this.clamp(relevance, 0, 1);
    const { min, max } = this.axisRanges.GRAD;
    return Math.round(min + (max - min) * clamped);
  }

  /**
   * Calcula el fontSize máximo que no desborda el ancho del contenedor
   * La altura se ajusta automáticamente según el font-size definido por CSS
   * @param {number} containerWidth - Ancho del contenedor en px
   * @param {Function} measureCallback - Función que mide el ancho del texto con fontSize y axes dados
   * @param {Object} initialAxes - Valores iniciales de ejes (sin fontSize)
   * @returns {number} FontSize óptimo
   */
  calculateMaxFontSize(containerWidth, measureCallback, initialAxes = {}) {
    // 1. Empezar con un fontSize grande y reducir hasta que quepa en el ancho
    // Usamos búsqueda binaria para mayor eficiencia
    let minSize = this.minFontSize;
    let maxSize = this.maxFontSize;
    let fontSize = Math.min(maxSize, containerWidth); // Estimación inicial razonable
    fontSize = this.clamp(fontSize, this.minFontSize, this.maxFontSize);

    // 2. Aplicar y medir con el fontSize inicial
    let textWidth = measureCallback(fontSize, initialAxes);

    // 3. Búsqueda binaria para encontrar el fontSize óptimo
    const maxIterations = 30; // Reducido para mayor velocidad
    let iterations = 0;
    const tolerance = 1; // Tolerancia en píxeles
    
    while (iterations < maxIterations && (maxSize - minSize) > tolerance) {
      if (textWidth > containerWidth) {
        // Desborda, reducir fontSize
        maxSize = fontSize;
        fontSize = Math.floor((minSize + maxSize) / 2);
      } else {
        // Cabe, intentar aumentar fontSize
        minSize = fontSize;
        fontSize = Math.floor((minSize + maxSize) / 2);
        // Si ya no podemos aumentar más, salir
        if (fontSize === minSize) break;
      }
      
      fontSize = this.clamp(fontSize, this.minFontSize, this.maxFontSize);
      textWidth = measureCallback(fontSize, initialAxes);
      iterations++;
      
      // Si el ancho ya no desborda y estamos cerca del límite, salir
      if (textWidth <= containerWidth && (maxSize - minSize) <= tolerance) break;
    }

    // 4. Asegurar que no sea menor que el mínimo
    fontSize = Math.max(fontSize, this.minFontSize);

    return fontSize;
  }

  /**
   * Calcula el valor óptimo de width mediante algoritmo iterativo
   * @param {number} containerWidth - Ancho del contenedor en px
   * @param {Function} measureCallback - Función que mide el ancho del texto con ejes dados
   * @param {Object} otherAxes - Otros ejes (wght, GRAD, slnt, ROND)
   * @returns {number} Valor óptimo de width (25-151)
   */
  calculateOptimalWidth(containerWidth, measureCallback, otherAxes = {}) {
    let currentWidth = this.axisRanges.wdth.default;
    const { min: minWidth, max: maxWidth } = this.axisRanges.wdth;
    let step = this.widthStep;
    let textWidth;
    const maxIterations = 50; // Prevenir loops infinitos
    let iterations = 0;
    const tolerance = 2; // Tolerancia en píxeles

    do {
      const axes = { ...otherAxes, wdth: currentWidth };
      textWidth = measureCallback(axes);

      if (textWidth < containerWidth * 0.95) {
        // Texto es más angosto, aumentar width
        currentWidth = Math.min(currentWidth + step, maxWidth);
      } else if (textWidth > containerWidth) {
        // Texto desborda, disminuir width
        currentWidth = Math.max(currentWidth - step, minWidth);
      } else {
        // Ajustado correctamente (dentro del 95-100% del contenedor)
        break;
      }

      // Reducir paso para fine-tuning
      step = Math.max(1, step * 0.8);
      iterations++;

      if (iterations >= maxIterations) break;
    } while (Math.abs(textWidth - containerWidth) > tolerance && step >= 1);

    return this.clamp(currentWidth, minWidth, maxWidth);
  }

  /**
   * Verifica si los ejes están en sus valores máximos
   * @param {Object} axes - Valores actuales de ejes
   * @returns {boolean} True si weight, grade y width están cerca de sus máximos
   */
  areAxesMaximized(axes) {
    const { wght = 400, GRAD = 0, wdth = 100 } = axes;
    const wghtThreshold = this.axisRanges.wght.max * 0.95; // 95% del máximo
    const gradThreshold = this.axisRanges.GRAD.max * 0.95;
    const wdthThreshold = this.axisRanges.wdth.max * 0.95;

    return wght >= wghtThreshold && GRAD >= gradThreshold && wdth >= wdthThreshold;
  }

  /**
   * Obtiene el rango de un eje específico
   * @param {string} axisTag - Tag del eje (wght, GRAD, wdth, etc.)
   * @returns {Object|null} Objeto con min, max, default o null si no existe
   */
  getAxisRange(axisTag) {
    return this.axisRanges[axisTag] || null;
  }

  /**
   * Limita un valor entre min y max
   * @param {number} value - Valor a limitar
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @returns {number} Valor limitado
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Normaliza valores de ejes según sus rangos
   * @param {Object} axes - Valores de ejes a normalizar
   * @returns {Object} Valores normalizados
   */
  normalizeAxes(axes) {
    const normalized = {};
    Object.keys(axes).forEach(tag => {
      const range = this.axisRanges[tag];
      if (range) {
        normalized[tag] = this.clamp(axes[tag], range.min, range.max);
      }
    });
    return normalized;
  }
}

