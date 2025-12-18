const lenis = new Lenis({
    lerp: 0.1,
    autoRaf: true,
});

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

// Agregar listener de scroll para actualizar el color de fondo usando Lenis
lenis.on('scroll', () => {
    updateBodyBackgroundColor();
});

// Ejecutar una vez al cargar la página para establecer el color inicial
document.addEventListener('DOMContentLoaded', () => {
    updateBodyBackgroundColor();
});
