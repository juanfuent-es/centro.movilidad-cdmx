/**
 * StyleApplier - Aplicación de estilos CSS a elementos y spans
 * Responsabilidad: Aplicar valores de ejes como CSS variables, fontSize, y flex layout
 */

export default class StyleApplier {
  constructor(fontFamily = 'Google Sans Flex, sans-serif') {
    this.fontFamily = fontFamily;
    this.flexClassName = 'fit-text-flex';
  }

  /**
   * Aplica valores de ejes como CSS variables al contenedor
   * @param {HTMLElement} container - Elemento contenedor
   * @param {Object} axes - Valores de ejes { wght, GRAD, wdth, slnt, ROND }
   */
  applyAxisValues(container, axes = {}) {
    if (!container) return;

    // Aplicar variables CSS individuales
    if (typeof axes.wght === 'number') {
      container.style.setProperty('--font-variation-wght', ~~axes.wght);
    }
    if (typeof axes.GRAD === 'number') {
      container.style.setProperty('--font-variation-GRAD', ~~axes.GRAD);
    }
    if (typeof axes.wdth === 'number') {
      container.style.setProperty('--font-variation-wdth', ~~axes.wdth);
    }
    if (typeof axes.slnt === 'number') {
      container.style.setProperty('--font-variation-slnt', ~~axes.slnt);
    }
    if (typeof axes.ROND === 'number') {
      container.style.setProperty('--font-variation-ROND', ~~axes.ROND);
    }

    // Asegurar que la familia de fuente esté aplicada
    container.style.fontFamily = this.fontFamily;
  }

  /**
   * Aplica fontSize al contenedor
   * @param {HTMLElement} container - Elemento contenedor
   * @param {number} size - Tamaño de fuente en px
   */
  applyFontSize(container, size) {
    if (!container || typeof size !== 'number' || size <= 0) return;
    container.style.fontSize = `${size}px`;
  }

  /**
   * Limpia todos los estilos aplicados
   * @param {HTMLElement} container - Elemento contenedor
   */
  clearStyles(container) {
    if (!container) return;

    container.style.fontSize = '';
    container.style.setProperty('--font-variation-wght', '');
    container.style.setProperty('--font-variation-GRAD', '');
    container.style.setProperty('--font-variation-wdth', '');
    container.style.setProperty('--font-variation-slnt', '');
    container.style.setProperty('--font-variation-ROND', '');

    if (container._originalStyles) {
      delete container._originalStyles;
    }
  }
}

