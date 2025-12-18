
/**
 * Calcula el tamaño de fuente ajustado para que el texto quepa en el ancho disponible
 * @param {string} text - Texto a medir
 * @param {number} initialFontSize - Tamaño de fuente inicial
 * @param {number} maxWidth - Ancho máximo disponible en píxeles
 * @param {string} fontFamily - Familia de fuente
 * @param {string} fontWeight - Peso de fuente
 * @param {SVGElement} svg - Elemento SVG para medir
 * @returns {number} Tamaño de fuente ajustado
 */

export function fitText(text, initialFontSize, maxWidth, fontFamily, fontWeight, svg) {
    if (!text || !svg) return initialFontSize
    
    // Crear elemento temporal para medir
    const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    tempText.setAttribute('font-family', fontFamily || 'Arial, sans-serif')
    tempText.setAttribute('font-weight', fontWeight || 'normal')
    tempText.setAttribute('font-size', initialFontSize)
    tempText.textContent = text
    tempText.setAttribute('visibility', 'hidden')
    
    svg.appendChild(tempText)
    const textWidth = tempText.getComputedTextLength()
    svg.removeChild(tempText)
    
    // Si el texto ya cabe, usar el tamaño inicial
    if (textWidth <= maxWidth) {
      return initialFontSize
    }
    
    // Calcular factor de escala
    const scaleFactor = maxWidth / textWidth
    return initialFontSize * scaleFactor
  }