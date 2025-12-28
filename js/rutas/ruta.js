import { fitText } from '../../fit_text.js';

export default class Ruta {
  constructor(_element, args = {}) {
    this.element = _element;
    this.text = this.element.innerText.trim();
    this.relevance = this.element.dataset.relevance || .9; /* 0-1 */
    // Límites de la variable Mona Sans (sólo como referencia, los usa fitText):
    // font-weight: 200 900;
    // font-stretch: 75% 125%;
    this.fontFamily = "'Mona Sans', sans-serif";
    this.minFontSize = 16; // tamaño mínimo de tipografía en px
    this.container = this.element.parentElement || this.element;

    this.setup();
    this.applyVariationAttributes();
    this.fitTextToContainer();
  }

  get maxWidth() {
    return this.element.getBoundingClientRect().width
  }
  /**
   * Setup inicial: convierte el texto en spans individuales para distribución con flexbox
   */
  setup() {
    // Limpiar el contenido del elemento
    this.element.innerHTML = "";

    this.span = document.createElement("span");
    this.element.appendChild(this.span);
    // Convertir cada carácter (incluyendo espacios) en un var
    const characters = this.text.split('');
    characters.forEach((char, index) => {
      const char_var = document.createElement('var');
      char_var.textContent = char === ' ' ? '\u00A0' : char; // Usar non-breaking space para espacios
      this.span.appendChild(char_var);
    });
  }

  /**
   * Aplica los atributos de variación CSS al elemento completo
   * y ajusta el ancho automáticamente
   */
  applyVariationAttributes() {
    const variation = fitText(this.relevance);

    // Usar SOLO variables CSS para tipografía; que el CSS se encargue de heredar
    const wght = Math.floor(variation.wght);
    const wdth = Math.floor(variation.wdth);

    this.element.style.setProperty("--wght", wght);
    this.element.style.setProperty("--wdth", wdth);

    // Ajustar ancho automático basado en el valor de wdth vía variable CSS
    this.adjustWidthAutomatically(wdth);
  }

  /**
   * Ajusta el ancho del texto automáticamente basado en el valor de wdth
   * @param {number} wdth - Valor de ancho de variación (75-125)
   */
  adjustWidthAutomatically(wdth) {
    // Normalizar wdth a un factor de escala (75 = 0.75, 125 = 1.25)
    // El valor base es 100, así que calculamos el factor relativo
    const baseWidth = 100;
    const widthFactor = wdth / baseWidth;

    // Aplicar el factor de ancho como font-stretch, usando SOLO variable CSS
    const stretchValue = Math.floor(widthFactor * 100);
    this.element.style.setProperty("--stretch", `${stretchValue}%`);
  }

  /**
   * Renderiza los estilos de variación en el elemento
   * (Método mantenido para compatibilidad, ahora delega a applyVariationAttributes)
   */
  render() {
    this.applyVariationAttributes();
  }

  /**
   * Método para ajustar el tamaño del texto para que QUEPA EN UNA SOLA LÍNEA
   * dentro del contenedor padre, distribuyendo los caracteres con espacio entre ellos.
   *
   * Parte de un tamaño mínimo (this.minFontSize) y busca el tamaño máximo posible
   * tal que el ancho del span de caracteres siga cabiendo en el ancho del contenedor.
   */
  fitTextToContainer() {
    if (!this.container || !this.span) return;

    const container = this.container;
    const textElement = this.element;
    
    // Asegurar que el elemento tenga el 100% del ancho del contenedor
    textElement.style.width = '100%';
    
    // Forzar un reflow inicial para asegurar que el elemento tenga dimensiones válidas
    void textElement.offsetWidth;
    
    // Obtener el ancho disponible del elemento mismo (no del contenedor padre)
    // Esto asegura que cada elemento calcule su tamaño basado en su propio espacio disponible
    // Usar getBoundingClientRect() para obtener el ancho real después del renderizado
    const elementRect = textElement.getBoundingClientRect();
    let containerWidth = elementRect.width;
    let containerHeight = elementRect.height;
    
    // Si el elemento no tiene ancho aún, intentar obtenerlo del contenedor padre
    // pero solo como fallback, ya que queremos usar el ancho del elemento mismo
    if (containerWidth === 0 || containerWidth === null || isNaN(containerWidth)) {
      const containerRect = container.getBoundingClientRect();
      containerWidth = containerRect.width || textElement.offsetWidth || window.innerWidth * 0.8;
      
      // Si aún no hay ancho, forzar otro reflow y volver a intentar
      if (containerWidth === 0) {
        void textElement.offsetWidth; // Forzar reflow
        const updatedRect = textElement.getBoundingClientRect();
        containerWidth = updatedRect.width || window.innerWidth * 0.8;
      }
    }
    
    // Asegurar que tenemos valores válidos
    if (containerWidth <= 0 || isNaN(containerWidth)) {
      console.warn(`Ruta: No se pudo obtener ancho válido para elemento`, textElement);
      containerWidth = window.innerWidth * 0.8; // Fallback seguro
    }
    
    // Si no hay altura, usar la altura del contenedor o un valor por defecto
    if (containerHeight === 0 || containerHeight === null || isNaN(containerHeight)) {
      const containerRect = container.getBoundingClientRect();
      containerHeight = containerRect.height || 100; // Fallback de altura
    }
    
    // Obtener el tamaño de fuente inicial
    // No usar el valor de la variable CSS global, sino calcular desde cero para cada instancia
    // Esto asegura que cada elemento calcule su tamaño independientemente
    let currentFontSize = this.minFontSize;
    
    // Función para actualizar el tamaño de fuente vía variable CSS
    // Esta función establece la variable SOLO en este elemento específico
    // Al establecer la variable en el elemento mismo, tiene mayor especificidad que la variable global
    const setFontSizeVar = (fontSize) => {
      const size = Math.floor(fontSize);
      // Establecer la variable CSS solo en este elemento, no globalmente
      textElement.style.setProperty("--font-size-dynamic", `${size}px`);
    };

    // Función para calcular el ancho total del texto con el fontSize dado
    const updateFontSize = (fontSize) => {
      setFontSizeVar(fontSize);
      // Forzar reflow para obtener medidas precisas
      void this.span.offsetWidth;
    };

    const calculateTextWidth = (fontSize) => {
      updateFontSize(fontSize);
      const rect = this.span.getBoundingClientRect();
      return rect.width;
    };
    
    // Calcular el ancho máximo basado en el número de caracteres
    // Considerar que con space-between, el ancho será aproximadamente el ancho del contenedor
    let minFontSize = this.minFontSize;
    let maxFontSize = Math.min(
      containerHeight * 0.9,
      (containerWidth / Math.max(this.text.length, 1)) * 3
    );
    let optimalFontSize = Math.min(currentFontSize, maxFontSize);
    const tolerance = 0.1; // Tolerancia en píxeles
    
    // Búsqueda binaria para encontrar el fontSize óptimo que quepa en el ancho
    let iterations = 0;
    const maxIterations = 50; // Prevenir bucles infinitos
    
    while (maxFontSize - minFontSize > tolerance && iterations < maxIterations) {
      const testFontSize = (minFontSize + maxFontSize) / 2;
      const textWidth = calculateTextWidth(testFontSize);
      
      if (textWidth <= containerWidth) {
        optimalFontSize = testFontSize;
        minFontSize = testFontSize;
      } else {
        maxFontSize = testFontSize;
      }
      iterations++;
    }
    // Aplicar el fontSize óptimo (redondeado hacia abajo) vía variable CSS
    setFontSizeVar(optimalFontSize);
    
    // Forzar un reflow para obtener medidas actualizadas después de aplicar el tamaño
    void textElement.offsetWidth;
    
    // Asegurar que también quepa en altura (usar el contenedor padre para altura si está disponible)
    const finalHeight = textElement.getBoundingClientRect().height;
    const availableHeight = containerHeight > 0 ? containerHeight : finalHeight;
    if (finalHeight > availableHeight && availableHeight > 0) {
      const heightScale = availableHeight / finalHeight;
      optimalFontSize = Math.floor(optimalFontSize * heightScale * 0.95); // 95% para dejar un poco de margen
      setFontSizeVar(optimalFontSize);
      void textElement.offsetWidth; // Forzar reflow después del ajuste
    }
    
    // Verificación final: asegurar que el texto quepa en el ancho disponible del elemento
    const finalWidth = textElement.getBoundingClientRect().width;
    const availableWidth = containerWidth > 0 ? containerWidth : finalWidth;
    if (finalWidth > availableWidth && availableWidth > 0) {
      const widthScale = availableWidth / finalWidth;
      optimalFontSize = Math.floor(optimalFontSize * widthScale * 0.98); // 98% para dejar un pequeño margen
      setFontSizeVar(optimalFontSize);
    }
  }

}
