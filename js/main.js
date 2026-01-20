import FitText from "./FitText.js";
import AnimationController from "./AnimationController.js";
import ProjectVideoController from "./ProjectVideoController.js";

// Inicializar FitText en todos los elementos con clase .var-text
const textNodes = document.querySelectorAll(".var-text");
const fitTextInstances = [];

textNodes.forEach((node) => {
  const instance = new FitText(node);
  instance.fit();
  fitTextInstances.push(instance);
});

// Un solo RAF para todas las instancias: llama fitText.update({ pointer }) en cascada
const animationController = new AnimationController();
fitTextInstances.forEach((ft) => animationController.register(ft));

// Control de reproducción de videos por visibilidad y hover
const projectVideoController = new ProjectVideoController({
  selector: ".project",
  threshold: 0.5,
  volumeDuration: 0.22,
  volumeMax: 1,
});

// Opcional: expone para debug en consola
window.projectVideoController = projectVideoController;
