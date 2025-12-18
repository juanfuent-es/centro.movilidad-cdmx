export default class Ruta {
  constructor(_element) {
    this.element = _element;
    this.svg = this.element.querySelector("svg");
    this.container = document.createElement("span");
    this.min_wght = 200; /* 25-75 */
    this.min_wdth = 75; /* 100-900 */
    this.max_wght = 900;
    this.max_wdth = 125;
    this.text = this.element.innerText.trim();
    this.setup();
    this.applyVariationAttributes();
    this.fitTextToContainer();
  }

  setSVG() {
    const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    tempText.setAttribute('font-family', fontFamily || 'Arial, sans-serif')
    tempText.setAttribute('font-weight', fontWeight || 'normal')
    tempText.setAttribute('font-size', initialFontSize)
    tempText.textContent = text
    tempText.setAttribute('visibility', 'hidden')
    this.svg = tempText
  }

  /**
   * Setup inicial: convierte el texto en spans individuales para distribución con flexbox
   */
  setup() {
    // Limpiar el contenido del elemento
    this.element.innerHTML = '';
    
    // Convertir cada carácter (incluyendo espacios) en un span
    const characters = this.text.split('');
    characters.forEach((char, index) => {
      const span = document.createElement('var');
      span.textContent = char === ' ' ? '\u00A0' : char; // Usar non-breaking space para espacios
      span.className = 'char';
      this.element.appendChild(span);
    });
    
    // Aplicar flexbox al elemento para distribuir caracteres
    this.element.style.display = 'flex';
    this.element.style.flexWrap = 'nowrap'; // Forzar una sola línea
    this.element.style.justifyContent = 'space-between'; // Distribuir espacio entre caracteres
    this.element.style.alignItems = 'center';
    this.element.style.width = '100%';
    this.element.style.whiteSpace = 'nowrap'; // Prevenir saltos de línea
  }

  /**
   * Calcula los valores de variación tipográfica para toda la línea
   * @returns {Object} Objeto con valores wght, wdth, ital
   */
  getVariation() {
    // Calcular variaciones basadas en el seeder único de esta instancia
    const baseX = 0.1;
    const baseY = 0.15;
    
    // Peso (weight): variación suave entre min y max
    const wght = Math.floor(
      Math.abs(Math.sin(baseX) * (this.max_wght - this.min_wght)) + this.min_wght
    );
    
    // Ancho (width): variación suave entre min y max
    const wdth = Math.floor(
      Math.abs(Math.cos(baseY) * (this.max_wdth - this.min_wdth)) + this.min_wdth
    );
    
    // Slant/Italic: variación entre 0 y 10
    const ital = Math.floor(
      Math.abs(Math.sin(baseX + baseY) * 10)
    );
    
    return {
      wght: Math.max(this.min_wght, Math.min(this.max_wght, wght)),
      wdth: Math.max(this.min_wdth, Math.min(this.max_wdth, wdth)),
      ital: Math.max(0, Math.min(10, ital))
    };
  }

  /**
   * Aplica los atributos de variación CSS al elemento completo
   * y ajusta el ancho automáticamente
   */
  applyVariationAttributes() {
    const variation = this.getVariation();
    
    // Aplicar variables CSS al elemento completo
    this.element.style.setProperty("--wght", variation.wght);
    this.element.style.setProperty("--wdth", variation.wdth);
    this.element.style.setProperty("--ital", variation.ital);
    
    // Ajustar ancho automático basado en el valor de wdth
    this.adjustWidthAutomatically(variation.wdth);
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
    
    // Aplicar el factor de ancho como transformación o font-stretch
    // Usando font-stretch que es más semántico para variaciones de ancho
    const stretchValue = Math.round(widthFactor * 100);
    this.element.style.fontStretch = `${stretchValue}%`;
  }

  /**
   * Renderiza los estilos de variación en el elemento
   * (Método mantenido para compatibilidad, ahora delega a applyVariationAttributes)
   */
  render() {
    this.applyVariationAttributes();
  }

  /**
   * Método para ajustar el tamaño del texto para que quepa en una sola línea
   * dentro del contenedor padre, distribuyendo los caracteres con espacio entre ellos
   */
  fitTextToContainer() {
    if (!this.container) return;

    const container = this.container;
    const textElement = this.element;
    
    // Asegurar que el contenedor tenga dimensiones válidas
    const containerRect = container.getBoundingClientRect();
    let containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Si el contenedor no tiene ancho, usar el ancho del viewport o un valor por defecto
    if (containerWidth === 0) {
      containerWidth = container.offsetWidth || window.innerWidth * 0.8;
    }
    
    // Asegurar que el elemento tenga el 100% del ancho del contenedor
    textElement.style.width = '100%';
    textElement.style.maxWidth = `${containerWidth}px`;
    
    // Obtener el tamaño de fuente inicial
    let currentFontSize = parseFloat(window.getComputedStyle(textElement).fontSize) || 48;
    
    // Función para calcular el ancho total del texto con el fontSize dado
    const calculateTextWidth = (fontSize) => {
      textElement.style.fontSize = `${fontSize}px`;
      // Forzar reflow para obtener medidas precisas
      void textElement.offsetWidth;
      const rect = textElement.getBoundingClientRect();
      return rect.width;
    };
    
    // Calcular el ancho máximo basado en el número de caracteres
    // Considerar que con space-between, el ancho será aproximadamente el ancho del contenedor
    let minFontSize = 1;
    let maxFontSize = Math.min(containerHeight * 0.9, containerWidth / Math.max(this.text.length, 1) * 3);
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
    
    // Aplicar el fontSize óptimo
    textElement.style.fontSize = `${optimalFontSize}px`;
    
    // Asegurar que también quepa en altura
    const finalHeight = textElement.getBoundingClientRect().height;
    if (finalHeight > containerHeight) {
      const heightScale = containerHeight / finalHeight;
      optimalFontSize = optimalFontSize * heightScale * 0.95; // 95% para dejar un poco de margen
      textElement.style.fontSize = `${optimalFontSize}px`;
    }
    
    // Verificación final: asegurar que el texto quepa
    const finalWidth = textElement.getBoundingClientRect().width;
    if (finalWidth > containerWidth) {
      const widthScale = containerWidth / finalWidth;
      optimalFontSize = optimalFontSize * widthScale * 0.98; // 98% para dejar un pequeño margen
      textElement.style.fontSize = `${optimalFontSize}px`;
    }
  }

  getRandomColor() {
    const COLORS = ["#0F0", "#FF0", "#F0F", "#0FF", "#FFF", "#F00"];
    return COLORS[~~(Math.random() * COLORS.length)];
  }
}
