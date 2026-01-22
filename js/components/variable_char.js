// src/components/variable_char.js

// Imports para funcionalidad 3D
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';

// Función de utilidad para calcular distancia euclidiana entre dos puntos
Math.dist = function(pointA, pointB) {
    const deltaX = pointB.x - pointA.x;
    const deltaY = pointB.y - pointA.y;
    return Math.hypot(deltaX, deltaY);
};

/**
 * Clase para renderizar un carácter individual como SVG con variaciones dinámicas
 * Permite cambiar el peso y ancho del carácter basado en la distancia al cursor
 * Incluye funcionalidad para renderizar como geometría extruida 3D
 */
export default class SvgVariableCharacter {
    /**
     * Constructor de la clase SvgVariableCharacter
     * @param {HTMLElement} container - Elemento contenedor donde se renderizará el carácter
     * @param {string} character - Carácter a renderizar
     * @param {Object} config - Configuración del carácter
     */
    constructor(container, character, config = {}) {
        this.character = character;
        this.container = container;
        this.config = config;
        
        this.variations = {
            weight: 400,
            width: 100
        };
        
        this.svgElement = null;
        this.font = null;
        
        // Propiedades para renderizado 3D
        this.threeMesh = null;
        this.threeGroup = null;
        this.materialParams = this.createMaterialParams();
        this.extrudeSettings = this.createExtrudeSettings();
        
        this.createElement();
    }
    
    /**
     * Crea los parámetros del material para el renderizado 3D
     * @returns {Object} Parámetros del material
     */
    createMaterialParams() {
        return {
            color: 0xffd6,
            metalness: 0,
            roughness: 0,
            clearcoat: 1,
            clearcoatRoughness: 0,
            transmission: 0.2,
            ior: 2.3,
            thickness: 10,
            reflectivity: 1,
            wireframe: false,
            envMapIntensity: 1
        };
    }
    
    /**
     * Crea el elemento span que contendrá el carácter
     * Configura los estilos básicos del elemento
     */
    createElement() {
        this.element = document.createElement("span");
        this.element.innerText = this.character;
        // Aplicar la misma fuente que el contenedor padre
        this.element.style.fontFamily = "Hubot Sans, serif";
        this.element.style.fontSize = "inherit";
        this.element.style.lineHeight = "inherit";
        this.element.style.fontWeight = "inherit";
        this.container.appendChild(this.element);
    }
    
    /**
     * Asigna la fuente variable al carácter
     * @param {VariableFont} font - Instancia de la fuente variable
     */
    setFont(font) {
        this.font = font;
    }
    
    /**
     * Obtiene el tamaño de fuente dinámicamente del elemento
     * @returns {number} Tamaño de fuente en píxeles
     */
    getFontSize() {
        const computedStyle = window.getComputedStyle(this.element);
        return parseFloat(computedStyle.fontSize);
    }
    
    /**
     * Calcula la distancia desde el centro del carácter hasta la posición del mouse
     * @param {Object} mousePosition - Posición del mouse {x, y}
     * @returns {number} Distancia en píxeles
     */
    calculateDistanceToMouse(mousePosition) {
        this.boundingRect = this.element.getBoundingClientRect();
        const characterCenter = {
            x: this.boundingRect.x + (this.boundingRect.width / 1.75),
            y: this.boundingRect.y
        };
        return Math.dist(mousePosition, characterCenter);
    }
    
    /**
     * Calcula el valor de variación basado en la distancia al mouse
     * @param {number} distance - Distancia al mouse
     * @param {number} minValue - Valor mínimo de la variación
     * @param {number} maxValue - Valor máximo de la variación
     * @param {number} maxDistance - Distancia máxima para el cálculo
     * @returns {number} Valor de variación calculado
     */
    calculateVariationValue(distance, minValue, maxValue, maxDistance) {
        const variationRange = maxValue - Math.abs((maxValue * distance / maxDistance));
        return Math.max(minValue, variationRange + minValue);
    }
    
    /**
     * Actualiza las variaciones del carácter basado en la posición del mouse
     * @param {Object} variationSettings - Configuración de variaciones {wght, wdth}
     * @param {Object} mousePosition - Posición del mouse {x, y}
     * @param {number} maxDistance - Distancia máxima para el cálculo
     */
    updateVariations(variationSettings, mousePosition, maxDistance) {
        const distanceToMouse = this.calculateDistanceToMouse(mousePosition);
        
        this.variations.width = variationSettings.wdth 
            ? ~~this.calculateVariationValue(distanceToMouse, 75, 125, maxDistance) 
            : 100;
            
        this.variations.weight = variationSettings.wght 
            ? ~~this.calculateVariationValue(distanceToMouse, 200, 900, maxDistance) 
            : 400;
            
        this.applyVariations();
        this.updateSVG();
    }
    
    /**
     * Aplica las variaciones al elemento usando CSS font-variation-settings
     */
    applyVariations() {
        const variationStyle = `font-variation-settings: 'wght' ${this.variations.weight}, 'wdth' ${this.variations.width};`;
        this.element.style = variationStyle;
    }
    
    /**
     * Actualiza el SVG del carácter con las nuevas variaciones
     */
    updateSVG() {
        if (!this.font) return;
        
        const svg = this.createSVG();
        this.renderSVG(svg);
    }
    
    /**
     * Crea el SVG del carácter con las variaciones actuales
     * @returns {SVGElement|null} Elemento SVG creado o null si no hay fuente
     */
    createSVG() {
        if (!this.font) return null;
        
        const variation = { 
            wght: this.variations.weight, 
            wdth: this.variations.width 
        };
        
        const glyphData = this.font.glyphVariation(this.character, variation);
        return this.createSVGFromGlyphData(glyphData);
    }
    
    /**
     * Crea el SVG a partir de los datos del glifo
     * @param {Object} glyphData - Datos del glifo con path y dimensiones
     * @returns {SVGElement} Elemento SVG creado
     */
    createSVGFromGlyphData(glyphData) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        
        // Obtener las dimensiones del contenedor del span
        const spanRect = this.element.getBoundingClientRect();
        const containerWidth = spanRect.width;
        const containerHeight = spanRect.height;
        
        // Calcular dimensiones reales del glifo usando advanceWidth y advanceHeight
        const fontSize = this.getFontSize();
        const scale = fontSize / 1024; // Factor de escala correcto
        
        // Configurar el SVG con las dimensiones del contenedor
        svg.setAttribute('width', `${containerWidth}px`);
        svg.setAttribute('height', `${containerHeight}px`);
        svg.setAttribute('viewBox', `0 0 ${containerWidth} ${containerHeight}`);
        
        // Crear el path del glifo
        if (glyphData.path && glyphData.path.commands && glyphData.path.commands.length > 0) {
            const pathElement = document.createElementNS(svgNS, 'path');
            const pathData = this.convertCommandsToPathData(glyphData.path.commands, containerWidth, containerHeight);
            pathElement.setAttribute('d', pathData);
            svg.appendChild(pathElement);
        }
        
        return svg;
    }
    
    /**
     * Convierte los comandos del glifo a datos de path SVG
     * @param {Array} commands - Array de comandos del glifo
     * @param {number} containerWidth - Ancho del contenedor
     * @param {number} containerHeight - Alto del contenedor
     * @returns {string} Datos del path SVG
     */
    convertCommandsToPathData(commands, containerWidth, containerHeight) {
        // Calcular el escalado basado en el tamaño real del glifo vs el contenedor
        const fontSize = this.getFontSize();
        const finalScale = fontSize / 1024; // Factor de escala basado en el tamaño de fuente real
        
        // Calcular offset para centrar el glifo en el contenedor
        const offsetX = 0;
        const offsetY = containerHeight * .975; // 97.5% desde arriba para centrar verticalmente
        
        // Usar la misma lógica de escalado que la clase Glyph
        const glyphCommands = commands.map(command => {
            if (command.command && command.args) {
                const scaledArgs = command.args.map((arg, index) => {
                    // Usar la misma lógica de escalado que Glyph.scaleCommandArgs
                    const axisScale = index % 2 ? -finalScale : finalScale;
                    const scaledArg = arg * axisScale;
                    
                    // Aplicar offset y orientación correcta
                    if (index % 2 === 1) {
                        return scaledArg + offsetY; // Y ya está invertido por axisScale negativo
                    }
                    return scaledArg + offsetX; // Aplicar offset X
                });
                
                return {
                    command: command.command,
                    args: scaledArgs
                };
            } else if (command.type) {
                return this.convertLegacyCommand(command, finalScale, offsetX, offsetY);
            }
            return null;
        }).filter(cmd => cmd !== null);
        
        return glyphCommands.map(cmd => this.commandToSVG(cmd)).join(' ');
    }
    
    /**
     * Convierte comandos legacy a formato moderno
     * @param {Object} command - Comando legacy con type y coordenadas
     * @param {number} finalScale - Factor de escala final
     * @param {number} offsetX - Offset en X
     * @param {number} offsetY - Offset en Y
     * @returns {Object|null} Comando convertido o null si no es válido
     */
    convertLegacyCommand(command, finalScale, offsetX, offsetY) {
        switch (command.type) {
            case 'M': // Move to
                return {
                    command: 'moveTo',
                    args: [
                        (command.x * finalScale) + offsetX, 
                        (-command.y * finalScale) + offsetY // Y ya está invertido por el signo negativo
                    ]
                };
            case 'L': // Line to
                return {
                    command: 'lineTo',
                    args: [
                        (command.x * finalScale) + offsetX, 
                        (-command.y * finalScale) + offsetY // Y ya está invertido por el signo negativo
                    ]
                };
            case 'Q': // Quadratic curve
                return {
                    command: 'quadraticCurveTo',
                    args: [
                        (command.cpX * finalScale) + offsetX, 
                        (-command.cpY * finalScale) + offsetY, // Y ya está invertido por el signo negativo
                        (command.x * finalScale) + offsetX, 
                        (-command.y * finalScale) + offsetY // Y ya está invertido por el signo negativo
                    ]
                };
            case 'C': // Cubic curve
                return {
                    command: 'bezierCurveTo',
                    args: [
                        (command.cp1X * finalScale) + offsetX, 
                        (-command.cp1Y * finalScale) + offsetY, // Y ya está invertido por el signo negativo
                        (command.cp2X * finalScale) + offsetX, 
                        (-command.cp2Y * finalScale) + offsetY, // Y ya está invertido por el signo negativo
                        (command.x * finalScale) + offsetX, 
                        (-command.y * finalScale) + offsetY // Y ya está invertido por el signo negativo
                    ]
                };
            case 'Z': // Close path
                return {
                    command: 'closePath',
                    args: []
                };
            default:
                return null;
        }
    }
    
    /**
     * Convierte un comando a formato SVG string
     * @param {Object} cmd - Comando con command y args
     * @returns {string} Comando SVG como string
     */
    commandToSVG(cmd) {
        switch (cmd.command) {
            case 'moveTo': 
                return `M${cmd.args.join(' ')}`;
            case 'lineTo': 
                return `L${cmd.args.join(' ')}`;
            case 'bezierCurveTo': 
                return `C${cmd.args.join(' ')}`;
            case 'quadraticCurveTo': 
                return `Q${cmd.args.join(' ')}`;
            case 'closePath': 
                return 'Z';
            default: 
                return '';
        }
    }
    
    /**
     * Renderiza el SVG en el elemento
     * @param {SVGElement} svg - Elemento SVG a renderizar
     */
    renderSVG(svg) {
        if (!svg) return;
        
        // Configurar estilos del SVG para escalado automático
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';
        
        // Escalar automáticamente al 100% del contenedor
        svg.style.width = '100%';
        svg.style.height = '100%';
        
        // Buscar si ya existe un SVG en el contenedor
        const existingSvg = this.element.querySelector('svg');
        if (existingSvg) {
            // Reemplazar el SVG existente
            this.element.replaceChild(svg, existingSvg);
        } else {
            // Agregar el SVG sin eliminar el texto original
            this.element.appendChild(svg);
        }
        
        this.svgElement = svg;
    }
    
    /**
     * Obtiene el elemento SVG para acceso externo
     * @returns {SVGElement|null} Elemento SVG o null si no existe
     */
    getSVGElement() {
        return this.svgElement;
    }
    
    /**
     * Obtiene las variaciones actuales para acceso externo
     * @returns {Object} Objeto con weight y width
     */
    getVariations() {
        return this.variations;
    }
    
    /**
     * Obtiene el carácter para acceso externo
     * @returns {string} Carácter actual
     */
    getCharacter() {
        return this.character;
    }

    /**
     * Crea la geometría 3D extruida a partir del SVG actual
     * @param {Object} options - Opciones de configuración
     * @param {number} options.depth - Profundidad de extrusión
     * @param {Object} options.material - Parámetros del material
     * @returns {THREE.Group} Grupo 3D con la geometría extruida
     */
    createExtrudedGeometry(options = {}) {
        if (!this.svgElement) {
            console.warn('SvgVariableCharacter: No hay SVG disponible para crear geometría 3D');
            return null;
        }

        // Configuración por defecto
        const config = {
            depth: options.depth || 5,
            material: options.material || this.materialParams
        };

        // Crear grupo para organizar los objetos 3D
        this.threeGroup = new THREE.Group();

        try {
            // Parsear el SVG usando SVGLoader
            const loader = new SVGLoader();
            const svgData = loader.parse(this.svgElement.outerHTML);

            // Procesar cada path del SVG
            svgData.paths.forEach(path => {
                const material = this.createThreeMaterial(config.material);
                const shapes = SVGLoader.createShapes(path);
                
                shapes.forEach(shape => {
                    const extrudeSettings = this.createExtrudeSettings(config.depth);
                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    const mesh = new THREE.Mesh(geometry, material);
                    
                    this.threeGroup.add(mesh);
                    this.threeMesh = mesh; // Guardar referencia al mesh principal
                });
            });

            // Centrar y rotar la geometría
            this.centerAndRotateGeometry();
            
            return this.threeGroup;

        } catch (error) {
            console.error('SvgVariableCharacter: Error al crear geometría 3D:', error);
            return null;
        }
    }

    /**
     * Crea la configuración de extrusión para la geometría 3D
     * @param {number} depth - Profundidad de extrusión
     * @returns {Object} Configuración de extrusión
     */
    createExtrudeSettings(depth = 5) {
        return {
            depth: depth,
            bevelEnabled: true,
            bevelSegments: 1,
            steps: 1,
            bevelSize: 0.1,
            bevelThickness: 0.1
        };
    }

    /**
     * Crea un material 3D para el renderizado
     * @param {Object} params - Parámetros del material
     * @returns {THREE.Material} Material 3D
     */
    createThreeMaterial(params) {
        return new THREE.MeshPhysicalMaterial({
            color: params.color,
            metalness: params.metalness,
            roughness: params.roughness,
            clearcoat: params.clearcoat,
            clearcoatRoughness: params.clearcoatRoughness,
            transmission: params.transmission,
            ior: params.ior,
            thickness: params.thickness,
            reflectivity: params.reflectivity,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: params.wireframe,
            envMapIntensity: params.envMapIntensity
        });
    }

    /**
     * Centra y rota la geometría 3D para que se vea correctamente
     */
    centerAndRotateGeometry() {
        if (!this.threeGroup) return;

        // Centrar la geometría
        this.centerGeometry();
        
        // Rotar la geometría
        this.rotateGeometry();
        
        // Recentrar después de la rotación
        this.recenterAfterRotation();
    }

    /**
     * Centra la geometría en el origen
     */
    centerGeometry() {
        const box = new THREE.Box3().setFromObject(this.threeGroup);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        this.threeGroup.position.x = -center.x;
        this.threeGroup.position.y = -center.y;
        this.threeGroup.position.z = -center.z;
    }

    /**
     * Rota la geometría para orientación correcta
     */
    rotateGeometry() {
        this.threeGroup.rotation.x = Math.PI;
    }

    /**
     * Recentra la geometría después de la rotación
     */
    recenterAfterRotation() {
        const boxAfterRotation = new THREE.Box3().setFromObject(this.threeGroup);
        const centerAfterRotation = new THREE.Vector3();
        boxAfterRotation.getCenter(centerAfterRotation);
        
        this.threeGroup.position.x -= centerAfterRotation.x;
        this.threeGroup.position.y -= centerAfterRotation.y;
        this.threeGroup.position.z -= centerAfterRotation.z;
    }

    /**
     * Actualiza la geometría 3D con nuevas variaciones
     * @param {Object} variationSettings - Configuración de variaciones
     * @param {Object} mousePosition - Posición del mouse
     * @param {number} maxDistance - Distancia máxima
     */
    updateExtrudedGeometry(variationSettings, mousePosition, maxDistance) {
        // Primero actualizar las variaciones del SVG
        this.updateVariations(variationSettings, mousePosition, maxDistance);
        
        // Luego recrear la geometría 3D si existe
        if (this.threeGroup) {
            // Remover geometría anterior
            this.removeExtrudedGeometry();
            
            // Crear nueva geometría con las variaciones actualizadas
            this.createExtrudedGeometry();
        }
    }

    /**
     * Actualiza la geometría 3D en tiempo real sin recrear completamente
     * @param {Object} variationSettings - Configuración de variaciones
     * @param {Object} mousePosition - Posición del mouse
     * @param {number} maxDistance - Distancia máxima
     * @param {Object} options - Opciones de actualización
     */
    updateExtrudedGeometryRealtime(variationSettings, mousePosition, maxDistance, options = {}) {
        // Calcular nuevas variaciones
        const distanceToMouse = this.calculateDistanceToMouse(mousePosition);
        
        const newWidth = variationSettings.wdth 
            ? ~~this.calculateVariationValue(distanceToMouse, 75, 125, maxDistance) 
            : 100;
            
        const newWeight = variationSettings.wght 
            ? ~~this.calculateVariationValue(distanceToMouse, 200, 900, maxDistance) 
            : 400;
        
        // Verificar si hay cambios significativos
        const widthChanged = Math.abs(this.variations.width - newWidth) > 2;
        const weightChanged = Math.abs(this.variations.weight - newWeight) > 10;
        
        if (widthChanged || weightChanged) {
            // Actualizar variaciones
            this.variations.width = newWidth;
            this.variations.weight = newWeight;
            
            // Aplicar variaciones al SVG
            this.applyVariations();
            this.updateSVG();
            
            // Actualizar geometría 3D si existe
            if (this.threeGroup) {
                this.update3DGeometryFromSVG(options);
            }
        }
    }

    /**
     * Actualiza la geometría 3D basándose en el SVG actual
     * @param {Object} options - Opciones de configuración
     */
    update3DGeometryFromSVG(options = {}) {
        if (!this.svgElement || !this.threeGroup) return;
        
        try {
            // Remover geometría anterior del grupo
            while (this.threeGroup.children.length > 0) {
                const child = this.threeGroup.children[0];
                this.threeGroup.remove(child);
                
                // Dispose de la geometría y material
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    child.material.dispose();
                }
            }
            
            // Configuración por defecto
            const config = {
                depth: options.depth || 8,
                material: options.material || this.materialParams
            };
            
            // Parsear el SVG usando SVGLoader
            const loader = new THREE.SVGLoader();
            const svgData = loader.parse(this.svgElement.outerHTML);
            
            // Procesar cada path del SVG
            svgData.paths.forEach(path => {
                const material = this.createThreeMaterial(config.material);
                const shapes = THREE.SVGLoader.createShapes(path);
                
                shapes.forEach(shape => {
                    const extrudeSettings = this.createExtrudeSettings(config.depth);
                    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
                    const mesh = new THREE.Mesh(geometry, material);
                    
                    this.threeGroup.add(mesh);
                    this.threeMesh = mesh; // Guardar referencia al mesh principal
                });
            });
            
            // Centrar y rotar la geometría
            this.centerAndRotateGeometry();
            
        } catch (error) {
            console.error('SvgVariableCharacter: Error al actualizar geometría 3D:', error);
        }
    }

    /**
     * Verifica si la geometría 3D necesita actualización
     * @param {Object} variationSettings - Configuración de variaciones
     * @param {Object} mousePosition - Posición del mouse
     * @param {number} maxDistance - Distancia máxima
     * @returns {boolean} True si necesita actualización
     */
    needs3DUpdate(variationSettings, mousePosition, maxDistance) {
        const distanceToMouse = this.calculateDistanceToMouse(mousePosition);
        
        const newWidth = variationSettings.wdth 
            ? ~~this.calculateVariationValue(distanceToMouse, 75, 125, maxDistance) 
            : 100;
            
        const newWeight = variationSettings.wght 
            ? ~~this.calculateVariationValue(distanceToMouse, 200, 900, maxDistance) 
            : 400;
        
        return Math.abs(this.variations.width - newWidth) > 2 || 
               Math.abs(this.variations.weight - newWeight) > 10;
    }

    /**
     * Remueve la geometría 3D de la escena
     */
    removeExtrudedGeometry() {
        if (this.threeGroup) {
            // Remover todos los meshes del grupo
            while (this.threeGroup.children.length > 0) {
                const child = this.threeGroup.children[0];
                this.threeGroup.remove(child);
                
                // Dispose de la geometría y material
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    child.material.dispose();
                }
            }
            
            this.threeGroup = null;
            this.threeMesh = null;
        }
    }

    /**
     * Obtiene el grupo 3D para acceso externo
     * @returns {THREE.Group|null} Grupo 3D o null si no existe
     */
    getThreeGroup() {
        return this.threeGroup;
    }

    /**
     * Configura los parámetros del material 3D
     * @param {Object} params - Nuevos parámetros del material
     */
    setMaterialParams(params) {
        this.materialParams = { ...this.materialParams, ...params };
        
        // Actualizar material existente si hay mesh
        if (this.threeMesh && this.threeMesh.material) {
            Object.assign(this.threeMesh.material, this.materialParams);
            this.threeMesh.material.needsUpdate = true;
        }
    }

    /**
     * Configura los parámetros de extrusión
     * @param {Object} settings - Nuevos parámetros de extrusión
     */
    setExtrudeSettings(settings) {
        this.extrudeSettings = { ...this.extrudeSettings, ...settings };
    }

    /**
     * Añade la geometría 3D a una escena de THREE.js
     * @param {THREE.Scene} scene - Escena de THREE.js
     */
    addToScene(scene) {
        if (this.threeGroup && scene) {
            scene.add(this.threeGroup);
        }
    }

    /**
     * Remueve la geometría 3D de una escena de THREE.js
     * @param {THREE.Scene} scene - Escena de THREE.js
     */
    removeFromScene(scene) {
        if (this.threeGroup && scene) {
            scene.remove(this.threeGroup);
        }
    }

    /**
     * Actualiza la posición de la geometría 3D
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} z - Posición Z
     */
    setPosition(x, y, z) {
        if (this.threeGroup) {
            this.threeGroup.position.set(x, y, z);
        }
    }

    /**
     * Actualiza la rotación de la geometría 3D
     * @param {number} x - Rotación X
     * @param {number} y - Rotación Y
     * @param {number} z - Rotación Z
     */
    setRotation(x, y, z) {
        if (this.threeGroup) {
            this.threeGroup.rotation.set(x, y, z);
        }
    }

    /**
     * Actualiza la escala de la geometría 3D
     * @param {number} x - Escala X
     * @param {number} y - Escala Y
     * @param {number} z - Escala Z
     */
    setScale(x, y, z) {
        if (this.threeGroup) {
            this.threeGroup.scale.set(x, y, z);
        }
    }
}