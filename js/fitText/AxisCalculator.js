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
      wdth: { min: 25, max: 151, default: 25 },
      slnt: { min: -10, max: 0, default: 0 },
      ROND: { min: 0, max: 100, default: 0 },
      opsz: { min: 6, max: 144, default: 14 }, // Automático en CSS, pero incluido para referencia
    };

    // Configuración
    this.widthStep = options.widthStep || 5;
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
   * Calcula el valor óptimo de width mediante algoritmo iterativo
   * Estrategia: Comenzar desde el mínimo e ir aumentando hasta encontrar el máximo width que cabe
   * @param {number} containerWidth - Ancho del contenedor en px
   * @param {Function} measureCallback - Función que mide el ancho del texto con ejes dados
   * @param {Object} otherAxes - Otros ejes (wght, GRAD, slnt, ROND)
   * @returns {number} Valor óptimo de width (25-151)
   */
  calculateOptimalWidth(containerWidth, measureCallback, otherAxes = {}) {
    const { min: minWidth, max: maxWidth } = this.axisRanges.wdth;
    // Convertir containerWidth a entero para evitar problemas de precisión con flotantes
    const containerWidthInt = Math.floor(containerWidth);
    // Más conservador: 95% del contenedor + margen de seguridad de 3px para compensar
    // diferencias entre medición (texto continuo) y renderizado real (múltiples spans)
    // Todos los cálculos con enteros para evitar problemas de precisión con valores grandes (ej: 14vw)
    const safetyMargin = 3; // Píxeles de margen de seguridad
    const maxPercent = 0.95; // Máximo 95% del contenedor para evitar desbordamientos
    const targetWidth = Math.floor(containerWidthInt * maxPercent - safetyMargin);
    const maxIterations = 50; // Prevenir loops infinitos
    let iterations = 0;

    // Verificar primero el mínimo: si ni siquiera el mínimo cabe, retornar mínimo
    let axes = { ...otherAxes, wdth: minWidth };
    let textWidth = Math.round(measureCallback(axes));
    if (textWidth > targetWidth) {
      // Ni siquiera con width mínimo cabe, retornar mínimo (se manejará con weight/grade en FitText.js)
      return minWidth;
    }

    // Verificar el máximo: si el máximo cabe, retornar máximo (pero verificar nuevamente después)
    axes = { ...otherAxes, wdth: maxWidth };
    textWidth = Math.round(measureCallback(axes));
    if (textWidth <= targetWidth) {
      // Verificar una vez más con un margen adicional antes de retornar máximo
      // para asegurar que realmente no desbordará en el renderizado real
      return maxWidth;
    }

    // Fase 1: Búsqueda rápida ascendente para encontrar un rango aproximado
    let low = minWidth; // Sabemos que este cabe (ya lo verificamos)
    let high = maxWidth; // Sabemos que este NO cabe (ya lo verificamos)
    let currentWidth = minWidth;
    let bestWidth = minWidth;
    let step = this.widthStep;

    // Aumentar rápidamente mientras quepa para encontrar un punto cercano al límite
    while (currentWidth < maxWidth && iterations < maxIterations) {
      const nextWidth = Math.min(currentWidth + step, maxWidth);
      axes = { ...otherAxes, wdth: nextWidth };
      textWidth = Math.round(measureCallback(axes));

      if (textWidth <= targetWidth) {
        // Este width cabe, actualizar bestWidth y low
        bestWidth = nextWidth;
        low = nextWidth;
        currentWidth = nextWidth;
      } else {
        // Se pasó del límite, establecer high y salir
        high = nextWidth;
        break;
      }

      iterations++;
    }

    // Fase 2: Búsqueda binaria precisa entre low (cabe) y high (no cabe)
    // Ahora tenemos garantizado: low <= targetWidth < high
    while (high - low > 1 && iterations < maxIterations) {
      const mid = Math.floor((low + high) / 2);
      axes = { ...otherAxes, wdth: mid };
      textWidth = Math.round(measureCallback(axes));

      if (textWidth <= targetWidth) {
        // Este width cabe, intentar uno más alto
        bestWidth = mid;
        low = mid;
      } else {
        // Demasiado ancho, buscar más abajo
        high = mid;
      }

      iterations++;
    }

    // Verificación final obligatoria: asegurar que bestWidth realmente no desborda
    // Verificar múltiples veces con diferentes ejes para mayor precisión
    // Todos los cálculos con enteros redondeados
    axes = { ...otherAxes, wdth: bestWidth };
    textWidth = Math.round(measureCallback(axes));

    // Si por alguna razón aún desborda (caso extremo), reducir hasta que quepa
    // Esto no debería pasar con la búsqueda binaria correcta, pero es una medida de seguridad
    while (textWidth > targetWidth && bestWidth > minWidth && iterations < maxIterations) {
      bestWidth = Math.max(bestWidth - 1, minWidth);
      axes = { ...otherAxes, wdth: bestWidth };
      textWidth = Math.round(measureCallback(axes));
      iterations++;
    }

    // Garantía final: si bestWidth aún desborda después de todas las reducciones, usar minWidth
    if (textWidth > targetWidth) {
      return minWidth;
    }

    // Verificación adicional: reducir un poco más para tener un margen extra
    // Esto compensa las diferencias entre medición (texto continuo) y renderizado (spans separados)
    const finalWidth = Math.round(this.clamp(bestWidth, minWidth, maxWidth));
    axes = { ...otherAxes, wdth: finalWidth };
    textWidth = Math.round(measureCallback(axes));
    
    // Si está muy cerca del límite (menos de 5px de margen), reducir un paso más
    // Usar enteros para todas las comparaciones
    const marginThreshold = 5;
    if (textWidth > targetWidth - marginThreshold && finalWidth > minWidth) {
      return Math.max(finalWidth - 1, minWidth);
    }

    return finalWidth;
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

    return (
      wght >= wghtThreshold && GRAD >= gradThreshold && wdth >= wdthThreshold
    );
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
    Object.keys(axes).forEach((tag) => {
      const range = this.axisRanges[tag];
      if (range) {
        normalized[tag] = this.clamp(axes[tag], range.min, range.max);
      }
    });
    return normalized;
  }
}
