/**
 * Canvas - Configuración básica de canvas y utilidades
 * @author JuanFuent.es
 */

// Configurar la relación de píxeles del dispositivo para pantallas de alta densidad
window.PX_RATIO = window.devicePixelRatio || 1;

/**
 * Clase para manejar la configuración y operaciones básicas de canvas
 * Proporciona métodos para dimensiones, limpieza, dibujo y manejo de imágenes
 */
export default class Canvas {
    /**
     * Constructor de la clase Canvas
     * Inicializa el canvas y su contexto 2D
     */
    constructor() {
        this.initializeCanvas();
    }

    /**
     * Inicializa el elemento canvas y obtiene su contexto 2D
     */
    initializeCanvas() {
        this.canvas = document.createElement("canvas");
        this.context = this.canvas.getContext("2d");
    }

    /**
     * Maneja el redimensionamiento del canvas
     * @param {number} _width - Ancho del canvas (por defecto: ancho de ventana)
     * @param {number} _height - Alto del canvas (por defecto: alto de ventana)
     */
    onResize(_width = window.innerWidth, _height = window.innerHeight) {
        this.setDimensions(_width, _height);
        this.updateCanvasSize();
    }

    /**
     * Establece las dimensiones del canvas considerando la densidad de píxeles
     * @param {number} width - Ancho en píxeles CSS
     * @param {number} height - Alto en píxeles CSS
     */
    setDimensions(width, height) {
        this.width = width * window.PX_RATIO;
        this.height = height * window.PX_RATIO;
    }

    /**
     * Actualiza el tamaño del elemento canvas con las dimensiones calculadas
     */
    updateCanvasSize() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Limpia todo el canvas
     */
    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Aplica el trazo con el color especificado
     * @param {string} _color - Color del trazo (por defecto: "#000")
     */
    stroke(_color = "#000") {
        this.context.strokeStyle = _color;
        this.context.stroke();
    }

    /**
     * Rellena el fondo del canvas con el color especificado
     * @param {string} _fill - Color de relleno (por defecto: "#000")
     */
    background(_fill = "#000") {
        this.context.fillStyle = _fill;
        this.context.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Alias para el método background
     * @param {string} _fill - Color de relleno
     */
    bg(_fill) {
        this.background(_fill);
    }

    /**
     * Dibuja una imagen en el canvas con los parámetros especificados
     * @param {HTMLImageElement} _img - Elemento de imagen a dibujar
     * @param {Object} params - Parámetros de dibujo
     * @param {number} params.offsetX - Desplazamiento en X
     * @param {number} params.offsetY - Desplazamiento en Y
     * @param {number} params.width - Ancho de la imagen
     * @param {number} params.height - Alto de la imagen
     */
    drawImage(_img, params) {
        this.context.drawImage(
            _img, 
            params.offsetX, 
            params.offsetY, 
            params.width, 
            params.height
        );
    }
}