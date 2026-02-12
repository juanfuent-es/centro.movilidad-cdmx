/**
 * Constructor de la clase Preloader en ES5.
 * @constructor
 */
var Preloader = function() {
    // Obtener el elemento preloader
    this.container = document.querySelector("#preloader");
    // Obtener el botón de entrada
    this.enterBtn = document.querySelector("#enter-btn");
    
    // Verificar que los elementos existan
    if (!this.container) {
        console.error("El elemento #preloader no existe");
        return;
    }
    
    if (!this.enterBtn) {
        console.error("El elemento #enter-btn no existe");
        return;
    }
    
    // Estado del preloader
    this._isVisible = true;
    this.isAnimating = false;
    
    // Enlazar el evento click al botón
    this.enterBtn.addEventListener("click", this.onEnterClick.bind(this));
    
    // Inicializar el preloader (oculto por defecto si no hay animación inicial)
    this.init();
};

/**
 * Métodos definidos en el prototipo de Preloader
 */
Preloader.prototype = {
    // Restaurar el constructor
    constructor: Preloader,
    
    /**
     * Inicialización del preloader
     */
    init: function() {
        // Asegurar que el preloader esté visible inicialmente
        if (this.container) {
            this.container.style.display = "block";
            this.container.style.opacity = "1";
            this.container.style.visibility = "visible";
            this._isVisible = true;
        }
    },
    
    /**
     * Método: Verifica si el preloader es visible
     * @returns {boolean} - true si el preloader es visible
     */
    getIsVisible: function() {
        if (!this.container) return false;
        var style = window.getComputedStyle(this.container);
        return style.display !== "none" && style.visibility !== "hidden" && parseFloat(style.opacity) > 0;
    },
    
    /**
     * Manejador del evento click en el botón de entrada
     * @param {Event} event - El evento click
     */
    onEnterClick: function(event) {
        // Prevenir el comportamiento por defecto si es un enlace
        if (event.preventDefault) {
            event.preventDefault();
        }
        
        // Prevenir múltiples clics durante la animación
        if (this.isAnimating) {
            return false;
        }
        
        // Iniciar la animación de salida
        this.hide();
    },
    
    /**
     * Oculta el preloader con animación
     */
    hide: function() {
        if (!this.container || this.isAnimating) {
            return false;
        }
        
        this.isAnimating = true;
        
        // Verificar si GSAP está disponible
        if (typeof gsap !== "undefined") {
            // Crear una timeline de GSAP para la animación de salida
            var tl = gsap.timeline({
                onComplete: this.onHideComplete.bind(this)
            });
            
            // Animación de fade out y slide up
            tl.to(this.container, {
                opacity: 0,
                y: -50,
                duration: 0.8,
                ease: Power2.easeIn
            });
            
            // Ocultar el preloader después de la animación
            tl.set(this.container, {
                visibility: "hidden",
                display: "none"
            });
        } else {
            // Fallback si GSAP no está disponible (usar CSS transitions)
            this.container.style.transition = "opacity 0.8s ease-in, transform 0.8s ease-in";
            this.container.style.opacity = "0";
            this.container.style.transform = "translateY(-50px)";
            
            // Ocultar después de la animación
            var self = this;
            setTimeout(function() {
                self.container.style.visibility = "hidden";
                self.container.style.display = "none";
                self.onHideComplete();
            }, 800);
        }
    },
    
    /**
     * Callback cuando la animación de ocultado está completa
     */
    onHideComplete: function() {
        this.isAnimating = false;
        this._isVisible = false;
        
        // Despachar un evento personalizado para notificar que el preloader se ha ocultado
        if (typeof CustomEvent !== "undefined") {
            var event = new CustomEvent("preloaderHidden", {
                detail: {
                    preloader: this.container
                }
            });
            document.dispatchEvent(event);
        }
        
        // Remover el elemento del DOM si se desea (opcional)
        // this.container.parentNode.removeChild(this.container);
    },
    
    /**
     * Muestra el preloader (útil si se necesita volver a mostrar)
     */
    show: function() {
        if (!this.container || this.isAnimating) {
            return false;
        }
        
        this.isAnimating = true;
        this.container.style.display = "block";
        this.container.style.visibility = "visible";
        
        // Verificar si GSAP está disponible
        if (typeof gsap !== "undefined") {
            var self = this;
            var tl = gsap.timeline({
                onComplete: function() {
                    self.isAnimating = false;
                    self._isVisible = true;
                }
            });
            
            tl.from(this.container, {
                opacity: 0,
                y: -50,
                duration: 0.8,
                ease: Power2.easeOut
            });
        } else {
            // Fallback con CSS
            this.container.style.transition = "opacity 0.8s ease-out, transform 0.8s ease-out";
            this.container.style.opacity = "1";
            this.container.style.transform = "translateY(0)";
            
            var self = this;
            setTimeout(function() {
                self.isAnimating = false;
                self._isVisible = true;
            }, 800);
        }
    }
};

// Inicializar el preloader cuando el DOM esté listo
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
        var preloaderInstance = new Preloader();
        // Hacer disponible globalmente si es necesario
        window.preloaderInstance = preloaderInstance;
    });
} else {
    // El DOM ya está listo
    var preloaderInstance = new Preloader();
    window.preloaderInstance = preloaderInstance;
}

