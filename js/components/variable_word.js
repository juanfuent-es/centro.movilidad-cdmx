// src/components/variable_word.js

import SvgVariableCharacter from "./variable_char.js";

/**
 * Clase para crear palabras variables que responden al movimiento del mouse
 * Renderiza cada carácter con variaciones de peso y ancho basadas en la distancia al cursor
 */
export default class SvgVariableWord {
    /**
     * Constructor de la clase SvgVariableWord
     * @param {HTMLElement} titleElement - Elemento contenedor donde se renderizará la palabra
     * @param {Object} options - Opciones de configuración
     * @param {boolean} options.width - Habilitar variación de ancho
     * @param {boolean} options.weight - Habilitar variación de peso
     */
    constructor(titleElement, options = {}) {
        this.titleElement = titleElement;
        
        this.variationSettings = {
            width: options.width !== undefined ? options.width : true,
            weight: options.weight !== undefined ? options.weight : true
        };
        
        this.friction = .05;
        this.maximumDistance = 0;
        this.smoothedMousePosition = { x: 0, y: 0 };
        this.rawMousePosition = {
            x: window.innerWidth,
            y: window.innerHeight
        };
        
        this.characterElements = [];
        
        this.initialize();
        this.setupEventListeners();
        this.startAnimation();
    }
    
    /**
     * Inicializa la palabra variable
     * Extrae el texto del elemento y crea un VariableChar para cada carácter
     */
    initialize() {
        this.textContent = this.titleElement.innerText;
        this.titleElement.innerHTML = "";
        
        for (let i = 0; i < this.textContent.length; i++) {
            const characterElement = new SvgVariableCharacter(this.titleElement, this.textContent[i]);
            this.characterElements.push(characterElement);
        }
    }
    
    /**
     * Configura los event listeners para mouse y touch
     */
    setupEventListeners() {
        window.addEventListener("mousemove", (event) => {
            this.rawMousePosition.x = event.clientX;
            this.rawMousePosition.y = event.clientY;
        });
        
        window.addEventListener("touchmove", (event) => {
            const touch = event.touches[0];
            this.rawMousePosition.x = touch.clientX;
            this.rawMousePosition.y = touch.clientY;
        }, { passive: false });
    }
    
    /**
     * Inicia el bucle de animación
     * Actualiza la posición del mouse y los caracteres en cada frame
     */
    startAnimation() {
        this.updateSmoothedMousePosition();
        requestAnimationFrame(() => this.startAnimation());
        this.updateAllCharacters();
    }
    
    /**
     * Suaviza la posición del mouse usando interpolación lineal
     * Aplica el factor de fricción para crear un movimiento más fluido
     */
    updateSmoothedMousePosition() {
        this.smoothedMousePosition.x += (this.rawMousePosition.x - this.smoothedMousePosition.x) * this.friction;
        this.smoothedMousePosition.y += (this.rawMousePosition.y - this.smoothedMousePosition.y) * this.friction;
    }
    
    /**
     * Actualiza las variaciones de todos los caracteres
     * Calcula la distancia máxima y aplica las variaciones basadas en la posición del mouse
     */
    updateAllCharacters() {
        this.maximumDistance = this.titleElement.getBoundingClientRect().width / 2;
        
        for (let i = 0; i < this.characterElements.length; i++) {
            this.characterElements[i].updateVariations({
                wght: this.variationSettings.weight,
                wdth: this.variationSettings.width
            }, this.smoothedMousePosition, this.maximumDistance);
        }
    }
}