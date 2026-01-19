/**
 * FitText - Clase principal para ajustar texto en elementos HTML usando fuentes variables
 * Responsabilidad: Coordinar el ajuste de texto, renderizar caracteres como spans, aplicar estilos
 */

import TextMeasurer from './fitText/TextMeasurer.js';
import AxisCalculator from './fitText/AxisCalculator.js';
import StyleApplier from './fitText/StyleApplier.js';

export default class FitText {
  constructor(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error('FitText: se requiere un elemento HTML válido');
    }

    this.element = element;
    this.options = {
      fontFamily: options.fontFamily || 'Google Sans Flex, sans-serif',
      relevance: this.parseRelevance(element, options.relevance),
      lineHeightRatio: options.lineHeightRatio || 1,
      minFontSize: options.minFontSize || 14,
      maxFontSize: options.maxFontSize || 1000,
      ...options
    };

    // Inicializar componentes
    this.measurer = new TextMeasurer();
    this.calculator = new AxisCalculator({
      lineHeightRatio: this.options.lineHeightRatio,
      minFontSize: this.options.minFontSize,
      maxFontSize: this.options.maxFontSize
    });
    this.styleApplier = new StyleApplier(this.options.fontFamily);

    // Estado interno
    this.charSpans = [];
    this.currentAxes = {};
    this.currentFontSize = null;
    this.flexEnabled = false;

    // Renderizar texto como spans desde el inicio
    const text = this.extractText(element);
    this.renderAsSpans(text);

    // Aplicar estilos base
    this.styleApplier.applyAxisValues(this.element, {});
  }

  /**
   * Extrae el texto del elemento, preservando espacios y saltos de línea
   * @param {HTMLElement} element - Elemento HTML
   * @returns {string} Texto extraído
   */
  extractText(element) {
    return element.textContent || element.innerText || '';
  }

  /**
   * Parsea el valor de relevance desde atributo data o options
   * @param {HTMLElement} element - Elemento HTML
   * @param {number|undefined} optionsRelevance - Relevance desde options
   * @returns {number} Valor de relevance (0-1)
   */
  parseRelevance(element, optionsRelevance=1) {
    if (typeof optionsRelevance === 'number') {
      return Math.max(0, Math.min(1, optionsRelevance));
    }

    const dataRelevance = element.dataset.relevance;
    if (dataRelevance) {
      const parsed = parseFloat(dataRelevance);
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(1, parsed));
      }
    }

    return 0.5; // Default
  }

  /**
   * Renderiza el texto como array de spans, cada carácter en su propio span
   * @param {string} text - Texto a renderizar
   */
  renderAsSpans(text) {
    // Limpiar contenido anterior
    this.element.innerHTML = '';
    this.charSpans = [];

    // Crear un span por cada carácter
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const span = document.createElement('span');
      
      // Preservar espacios como non-breaking space para mejor control
      span.textContent = char === ' ' ? '\u00A0' : char;
      
      this.element.appendChild(span);
      this.charSpans.push(span);
    }
  }

  /**
   * Ejecuta el algoritmo completo de ajuste de texto
   */
  fit() {
    // Obtener el contenedor padre real que tiene las dimensiones físicas
    // El elemento .fit-text-container puede tener width: auto, así que medimos el padre
    const parentContainer = this.element.parentElement;
    
    // Si no hay padre, usar el elemento mismo
    if (!parentContainer) {
      console.warn('FitText: no se encontró contenedor padre');
      return;
    }

    // Obtener dimensiones del contenedor padre (el que tiene dimensiones reales)
    const parentRect = parentContainer.getBoundingClientRect();
    const computedStyle = getComputedStyle(parentContainer);
    
    // Calcular dimensiones disponibles restando padding y border
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(computedStyle.borderRightWidth) || 0;
    const borderTop = parseFloat(computedStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(computedStyle.borderBottomWidth) || 0;
    
    const containerWidth = parentRect.width - paddingLeft - paddingRight - borderLeft - borderRight;
    const containerHeight = parentRect.height - paddingTop - paddingBottom - borderTop - borderBottom;

    if (containerWidth <= 0 || containerHeight <= 0) {
      console.warn('FitText: dimensiones del contenedor inválidas', { 
        containerWidth, 
        containerHeight,
        parentWidth: parentRect.width,
        parentHeight: parentRect.height,
        padding: { paddingLeft, paddingRight, paddingTop, paddingBottom },
        border: { borderLeft, borderRight, borderTop, borderBottom }
      });
      return;
    }

    // 1. Calcular weight y grade desde relevance
    const weight = this.calculator.calculateWeight(this.options.relevance);
    const grade = this.calculator.calculateGrade(this.options.relevance);

    // 2. Obtener valores de ejes desde GUI o defaults
    const initialAxes = {
      wght: weight,
      GRAD: grade,
      wdth: this.calculator.axisRanges.wdth.default,
      slnt: this.currentAxes.slnt ?? this.calculator.axisRanges.slnt.default,
      ROND: this.currentAxes.ROND ?? this.calculator.axisRanges.ROND.default
    };

    // 3. Calcular fontSize y ajustar weight/width adaptativamente si es necesario
    // Función para medir el ancho real del contenido del elemento
    const measureWidthCallback = (fontSize, axes) => {
      // Aplicar estilos temporalmente
      this.styleApplier.applyFontSize(this.element, fontSize);
      this.styleApplier.applyAxisValues(this.element, axes);
      
      // Forzar reflow para que los cambios se apliquen
      void this.element.offsetWidth;
      
      // Medir el ancho real del contenido (no el contenedor con width: auto)
      // Sumar el ancho de todos los spans
      let totalWidth = 0;
      this.charSpans.forEach(span => {
        const spanRect = span.getBoundingClientRect();
        totalWidth += spanRect.width;
      });
      
      // Si no hay spans o la suma es 0, usar la medición del elemento
      if (totalWidth === 0) {
        totalWidth = this.measurer.measureWidth(this.element);
      }
      
      return totalWidth;
    };

    // Calcular valores iniciales basados en relevance
    let currentWeight = weight;
    let currentGrade = grade;
    let optimalWidth = this.calculator.axisRanges.wdth.default;
    let fontSize;
    let textWidth;
    let iterations = 0;
    const maxIterations = 30;
    const widthTolerance = 2; // 2px de tolerancia

    // Función helper para medir con ejes dados (igual que measureWidthCallback)
    const measureWidthForWidthCalc = (fontSize, axes) => {
      this.styleApplier.applyFontSize(this.element, fontSize);
      this.styleApplier.applyAxisValues(this.element, axes);
      void this.element.offsetWidth;
      
      // Medir el ancho real del contenido sumando los spans
      let totalWidth = 0;
      this.charSpans.forEach(span => {
        const spanRect = span.getBoundingClientRect();
        totalWidth += spanRect.width;
      });
      
      if (totalWidth === 0) {
        totalWidth = this.measurer.measureWidth(this.element);
      }
      
      return totalWidth;
    };

    // Primera pasada: calcular fontSize y width con valores iniciales de relevance
    let currentAxes = {
      wght: currentWeight,
      GRAD: currentGrade,
      wdth: optimalWidth,
      slnt: initialAxes.slnt,
      ROND: initialAxes.ROND
    };

    fontSize = this.calculator.calculateMaxFontSize(
      containerHeight,
      containerWidth,
      measureWidthCallback,
      currentAxes
    );

    optimalWidth = this.calculator.calculateOptimalWidth(
      containerWidth,
      measureWidthForWidthCalc,
      fontSize,
      {
        wght: currentWeight,
        GRAD: currentGrade,
        slnt: initialAxes.slnt,
        ROND: initialAxes.ROND
      }
    );

    // Aplicar y medir resultado inicial (medir ancho real del contenido)
    currentAxes.wdth = optimalWidth;
    this.styleApplier.applyFontSize(this.element, fontSize);
    this.styleApplier.applyAxisValues(this.element, currentAxes);
    void this.element.offsetWidth;
    
    // Medir ancho real sumando spans
    textWidth = 0;
    this.charSpans.forEach(span => {
      const spanRect = span.getBoundingClientRect();
      textWidth += spanRect.width;
    });
    
    if (textWidth === 0) {
      textWidth = this.measurer.measureWidth(this.element);
    }

    // Si desborda, reducir progresivamente weight, grade y width
    // Guardar fontSize inicial como límite máximo para evitar que crezca demasiado
    const maxAllowedFontSize = fontSize;
    
    while (textWidth > containerWidth + widthTolerance && iterations < maxIterations) {
      const wghtRange = this.calculator.axisRanges.wght;
      const wdthRange = this.calculator.axisRanges.wdth;
      const gradRange = this.calculator.axisRanges.GRAD;

      // Calcular cuánto reducir basado en el desbordamiento
      const overflowAmount = textWidth - containerWidth;
      const overflowRatio = Math.min(1, overflowAmount / containerWidth);

      // Reducir weight proporcionalmente (más agresivo si hay mucho desbordamiento)
      if (currentWeight > wghtRange.min) {
        const weightStep = Math.max(20, Math.floor((currentWeight - wghtRange.min) * 0.15 * overflowRatio));
        currentWeight = Math.max(wghtRange.min, currentWeight - weightStep);
      }

      // Reducir grade proporcionalmente
      if (currentGrade > gradRange.min) {
        const gradeStep = Math.max(10, Math.floor((currentGrade - gradRange.min) * 0.15 * overflowRatio));
        currentGrade = Math.max(gradRange.min, currentGrade - gradeStep);
      }

      // Reducir width proporcionalmente
      if (optimalWidth > wdthRange.min) {
        const widthStep = Math.max(5, Math.floor((optimalWidth - wdthRange.min) * 0.2 * overflowRatio));
        optimalWidth = Math.max(wdthRange.min, optimalWidth - widthStep);
      }

      // Recalcular fontSize con los nuevos valores, pero limitado al máximo anterior
      currentAxes = {
        wght: currentWeight,
        GRAD: currentGrade,
        wdth: optimalWidth,
        slnt: initialAxes.slnt,
        ROND: initialAxes.ROND
      };

      // Calcular nuevo fontSize pero limitarlo al máximo anterior para evitar que crezca
      const calculatedFontSize = this.calculator.calculateMaxFontSize(
        containerHeight,
        containerWidth,
        measureWidthCallback,
        currentAxes
      );
      // No permitir que fontSize sea mayor que el máximo inicial
      fontSize = Math.min(calculatedFontSize, maxAllowedFontSize);

      // Recalcular width óptimo con nuevo fontSize
      optimalWidth = this.calculator.calculateOptimalWidth(
        containerWidth,
        measureWidthForWidthCalc,
        fontSize,
        {
          wght: currentWeight,
          GRAD: currentGrade,
          slnt: initialAxes.slnt,
          ROND: initialAxes.ROND
        }
      );

      // Aplicar y medir el ancho real del contenido
      currentAxes.wdth = optimalWidth;
      this.styleApplier.applyFontSize(this.element, fontSize);
      this.styleApplier.applyAxisValues(this.element, currentAxes);
      void this.element.offsetWidth;
      
      // Medir ancho real sumando spans
      textWidth = 0;
      this.charSpans.forEach(span => {
        const spanRect = span.getBoundingClientRect();
        textWidth += spanRect.width;
      });
      
      if (textWidth === 0) {
        textWidth = this.measurer.measureWidth(this.element);
      }

      // Si ya no podemos reducir más los ejes y sigue desbordando, reducir fontSize directamente
      if (textWidth > containerWidth + widthTolerance && 
          currentWeight <= wghtRange.min + 50 && 
          currentGrade <= gradRange.min + 10 && 
          optimalWidth <= wdthRange.min + 10) {
        fontSize = Math.max(this.options.minFontSize, fontSize - 1);
        this.styleApplier.applyFontSize(this.element, fontSize);
        void this.element.offsetWidth;
        
        // Medir ancho real después de reducir fontSize
        textWidth = 0;
        this.charSpans.forEach(span => {
          const spanRect = span.getBoundingClientRect();
          textWidth += spanRect.width;
        });
        
        if (textWidth === 0) {
          textWidth = this.measurer.measureWidth(this.element);
        }
      }

      iterations++;
    }

    // Los ejes finales ya están en currentAxes, pero asegurémonos de que estén sincronizados
    const finalAxes = {
      wght: currentWeight,
      GRAD: currentGrade,
      wdth: optimalWidth,
      slnt: initialAxes.slnt,
      ROND: initialAxes.ROND
    };

    // Aplicar estilos finales
    this.styleApplier.applyFontSize(this.element, fontSize);
    this.styleApplier.applyAxisValues(this.element, finalAxes);
    void this.element.offsetWidth;

    // Medir ancho final real del contenido después de aplicar todos los estilos
    let finalTextWidth = 0;
    this.charSpans.forEach(span => {
      const spanRect = span.getBoundingClientRect();
      finalTextWidth += spanRect.width;
    });
    
    if (finalTextWidth === 0) {
      finalTextWidth = this.measurer.measureWidth(this.element);
    }

    // Verificar si necesita flex layout (solo si hay espacio extra y ejes están altos)
    const needsFlex = finalTextWidth < containerWidth * 0.98 && 
                     this.calculator.areAxesMaximized(finalAxes);

    // Guardar estado final
    this.currentAxes = finalAxes;
    this.currentFontSize = fontSize;
    this.flexEnabled = needsFlex;
  }

  /**
   * Actualiza FitText después de cambios (relevance, GUI, etc.)
   * @param {Object} options - Opciones de actualización { relevance, slnt, ROND, ... }
   */
  update(options = {}) {
    let needsRefit = false;

    if (typeof options.relevance === 'number') {
      const newRelevance = Math.max(0, Math.min(1, options.relevance));
      if (newRelevance !== this.options.relevance) {
        this.options.relevance = newRelevance;
        needsRefit = true;
      }
    }

    if (typeof options.slnt === 'number') {
      this.currentAxes.slnt = options.slnt;
      needsRefit = true;
    }

    if (typeof options.ROND === 'number') {
      this.currentAxes.ROND = options.ROND;
      needsRefit = true;
    }

    // Re-ejecutar ajuste solo si hubo cambios relevantes
    if (needsRefit) {
      this.fit();
    }
  }

  /**
   * Obtiene los valores actuales de los ejes
   * @returns {Object} Valores actuales de ejes
   */
  getAxes() {
    return { ...this.currentAxes };
  }

  /**
   * Obtiene el fontSize actual
   * @returns {number|null} FontSize actual
   */
  getFontSize() {
    return this.currentFontSize;
  }

  /**
   * Verifica si flex layout está activo
   * @returns {boolean} True si flex está habilitado
   */
  isFlexEnabled() {
    return this.flexEnabled;
  }

  /**
   * Limpia recursos y restaura el elemento a su estado original
   */
  destroy() {
    this.measurer.cleanup();
    this.styleApplier.clearStyles(this.element);
    this.element.innerHTML = '';
    this.charSpans = [];
  }
}

