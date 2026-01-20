import FitText from "./FitText.js";

const htmlElements = document.querySelectorAll(".ruta-variable");
let fitTextElements = [];

htmlElements.forEach((item, idx) => {
  const fitText = new FitText(item);
  fitText.fit();
  fitTextElements.push(fitText);
});
