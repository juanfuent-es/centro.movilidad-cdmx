import gsap from 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/+esm'
import ScrollTrigger from 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/ScrollTrigger.min.js'
import { Back } from 'https://cdn.jsdelivr.net/npm/gsap@3.14.2/all.min.js'

gsap.registerPlugin(ScrollTrigger)

export default class MotionScroll {
    constructor() {
        this.scrollTrigger()
    }

    //
    // Animaciones con ScrollTrigger usando el scroll nativo
    //

    scrollTrigger() {
        const getRatio = (el) => window.innerHeight / (window.innerHeight + el.offsetHeight)
        const sections = document.querySelectorAll(".project")
        sections.forEach((section, i) => {
            const img = section.querySelector("video")
            let obj = {
                scale: 1,
                y: 0,
                contrast: 1,
                brightness: 1
            }
            let maxOffset = window.innerHeight * .3
            gsap.fromTo(obj, {
                y: () => i ? `${-maxOffset * getRatio(section)}px` : "0px",
                scale: () => i ? 2 : 1,
                brightness: () => i ? 1 : .35,
                contrast: () => i ? 1 : 2
            }, {
                y: () => `${maxOffset * (1 - getRatio(section))}px`,
                ease: "none",
                duration: .35,
                brightness: () => i ? .35 : 1,
                contrast: () => i ? 2 : 1,
                scale: () => i ? 1 : 2,
                scrollTrigger: {
                    trigger: section,
                    start: () => i ? "top bottom" : "top top",
                    end: "bottom center",
                    scrub: true,
                    onUpdate: () => {
                        gsap.to(img, {
                            filter: `contrast(${obj.contrast}) brightness(${obj.brightness})`,
                            duration: .15,
                            ease: "none",
                            y: obj.y,
                            scaleX: obj.scale,
                            scaleY: obj.scale
                        })
                    },
                    invalidateOnRefresh: true
                }
            })
        })
    }

    //
    destroy() {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
}
