/**
 * CanvasMeasurer - Medición de texto usando elemento DOM temporal optimizado
 * Responsabilidad: Medir ancho de texto de forma precisa usando los mismos valores CSS que el DOM final
 * 
 * NOTA: Aunque se llama "CanvasMeasurer", ahora usa un elemento DOM temporal porque
 * Canvas 2D API no soporta font-variation-settings directamente, lo que causaba
 * mediciones imprecisas. Este enfoque es preciso y optimizado para velocidad.
 */

export default class CanvasMeasurer {
  constructor() {
    this.tempElement = null;
    this.initTempElement();
  }

  /**
   * Inicializa el elemento temporal optimizado
   * Reutilizamos el mismo elemento para todas las mediciones para máxima velocidad
   */
  initTempElement() {
    if (this.tempElement) return;

    this.tempElement = document.createElement("span");
    
    // Optimizaciones críticas para máxima velocidad:
    // 1. position: absolute - No afecta layout de otros elementos
    // 2. visibility: hidden - No renderiza visualmente pero permite medición
    // 3. contain: layout style paint - Aísla el elemento del resto del DOM
    // 4. white-space: nowrap - Evita saltos de línea
    // 5. Fuera de la viewport - No causa scroll ni visual issues
    Object.assign(this.tempElement.style, {
      position: "absolute",
      visibility: "hidden",
      whiteSpace: "nowrap",
      top: "-9999px",
      left: "-9999px",
      contain: "layout style paint",
      pointerEvents: "none",
      willChange: "auto",
      transform: "translateZ(0)", // Acelera rendering con GPU
      backfaceVisibility: "hidden",
    });

    // Asegurar que está en el DOM (necesario para getBoundingClientRect)
    if (!this.tempElement.parentNode) {
      document.body.appendChild(this.tempElement);
    }
  }

  /**
   * Construye el string de font-variation-settings desde los ejes
   * Formato: "wght" 400, "wdth" 100, "GRAD" 0, "slnt" 0, "ROND" 0
   * @param {Object} axes - Objeto con valores de ejes { wght, wdth, GRAD, slnt, ROND }
   * @returns {string} String de font-variation-settings
   */
  buildVariationSettings(axes = {}) {
    const parts = [];
    
    // Orden específico: wght, wdth, GRAD, slnt, ROND (igual que CSS)
    if (typeof axes.wght === "number") {
      parts.push(`"wght" ${Math.round(axes.wght)}`);
    }
    if (typeof axes.wdth === "number") {
      parts.push(`"wdth" ${Math.round(axes.wdth)}`);
    }
    if (typeof axes.GRAD === "number") {
      parts.push(`"GRAD" ${Math.round(axes.GRAD)}`);
    }
    if (typeof axes.slnt === "number") {
      parts.push(`"slnt" ${Math.round(axes.slnt)}`);
    }
    if (typeof axes.ROND === "number") {
      parts.push(`"ROND" ${Math.round(axes.ROND)}`);
    }

    return parts.length > 0 ? parts.join(", ") : "normal";
  }

  /**
   * Mide el ancho del texto con los estilos dados
   * Usa un elemento DOM temporal con exactamente los mismos valores CSS que se aplicarán al DOM final
   * @param {string} text - Texto a medir
   * @param {Object} styles - Configuración de fuente { fontFamily, fontSize, axes }
   * @returns {number} Ancho en píxeles
   */
  measureWidth(text, styles = {}) {
    if (!text || !this.tempElement) return 0;

    const fontSize = styles.fontSize || "16px";
    const fontFamily = styles.fontFamily || "Google Sans Flex, sans-serif";
    const axes = styles.axes || {};

    // Construir font-variation-settings string exactamente como se usa en CSS
    const variationSettings = this.buildVariationSettings(axes);

    // Aplicar estilos exactamente como se aplican en el DOM final
    this.tempElement.style.fontFamily = fontFamily;
    this.tempElement.style.fontSize = fontSize;
    this.tempElement.style.fontVariationSettings = variationSettings;
    
    // Asegurar que white-space: nowrap está aplicado (necesario para medición precisa)
    this.tempElement.style.whiteSpace = "nowrap";
    
    // Establecer el texto
    this.tempElement.textContent = text;

    // Forzar reflow mínimo - solo necesitamos que el navegador calcule el layout
    // Usamos offsetWidth para forzar reflow sin leerlo (acelera el proceso)
    void this.tempElement.offsetWidth;

    // Obtener el ancho preciso usando getBoundingClientRect (más preciso que offsetWidth)
    const rect = this.tempElement.getBoundingClientRect();
    return rect.width;
  }

  /**
   * Limpieza del elemento temporal
   */
  cleanup() {
    if (this.tempElement && this.tempElement.parentNode) {
      this.tempElement.parentNode.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }
}
