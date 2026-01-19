/**
 * TextMeasurer - Medición de texto usando elementos HTML (sin canvas)
 * Responsabilidad: Medir dimensiones de texto usando getBoundingClientRect y offsetWidth/Height
 */

export default class TextMeasurer {
  constructor() {
    this.tempElement = null;
  }

  /**
   * Mide el ancho de un elemento HTML
   * @param {HTMLElement} element - Elemento a medir
   * @returns {number} Ancho en píxeles
   */
  measureWidth(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return rect.width;
  }

  /**
   * Mide la altura de un elemento HTML
   * @param {HTMLElement} element - Elemento a medir
   * @returns {number} Altura en píxeles
   */
  measureHeight(element) {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return rect.height;
  }

  /**
   * Mide el ancho usando offsetWidth (más rápido, pero puede ser afectado por padding)
   * @param {HTMLElement} element - Elemento a medir
   * @returns {number} Ancho en píxeles
   */
  measureWidthOffset(element) {
    if (!element) return 0;
    return element.offsetWidth;
  }

  /**
   * Mide la altura usando offsetHeight
   * @param {HTMLElement} element - Elemento a medir
   * @returns {number} Altura en píxeles
   */
  measureHeightOffset(element) {
    if (!element) return 0;
    return element.offsetHeight;
  }

  /**
   * Crea un elemento temporal invisible para medir texto con estilos específicos
   * @param {string} text - Texto a medir
   * @param {Object} styles - Estilos CSS a aplicar
   * @returns {HTMLElement} Elemento temporal
   */
  createMeasurementElement(text, styles = {}) {
    // Limpiar elemento temporal anterior si existe
    if (this.tempElement && this.tempElement.parentNode) {
      this.tempElement.parentNode.removeChild(this.tempElement);
    }

    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'nowrap';
    temp.style.top = '-9999px';
    temp.style.left = '-9999px';
    temp.textContent = text;

    // Aplicar estilos base
    temp.style.fontFamily = styles.fontFamily || 'Google Sans Flex, sans-serif';
    temp.style.fontSize = styles.fontSize || '16px';
    temp.style.fontVariationSettings = styles.fontVariationSettings || 'normal';

    // Aplicar estilos adicionales
    Object.keys(styles).forEach(key => {
      if (!['fontFamily', 'fontSize', 'fontVariationSettings'].includes(key)) {
        temp.style[key] = styles[key];
      }
    });

    document.body.appendChild(temp);
    this.tempElement = temp;
    return temp;
  }

  /**
   * Mide texto con estilos específicos usando elemento temporal
   * @param {string} text - Texto a medir
   * @param {Object} styles - Estilos CSS
   * @returns {{width: number, height: number}} Dimensiones del texto
   */
  measureWithStyles(text, styles = {}) {
    const temp = this.createMeasurementElement(text, styles);
    
    // Forzar reflow para obtener medidas precisas
    void temp.offsetWidth;
    
    const width = this.measureWidth(temp);
    const height = this.measureHeight(temp);

    return { width, height };
  }

  /**
   * Limpia el elemento temporal si existe
   */
  cleanup() {
    if (this.tempElement && this.tempElement.parentNode) {
      this.tempElement.parentNode.removeChild(this.tempElement);
      this.tempElement = null;
    }
  }
}

