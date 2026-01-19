import FitText from './FitText.js';

const htmlElements = document.querySelectorAll('.ruta-variable');
let fitTextElements = [];

htmlElements.forEach((item, idx) => {
    const fitText = new FitText(item);
    fitText.fit();
    fitTextElements.push(fitText)
})

// Manejar redimensionamiento de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        fitTextElements.forEach(fitText =>  fitText.fit());
    }, 100);
});