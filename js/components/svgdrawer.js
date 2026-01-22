/**
 * Clase para manejar el dibujo de elementos SVG
 * Proporciona métodos para crear, limpiar y dibujar paths en un contenedor SVG
 */
export default class SVGDrawer {
    /**
     * Constructor de la clase SVGDrawer
     * @param {HTMLElement} container - Elemento contenedor donde se creará el SVG
     */
    constructor(container) {
        this.container = container;
        this.svgNS = "http://www.w3.org/2000/svg";
        this.svg = document.createElementNS(this.svgNS, "svg");
        this.container.appendChild(this.svg);
    }

    /**
     * Limpia todos los elementos hijos del SVG
     */
    clear() {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    /**
     * Dibuja un path SVG con las propiedades especificadas
     * @param {string} pathData - Datos del path SVG (atributo 'd')
     * @param {number} offsetX - Desplazamiento en el eje X
     * @param {number} offsetY - Desplazamiento en el eje Y
     * @param {string} fillColor - Color de relleno del path
     */
    drawPath(pathData, offsetX, offsetY, fillColor) {
        const path = document.createElementNS(this.svgNS, "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", fillColor);
        path.setAttribute("transform", `translate(${offsetX}, ${offsetY})`);
        this.svg.appendChild(path);
    }

    /**
     * Establece las dimensiones del elemento SVG
     * @param {number} width - Ancho del SVG
     * @param {number} height - Alto del SVG
     */
    setSize(width, height) {
        this.svg.setAttribute("width", width);
        this.svg.setAttribute("height", height);
    }
}