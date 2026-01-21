/**
 * FitText - Clase principal para ajustar texto en elementos HTML usando fuentes variables
 * Responsabilidad: Coordinar el ajuste de texto, renderizar caracteres como spans, aplicar estilos
 */

import CanvasMeasurer from "./fitText/CanvasMeasurer.js";
import AxisCalculator from "./fitText/AxisCalculator.js";
import StyleApplier from "./fitText/StyleApplier.js";
import CharacterAnimator from "./fitText/CharacterAnimator.js";

export default class FitText {
  constructor(element, options = {}) {
    if (!element || !(element instanceof HTMLElement)) {
      throw new Error("FitText: se requiere un elemento HTML válido");
    }

    this.element = element;
    // Solo animar caracteres cuando el atributo data-motion="true"
    // (o se pasa motion: true en options). Ahorra creación de animadores
    // y actualizaciones por frame en elementos estáticos.
    this._motionEnabled =
      options.motion === true || this.element.dataset.motion === "true";

    // Configuración base
    this._options = {
      fontFamily: options.fontFamily || "Google Sans Flex, sans-serif",
      relevance: 0.5,
      debounceTime: options.debounceTime || 100,
      ...options,
    };

    // Inicializar relevance si viene en options o dataset
    const dataRelevance = this.element.dataset.relevance;
    if (dataRelevance) {
      const parsed = parseFloat(dataRelevance);
      if (!isNaN(parsed))
        this._options.relevance = Math.max(0, Math.min(1, parsed));
    } else if (typeof options.relevance === "number") {
      this._options.relevance = Math.max(0, Math.min(1, options.relevance));
    }

    // Inicializar componentes
    this.measurer = new CanvasMeasurer();
    this.calculator = new AxisCalculator();
    this.styleApplier = new StyleApplier(this._options.fontFamily);

    // Estado interno
    this.charSpans = [];
    this._currentAxes = {};
    this._resizeObserver = null;
    this._resizeTimeout = null;
    this._originalText = null; // Guardar texto original para mediciones consistentes
    this._characterAnimators = [];
    this._characterAnimConfig = options.characterAnimConfig || {
      radius: 240,
      lerp: 0.18,
      influence: { wght: 100, GRAD: 35, slnt: -10, ROND: 45 },
      opacity: { min: 0.65, max: 1 },
    };
    //
    this.setupText();
    // Iniciar observación de redimensionamiento
    this.initResizeObserver();
  }
  
  setupText() {
    // Renderizar texto como spans desde el inicio
    const text = this.element.textContent || this.element.innerText || "";
    // Guardar texto normalizado (espacios convertidos a \u00A0) para consistencia en mediciones
    this._originalText = this.normalizeText(text);
    this.renderAsSpans();
    // Aplicar estilos base
    this.styleApplier.applyAxisValues(this.element, {});
  }

  // Getters para separar responsabilidades y mejorar acceso
  get relevance() {
    return this._options.relevance;
  }
  set relevance(val) {
    this.update({ relevance: val });
  }

  get currentAxes() {
    return { ...this._currentAxes };
  }

  /**
   * Extrae el texto del elemento
   */
  extractText(element) {
    return element.textContent || element.innerText || "";
  }

  /**
   * Normaliza el texto para renderizado (convierte espacios a \u00A0)
   * @returns {string} Texto normalizado
   */
  normalizeText(text) {
    return text.replace(/ /g, "\u00A0");
  }

  /**
   * Renderiza el texto como array de spans
   */
  renderAsSpans() {
    this.element.innerHTML = "";
    this.charSpans = [];
    for (let i = 0; i < this._originalText.length; i++) {
      const char = this._originalText[i];
      const span = document.createElement("span");
      span.textContent = char;
      this.element.appendChild(span);
      this.charSpans.push(span);
    }

    // (Re)crear animadores por caracter para los spans actuales
    this.initCharacterAnimators();
  }

  /**
   * Inicializa (o reinicializa) la lista de CharacterAnimator, uno por span.
   * Se llama tras renderAsSpans() y cuando cambian los ejes base por fit().
   */
  initCharacterAnimators() {
    if (!this._motionEnabled) {
      this._characterAnimators = [];
      return;
    }

    const baseAxes = this.getBaseAxesForCharacters();
    // Obtener rangos de ejes del calculator para interpolación completa
    const axisRanges = {
      wght: { min: 400, max: 1000, default: 400 },
      GRAD: this.calculator.axisRanges.GRAD,
      slnt: this.calculator.axisRanges.slnt,
      ROND: this.calculator.axisRanges.ROND,
    };
    
    const config = {
      ...this._characterAnimConfig,
      axisRanges,
    };
    
    this._characterAnimators = this.charSpans.map(
      (span) => new CharacterAnimator(span, baseAxes, config),
    );
  }

  /**
   * Ejes base para caracteres:
   * - wdth se mantiene fijo (define ancho)
   * - el resto sale del estado actual de FitText (si existe), o defaults razonables
   */
  getBaseAxesForCharacters() {
    const fallback = { wght: 400, GRAD: 0, wdth: 100, slnt: 0, ROND: 0 };
    return {
      wght: this._currentAxes.wght ?? fallback.wght,
      GRAD: this._currentAxes.GRAD ?? fallback.GRAD,
      wdth: this._currentAxes.wdth ?? fallback.wdth,
      slnt: this._currentAxes.slnt ?? fallback.slnt,
      ROND: this._currentAxes.ROND ?? fallback.ROND,
    };
  }

  /**
   * Aplica update por caracter en cascada.
   * @param {{x:number,y:number,active:boolean}} pointer
   */
  updateCharacters(pointer) {
    if (!this._motionEnabled) return;

    // Si aún no hay spans (o se re-renderizaron), asegurar animadores
    if (!this._characterAnimators.length || this._characterAnimators.length !== this.charSpans.length) {
      this.initCharacterAnimators();
    }
    for (const anim of this._characterAnimators) {
      anim.update(pointer);
    }
  }

  /**
   * Inicializa ResizeObserver con debounce
   */
  initResizeObserver() {
    if (this._resizeObserver) return;

    this._resizeObserver = new ResizeObserver((entries) => {
      // Usar debounce para evitar múltiples llamadas en ráfaga
      if (this._resizeTimeout) clearTimeout(this._resizeTimeout);

      this._resizeTimeout = setTimeout(() => {
        // Solo reajustar si el ancho del contenedor ha cambiado significativamente
        for (const entry of entries) {
          // Podríamos verificar entry.contentRect.width vs width anterior si almacenamos estado,
          // pero fit() ya maneja lógica de ajuste.
          this.fit();
        }
      }, this._options.debounceTime);
    });

    // Observamos el propio elemento, ya que es el que queremos ajustar
    this._resizeObserver.observe(this.element);
  }

  /**
   * Ejecuta el algoritmo completo de ajuste de texto
   */
  fit() {
    // Obtener dimensiones del contenedor (el propio elemento)
    // Usamos getBoundingClientRect() para precisión, pero confiamos en que CSS width: 100% lo restringe
    // Todos los cálculos con enteros para evitar problemas de precisión con flotantes en valores grandes (ej: 14vw)
    const containerRect = this.element.getBoundingClientRect();
    const containerComputedStyle = window.getComputedStyle(this.element);
    const fontSizeFromCSS = Math.round(parseFloat(containerComputedStyle.fontSize));

    if (isNaN(fontSizeFromCSS) || fontSizeFromCSS <= 0) {
      console.warn("FitText: fontSize inválido desde CSS", fontSizeFromCSS);
      return;
    }

    // Calcular ancho disponible (content box) - todos los valores redondeados a enteros
    const paddingLeft = Math.round(parseFloat(containerComputedStyle.paddingLeft) || 0);
    const paddingRight = Math.round(parseFloat(containerComputedStyle.paddingRight) || 0);
    const borderLeft = Math.round(parseFloat(containerComputedStyle.borderLeftWidth) || 0);
    const borderRight = Math.round(parseFloat(containerComputedStyle.borderRightWidth) || 0);

    const containerWidth = Math.floor(
      Math.round(containerRect.width) -
      paddingLeft -
      paddingRight -
      borderLeft -
      borderRight
    );
    if (containerWidth <= 0) {
      // Si el ancho es 0, puede ser que el elemento esté oculto o no renderizado aún.
      return;
    }

    // 1. Calcular weight y grade desde relevance
    // Estos cálculos son puros (JS), no tocan DOM
    const weight = this.calculator.calculateWeight(this.relevance);
    const grade = this.calculator.calculateGrade(this.relevance);

    // 2. Prep ejes iniciales
    const initialAxes = {
      wght: weight,
      GRAD: grade,
      slnt: this._currentAxes.slnt ?? 0,
      ROND: this._currentAxes.ROND ?? 0,
    };

    // Texto completo para medir - usar el texto normalizado guardado
    // que coincide exactamente con el texto renderizado (espacios convertidos a \u00A0)
    const fullText = this._originalText || this.normalizeText(this.element.textContent || "");

    // 3. Callback de medición usando Canvas (SÍNCRONO y sin REFLOW)
    // Esto es mucho más rápido que medir DOM nodes
    const measureWidthCallback = (axes) => {
      return this.measurer.measureWidth(fullText, {
        fontSize: `${fontSizeFromCSS}px`,
        fontFamily: this._options.fontFamily,
        axes: axes,
      });
    };

    // 4. Calcular width óptimo con algoritmo iterativo (ahora mucho más rápido)
    let optimalWidth = this.calculator.calculateOptimalWidth(
      containerWidth,
      measureWidthCallback,
      initialAxes,
    );

    // 5. Ajuste fino si hay desbordamiento (usando medidas canvas)
    // El algoritmo original ya hacía esto en calculateOptimalWidth mayormente,
    // pero aquí mantenemos la lógica de reducción de weight/grade si width llega al tope.

    let currentWeight = weight;
    let currentGrade = grade;
    let textWidth = Math.round(measureWidthCallback({
      ...initialAxes,
      wdth: optimalWidth,
    }));

    // Solo si el texto es mucho más grande que el contenedor a pesar del width mínimo
    // intentamos reducir otros ejes.
    // Iteramos puramente en JS/Canvas - todos los cálculos con enteros
    let iterations = 0;
    const maxIterations = 15; // Reducido pues Canvas es rápido pero no queremos bloquear hilo principal
    const containerWidthInt = Math.floor(containerWidth);

    while (textWidth > containerWidthInt && iterations < maxIterations) {
      // Lógica de reducción similar a la original
      const wghtRange = this.calculator.axisRanges.wght;
      const gradRange = this.calculator.axisRanges.GRAD;
      const wdthRange = this.calculator.axisRanges.wdth;

      // Cálculos con enteros para evitar problemas de precisión
      const overflowRatio = Math.min(
        1,
        Math.floor((textWidth - containerWidthInt) * 100) / (containerWidthInt * 100),
      );

      let changed = false;

      if (currentWeight > wghtRange.min) {
        const step = Math.max(
          10,
          Math.floor((currentWeight - wghtRange.min) * 0.1 * overflowRatio),
        );
        currentWeight = Math.max(wghtRange.min, currentWeight - step);
        changed = true;
      }

      if (currentGrade > gradRange.min) {
        const step = Math.max(
          5,
          Math.floor((currentGrade - gradRange.min) * 0.1 * overflowRatio),
        );
        currentGrade = Math.max(gradRange.min, currentGrade - step);
        changed = true;
      }

      if (optimalWidth > wdthRange.min) {
        // Si aún se puede reducir width
        const step = Math.max(
          2,
          Math.floor((optimalWidth - wdthRange.min) * 0.1 * overflowRatio),
        );
        optimalWidth = Math.max(wdthRange.min, optimalWidth - step);
        changed = true;
      }

      if (!changed) break;

      // Recalcular con nuevos valores
      optimalWidth = this.calculator.calculateOptimalWidth(
        containerWidth,
        measureWidthCallback,
        {
          wght: currentWeight,
          GRAD: currentGrade,
          slnt: initialAxes.slnt,
          ROND: initialAxes.ROND,
        },
      );

      textWidth = Math.round(measureWidthCallback({
        wght: currentWeight,
        GRAD: currentGrade,
        wdth: optimalWidth,
        slnt: initialAxes.slnt,
        ROND: initialAxes.ROND,
      }));

      iterations++;
    }

    // 6. Aplicar cambios al DOM UNA SOLA VEZ al final
    const finalAxes = {
      wght: currentWeight,
      GRAD: currentGrade,
      wdth: optimalWidth,
      slnt: initialAxes.slnt,
      ROND: initialAxes.ROND,
    };

    if (JSON.stringify(finalAxes) !== JSON.stringify(this._currentAxes)) {
      this.styleApplier.applyAxisValues(this.element, finalAxes);
      this._currentAxes = finalAxes;
      
      // Verificación final: medir el ancho real del DOM después de aplicar estilos
      // Esto compensa diferencias entre medición (texto continuo) y renderizado (spans separados)
      // Forzar reflow y medir el ancho real sumando todos los spans
      void this.element.offsetWidth;
      
      // Calcular el ancho real del texto sumando el ancho de todos los spans
      // Redondear a enteros para evitar problemas de precisión con flotantes
      let actualTextWidth = 0;
      for (const span of this.charSpans) {
        const rect = span.getBoundingClientRect();
        actualTextWidth += Math.round(rect.width);
      }
      actualTextWidth = Math.floor(actualTextWidth);
      
      // Si aún desborda en el DOM real, reducir width progresivamente hasta que quepa
      // Usar 95% del contenedor como margen de seguridad - cálculos con enteros
      const safetyMargin = Math.floor(containerWidth * 0.95);
      let finalOptimalWidth = optimalWidth;
      let safetyIterations = 0;
      
      while (actualTextWidth > safetyMargin && finalOptimalWidth > this.calculator.axisRanges.wdth.min && safetyIterations < 20) {
        finalOptimalWidth = Math.max(finalOptimalWidth - 1, this.calculator.axisRanges.wdth.min);
        const adjustedAxes = { ...finalAxes, wdth: finalOptimalWidth };
        this.styleApplier.applyAxisValues(this.element, adjustedAxes);
        this._currentAxes = adjustedAxes;
        
        void this.element.offsetWidth; // Forzar reflow
        actualTextWidth = 0;
        for (const span of this.charSpans) {
          const rect = span.getBoundingClientRect();
          actualTextWidth += Math.round(rect.width);
        }
        actualTextWidth = Math.floor(actualTextWidth);
        
        if (actualTextWidth <= safetyMargin) {
          break;
        }
        
        safetyIterations++;
      }
    }

    // Sincronizar ejes base para animación por caracter tras cualquier ajuste
    if (this._motionEnabled && this._characterAnimators.length) {
      const baseAxes = this.getBaseAxesForCharacters();
      for (const anim of this._characterAnimators) {
        anim.setBaseAxes(baseAxes);
      }
    } else if (this._motionEnabled && this.charSpans.length) {
      this.initCharacterAnimators();
    }
  }

  /**
   * Actualiza FitText después de cambios
   */
  update(options = {}) {
    let needsRefit = false;

    if (typeof options.relevance === "number") {
      const val = Math.max(0, Math.min(1, options.relevance));
      if (val !== this._options.relevance) {
        this._options.relevance = val;
        needsRefit = true;
      }
    }

    // Otros setters...
    if (typeof options.slnt === "number") {
      this._currentAxes.slnt = options.slnt;
      needsRefit = true;
    }

    // ... podría seguir con más propiedades

    if (needsRefit) this.fit();

    // Cascada de animación por frame (si viene pointer)
    if (options.pointer) {
      this.updateCharacters(options.pointer);
    }
  }

  /**
   * Limpia recursos
   */
  destroy() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout);

    this.measurer.cleanup();
    this.styleApplier.clearStyles(this.element);
    this.element.innerHTML = "";
    this.charSpans = [];
  }
}
