/**
 * Clase Header en ES6 para manejar el comportamiento del encabezado
 * @class
 */
export class Header {
    /**
     * Crea una instancia de Header
     * @constructor
     */
    constructor() {
        // Propiedades
        this.y = 0;
        this.container = document.querySelector("#main-header");
        
        if (!this.container) {
            console.warn("No se encontró el elemento #main-header");
            return;
        }
        
        window.addEventListener("scroll", this.onScroll.bind(this));

        // Ejecución inicial de onScroll
        this.onScroll();
    }

    /**
     * Getter: Calcula la altura del contenedor
     * @returns {number} La altura del contenedor en píxeles
     */
    get height() {
        const rect = this.container.getBoundingClientRect();
        return Math.floor(rect.height);
    }
    
    /**
     * Getter: Determina la dirección del scroll
     * @returns {string} "up" si el scroll es hacia arriba, "down" si es hacia abajo
     */
    get direction() {
        if (this.y > window.scrollY) {
            return "up";
        } else {
            return "down";
        }
    }

    /**
     * Getter: Verifica si el encabezado es visible (tiene la clase 'header-visible')
     * @returns {boolean} true si el header es visible, false en caso contrario
     */
    get isVisible() {
        return this.container.classList.contains("header-visible");
    }
    
    /**
     * Getter: Verifica si el encabezado está en la posición superior (tiene la clase 'in-top')
     * @returns {boolean} true si el header está en la parte superior, false en caso contrario
     */
    get inTop() {
        return this.container.classList.contains("in-top");
    }

    /**
     * Asigna el valor actual del scroll a la propiedad 'y'
     * @param {number} y El valor de window.scrollY
     */
    setY(y) {
        this.y = y;
    }

    /**
     * Manejador del evento scroll
     */
    onScroll() {
        // Si está en el top (scrollY === 0), resetear a estado inicial
        if (window.scrollY === 0) {
            this.reset();
        } else {
            // Si el scroll es hacia abajo, ocultar con posición absoluta
            if (this.direction === "down") {
                this.scrollDown();
            } else {
                // Si el scroll es hacia arriba, mostrar el header
                this.show();
            }
        }
        
        // Asignamos a y el valor de window.scrollY
        this.setY(window.scrollY);
    }
    
    /**
     * Lógica al hacer scroll hacia abajo
     * El header debe tener posición absoluta e irse hacia arriba (ocultarse)
     */
    scrollDown() {
        // Remover clases de visibilidad y fixed
        this.container.classList.remove("header-visible");
        this.container.classList.remove("header-fixed");
        // Agregar clases para posición absoluta y oculto
        this.container.classList.add("header-absolute");
        this.container.classList.add("header-hidden");
        // Establecer la posición top basada en el scroll actual para que se mueva con el scroll
        this.container.style.top = `${window.scrollY}px`;
    }

    /**
     * Muestra el encabezado cuando el scroll es hacia arriba
     */
    show() {
        // Remover clases de oculto y absoluto
        this.container.classList.remove("header-hidden");
        this.container.classList.remove("header-absolute");
        // Limpiar el estilo top que se estableció con posición absoluta
        this.container.style.top = "";
        // Agregar clases para posición fixed y visible
        this.container.classList.add("header-fixed");
        this.container.classList.add("header-visible");
    }

    /**
     * Restablece el encabezado a su estado inicial en la parte superior
     */
    reset() {
        // Remover todas las clases de animación
        this.container.classList.remove("header-visible");
        this.container.classList.remove("header-hidden");
        this.container.classList.remove("header-fixed");
        this.container.classList.remove("header-absolute");
        // Limpiar estilos inline
        this.container.style.top = "";
        // Agregar clase de estado inicial
        this.container.classList.add("in-top");
    }
}