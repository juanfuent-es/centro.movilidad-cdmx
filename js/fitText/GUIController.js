/**
 * GUIController - Integración con lil.gui para controlar ejes slant y roundness
 * Responsabilidad: Crear y gestionar controles GUI para ejes que el usuario puede ajustar
 */

export class GUIController {
  constructor(guiInstance, options = {}) {
    if (!guiInstance) {
      console.warn('GUIController: se requiere una instancia de lil.GUI');
      return;
    }

    this.gui = guiInstance;
    this.fitTextInstance = options.fitTextInstance || null;
    this.onUpdateCallback = options.onUpdate || null;

    // Valores iniciales
    this.values = {
      slnt: options.initialSlant ?? -5,
      ROND: options.initialRoundness ?? 0
    };

    // Rangos de ejes
    this.ranges = {
      slnt: { min: -10, max: 0 },
      ROND: { min: 0, max: 100 }
    };

    // Crear controles GUI
    this.createControls();
  }

  /**
   * Crea los controles GUI para slant y roundness
   */
  createControls() {
    // Folder para controles de FitText
    const folder = this.gui.addFolder('FitText Variables');
    folder.open();

    // Control de Slant (Inclinación)
    const slntController = folder
      .add(this.values, 'slnt', this.ranges.slnt.min, this.ranges.slnt.max, 0.1)
      .name('Slant (Inclinación)')
      .onChange(value => {
        this.values.slnt = value;
        this.handleChange();
      });

    // Control de Roundness (Redondez)
    const rondController = folder
      .add(this.values, 'ROND', this.ranges.ROND.min, this.ranges.ROND.max, 1)
      .name('Roundness (Redondez)')
      .onChange(value => {
        this.values.ROND = value;
        this.handleChange();
      });

    this.controllers = {
      slnt: slntController,
      ROND: rondController
    };
  }

  /**
   * Maneja cambios en los controles GUI
   */
  handleChange() {
    if (this.fitTextInstance) {
      this.fitTextInstance.update({
        slnt: this.values.slnt,
        ROND: this.values.ROND
      });
    }

    if (this.onUpdateCallback) {
      this.onUpdateCallback({
        slnt: this.values.slnt,
        ROND: this.values.ROND
      });
    }
  }

  /**
   * Establece la instancia de FitText para actualización automática
   * @param {FitText} fitTextInstance - Instancia de FitText
   */
  setFitTextInstance(fitTextInstance) {
    this.fitTextInstance = fitTextInstance;
  }

  /**
   * Establece callback personalizado para cambios
   * @param {Function} callback - Función callback
   */
  setOnUpdate(callback) {
    this.onUpdateCallback = callback;
  }

  /**
   * Obtiene los valores actuales
   * @returns {Object} Valores actuales { slnt, ROND }
   */
  getValues() {
    return { ...this.values };
  }

  /**
   * Establece valores programáticamente
   * @param {Object} values - Nuevos valores { slnt, ROND }
   */
  setValues(values) {
    if (typeof values.slnt === 'number') {
      this.values.slnt = this.clamp(values.slnt, this.ranges.slnt.min, this.ranges.slnt.max);
      if (this.controllers.slnt) {
        this.controllers.slnt.setValue(this.values.slnt);
      }
    }

    if (typeof values.ROND === 'number') {
      this.values.ROND = this.clamp(values.ROND, this.ranges.ROND.min, this.ranges.ROND.max);
      if (this.controllers.ROND) {
        this.controllers.ROND.setValue(this.values.ROND);
      }
    }

    this.handleChange();
  }

  /**
   * Limita un valor entre min y max
   * @param {number} value - Valor a limitar
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @returns {number} Valor limitado
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Destruye los controles GUI
   */
  destroy() {
    if (this.controllers) {
      Object.values(this.controllers).forEach(controller => {
        if (controller && controller.destroy) {
          controller.destroy();
        }
      });
    }
    this.fitTextInstance = null;
    this.onUpdateCallback = null;
  }
}

