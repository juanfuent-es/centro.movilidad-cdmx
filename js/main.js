import FitText from "./FitText.js";
import AnimationController from "./AnimationController.js";
import MotionScroll from "./scroll.js";

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

const motionScroll = new MotionScroll();