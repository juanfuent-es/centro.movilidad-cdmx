import Section from "./section.js";
import ScrollTrigger from 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/ScrollTrigger.min.js'

// Inicializar cada sección del proyecto
// Cada sección maneja sus propios títulos, video y animaciones
const sections = document.querySelectorAll(".project");
const sectionInstances = [];

sections.forEach((section, index) => {
  const instance = new Section(section, index);
  sectionInstances.push(instance);
});

// Refrescar ScrollTrigger después de inicializar todas las secciones
// Esto asegura que los triggers se evalúen correctamente y las secciones visibles se activen
// Usar múltiples requestAnimationFrame para asegurar que todo esté completamente inicializado
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh()
  })
});