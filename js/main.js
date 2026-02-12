const headerInstance = new Header();
const lenis = new Lenis({
    lerp: 0.1,
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
});

// Loop de animación para Lenis
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

/**
 * Función para obtener el elemento project-container que está más visible en el viewport
 * @returns {HTMLElement|null} - El elemento project-container más visible o null
 */
function getCurrentProjectContainer() {
    const projectContainers = document.querySelectorAll('.project-container');
    let maxVisibleArea = 0;
    let mostVisibleElement = null;
    
    projectContainers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Calcular el área visible del elemento
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(windowHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibleArea = visibleHeight * rect.width;
        
        // Si el elemento está visible y tiene más área visible que el anterior
        if (visibleArea > 0 && visibleArea > maxVisibleArea) {
            maxVisibleArea = visibleArea;
            mostVisibleElement = container;
        }
    });
    
    return mostVisibleElement;
}

/**
 * Función para actualizar el color de fondo del body basado en el project-container visible
 */
function updateBodyBackgroundColor() {
    const currentContainer = getCurrentProjectContainer();
    const body = document.body;
    
    // Remover todas las clases de color anteriores
    body.classList.remove('bg-orange', 'bg-pink', 'bg-green', 'bg-red', 'bg-blue', 'bg-black', 'bg-white');
    
    if (currentContainer) {
        const color = currentContainer.getAttribute('data-color');
        if (color) {
            body.classList.add(`bg-${color}`);
        }
    }
}

// Variables para el snap personalizado
let scrollTimeout = null;
let isScrolling = false;

/**
 * Función para encontrar el project-container más cercano al viewport
 * @returns {HTMLElement|null} - El elemento project-container más cercano
 */
function getNearestProjectContainer() {
    const projectContainers = document.querySelectorAll('.project-container');
    let nearestElement = null;
    let minDistance = Infinity;
    const viewportCenter = window.innerHeight / 2;
    
    projectContainers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const elementCenter = rect.top + (rect.height / 2);
        const distance = Math.abs(viewportCenter - elementCenter);
        
        // Solo considerar elementos que estén al menos parcialmente visibles
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
            if (distance < minDistance) {
                minDistance = distance;
                nearestElement = container;
            }
        }
    });
    
    return nearestElement;
}

/**
 * Función para verificar si un proyecto está correctamente alineado (dentro de un umbral)
 * @param {HTMLElement} container - El contenedor a verificar
 * @returns {boolean} - true si está bien alineado
 */
function isProjectAligned(container) {
    if (!container) return false;
    const rect = container.getBoundingClientRect();
    const threshold = 50; // Píxeles de tolerancia
    return Math.abs(rect.top) < threshold;
}

/**
 * Función para hacer snap al project-container más cercano
 */
function snapToNearestProject() {
    const nearestContainer = getNearestProjectContainer();
    if (nearestContainer && !isProjectAligned(nearestContainer)) {
        const rect = nearestContainer.getBoundingClientRect();
        const currentScroll = window.scrollY;
        const targetScroll = currentScroll + rect.top;
        
        // Solo hacer snap si la diferencia es significativa
        if (Math.abs(rect.top) > 10) {
            // Usar Lenis para hacer scroll suave al proyecto
            lenis.scrollTo(targetScroll, {
                duration: 0.8,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            });
        }
    }
}

// Agregar listener de scroll para actualizar el color de fondo y hacer snap
lenis.on('scroll', () => {
    updateBodyBackgroundColor();
    
    // Detectar cuando el usuario deja de hacer scroll
    isScrolling = true;
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
        isScrolling = false;
        // Hacer snap al proyecto más cercano cuando termine el scroll
        snapToNearestProject();
    }, 150); // Esperar 150ms después de que termine el scroll
});

// Ejecutar una vez al cargar la página para establecer el color inicial
document.addEventListener('DOMContentLoaded', () => {
    updateBodyBackgroundColor();
});

// También ejecutar después de que se cargue completamente la página
window.addEventListener('load', () => {
    updateBodyBackgroundColor();
});