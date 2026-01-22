import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/+esm'
import ScrollTrigger from 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/ScrollTrigger.min.js'
import FitText from './FitText.js'
import AnimationController from './AnimationController.js'

gsap.registerPlugin(ScrollTrigger)

/**
 * Section
 * Maneja cada sección del proyecto:
 * - Inicialización de títulos con FitText
 * - Control de autoplay/pausa de video según viewport
 * - Animaciones ScrollTrigger del video
 * - RAF solo cuando la sección está activa
 */
export default class Section {
  constructor(element, index = 0) {
    this.element = element
    this.index = index
    this.figure = element.querySelector('figure')
    this.img = element.querySelector('img')
    this.video = element.querySelector('video')
    this.fitTextInstances = []
    this.animationController = null
    this.scrollTriggerInstance = null
    this.isActive = false

    this.init()
  }

  init() {
    // Inicializar FitText para todos los títulos dentro de la sección
    this.initTitles()
    this.setupVideo()
    // Configurar ScrollTrigger para video y control de activación
    this.initScrollTrigger()
    // Configurar activación de sección (siempre, incluso sin video)
    this.setupSectionActivation()
  }

  setupVideo() {
    if (!this.video) {
      return
    }
    this.video.muted = true
    this.video.loop = true
    this.video.playsInline = true
  }

  /**
   * Inicializa FitText para todos los elementos .var-text dentro de la sección
   */
  initTitles() {
    const textNodes = this.element.querySelectorAll('.var-text')
    
    textNodes.forEach((node) => {
      const instance = new FitText(node)
      instance.fit()
      this.fitTextInstances.push(instance)
    })

    // Crear AnimationController solo para esta sección
    // Inicialmente deshabilitado, se activará cuando la sección esté en viewport
    this.animationController = new AnimationController({ enabled: false })
    this.fitTextInstances.forEach((ft) => {
      this.animationController.register(ft)
    })
  }

  /**
   * Inicializa ScrollTrigger para:
   * - Animaciones del video (scale, brightness, contrast, y)
   * - Control de activación de la sección (play/pause video, RAF)
   */
  initScrollTrigger() {
    if (!this.figure) {
      return
    }
    
    const getRatio = (el) => window.innerHeight / (window.innerHeight + el.offsetHeight)
    const maxOffset = window.innerHeight * 0.3

    let obj = {
      scale: 1,
      y: 0,
      contrast: 1,
      brightness: 1
    }

    // Configurar animación del video (sin callbacks de activación, ya se manejan en setupSectionActivation)
    const scrollTriggerConfig = {
      trigger: this.element,
      start: () => this.index ? 'top bottom' : 'top top',
      end: 'bottom center',
      scrub: true,
      onUpdate: () => {
        gsap.to(this.figure, {
          // filter: `contrast(${obj.contrast}) brightness(${obj.brightness})`,
          duration: 0.15,
          ease: 'none',
          y: obj.y,
          scaleX: obj.scale,
          scaleY: obj.scale
        })
      },
      invalidateOnRefresh: true
    }

    gsap.fromTo(obj, {
      y: () => this.index ? `${-maxOffset * getRatio(this.element)}px` : '0px',
      scale: () => this.index ? 2 : 1,
      // brightness: () => this.index ? 1 : 0.35,
      // contrast: () => this.index ? 1 : 2
    }, {
      y: () => `${maxOffset * (1 - getRatio(this.element))}px`,
      ease: 'none',
      duration: 0.35,
      // brightness: () => this.index ? 0.35 : 1,
      // contrast: () => this.index ? 2 : 1,
      scale: () => this.index ? 1 : 2,
      scrollTrigger: scrollTriggerConfig
    })
  }

  /**
   * Configura la activación de la sección
   * Controla el RAF para animaciones de títulos y play/pause de video
   * Se llama siempre, incluso si no hay video
   */
  setupSectionActivation() {
    // Si ya existe un ScrollTrigger de activación, no crear otro
    if (this.scrollTriggerInstance) {
      return
    }
    
    this.scrollTriggerInstance = ScrollTrigger.create({
      trigger: this.element,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => this.activate(),
      onLeave: () => this.deactivate(),
      onEnterBack: () => this.activate(),
      onLeaveBack: () => this.deactivate()
    })
    
    // Verificar si la sección ya está en el viewport al inicializar
    // Usar múltiples requestAnimationFrame para asegurar que ScrollTrigger esté completamente inicializado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Para la primera sección (index 0), siempre activar al cargar
        // ya que está en la parte superior de la página
        if (this.index === 0) {
          this.activate()
          return
        }
        
        // Para otras secciones, verificar si están visibles en el viewport
        const rect = this.element.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const viewportCenter = viewportHeight * 0.5
        const elementTop = rect.top
        const elementBottom = rect.bottom
        
        // Activar si el centro del viewport está dentro del elemento
        if (elementTop < viewportCenter && elementBottom > viewportCenter) {
          this.activate()
        }
      })
    })
  }

  /**
   * Activa la sección cuando entra al viewport
   * - Reproduce el video
   * - Inicia el RAF para animaciones de títulos
   */
  activate() {
    if (this.isActive) return
    
    this.isActive = true
    if (this.figure) {
      this.figure.classList.add('active')
    }
    // Reproducir video
    if (this.video) {
      this.video.play().catch(err => {
        console.warn('Error al reproducir video:', err)
      })
    }

    // Iniciar RAF para animaciones de títulos
    if (this.animationController) {
      this.animationController.start()
    }
  }

  /**
   * Desactiva la sección cuando sale del viewport
   * - Pausa el video
   * - Detiene el RAF para ahorrar recursos
   */
  deactivate() {
    if (!this.isActive) return
    
    this.isActive = false
    if (this.figure) {
      this.figure.classList.remove('active')
    }
    // Pausar video
    if (this.video) {
      this.video.pause()
    }

    // Detener RAF
    if (this.animationController) {
      this.animationController.stop()
    }
  }

  /**
   * Limpia recursos al destruir la sección
   */
  destroy() {
    this.deactivate()

    // Destruir instancias de FitText
    this.fitTextInstances.forEach((ft) => ft.destroy())
    this.fitTextInstances = []

    // Destruir AnimationController
    if (this.animationController) {
      this.animationController.stop()
      this.animationController = null
    }

    // Matar todos los ScrollTriggers asociados a este elemento
    const triggers = ScrollTrigger.getAll()
    triggers.forEach(trigger => {
      if (trigger.trigger === this.element) {
        trigger.kill()
      }
    })
    this.scrollTriggerInstance = null
  }
}
