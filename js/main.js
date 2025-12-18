import { Header } from './header.js';
import Ruta from './rutas/ruta.js';
// Inicializar instancia de Header
// const headerInstance = new Header();
// Almacenar instancias de Ruta para poder ajustarlas en resize
const rutaInstances = [];
/**
 * Función para ajustar el texto tipográfico de todas las instancias de Ruta
 * Mantiene el core del código exclusivo para el ajuste tipográfico
 */
function adjustTypographyOnResize() {
    rutaInstances.forEach(instance => {
        if (instance && typeof instance.fitTextToContainer === 'function') {
            instance.fitTextToContainer();
        }
    });
}

const title = document.querySelector('.ruta-variable');
let rutaInstance;
// También ejecutar después de que se cargue completamente la página
window.addEventListener('load', () => {
    // updateBodyBackgroundColor();
    rutaInstance = new Ruta(title);
    console.log("rutaInstance", rutaInstance)
    /* 
    const titles = document.querySelectorAll('.title-container');
    titles.forEach(title => {
        const h2 = title.querySelector('h2');
        if (h2) {
            const rutaInstance = new Ruta(h2);
            rutaInstances.push(rutaInstance);
        }
    }); */
});

// Ajustar texto cuando se redimensiona la ventana usando debounce de lodash
// lodash está disponible globalmente desde el CDN
// const debouncedAdjustTypography = _.debounce(adjustTypographyOnResize, 100);
window.addEventListener('resize', adjustTypographyOnResize);