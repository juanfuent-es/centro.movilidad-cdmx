import Section from "./section.js";

// Inicializar cada sección del proyecto
// Cada sección maneja sus propios títulos, video y animaciones
const sections = document.querySelectorAll(".project");
const sectionInstances = [];

sections.forEach((section, index) => {
  const instance = new Section(section, index);
  sectionInstances.push(instance);
});