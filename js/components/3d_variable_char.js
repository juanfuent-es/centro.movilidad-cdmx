// src/components/3d_variable_char.js

import SvgVariableCharacter from "./variable_char.js";
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import * as THREE from 'three';

/**
 * Clase que extiende SvgVariableCharacter para agregar funcionalidad 3D
 * Mantiene la lógica 3D separada pero organizada en una extensión
 */
export default class ThreeDSvgVariableCharacter extends SvgVariableCharacter {
    /**
     * Constructor de la clase 3DSvgVariableCharacter
     * @param {HTMLElement} container - Elemento contenedor donde se renderizará el carácter
     * @param {string} character - Carácter a renderizar
     * @param {Object} config - Configuración del carácter
     */
    constructor(container, character, config = {}) {
        // Llamar al constructor padre
        super(container, character, config);
        
        // Propiedades específicas para renderizado 3D
        this.threeMesh = null;
        this.threeGroup = null;
        this.materialParams = this.createMaterialParams();
        this.extrudeSettings = this.createExtrudeSettings();
        
        // Estado de actualización 3D
        this.lastVariations = { width: 0, weight: 0 };
        this.lastPosition = { x: 0, y: 0, z: 0 };
        this.lastScale = { x: 1, y: 1, z: 1 };
        this.updateThreshold = {
            width: 2,
            weight: 10,
            position: 1,
            scale: 0.01
        };
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
     * Crea la configuración de extrusión para la geometría 3D
     * @param {number} depth - Profundidad de extrusión
     * @returns {Object} Configuración de extrusión
     */
    createExtrudeSettings(depth = 8) {
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
     * Crea la geometría 3D extruida a partir del SVG actual
     * @param {Object} options - Opciones de configuración
     * @returns {THREE.Group} Grupo 3D con la geometría extruida
     */
    createExtrudedGeometry(options = {}) {
        if (!this.svgElement) {
            console.warn('3DSvgVariableCharacter: No hay SVG disponible para crear geometría 3D');
            return null;
        }

        // Configuración por defecto
        const config = {
            depth: options.depth || 8,
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
            
            // Aplicar posición inicial basada en el DOM
            this.update3DPositionFromDOM();
            
            return this.threeGroup;

        } catch (error) {
            console.error('3DSvgVariableCharacter: Error al crear geometría 3D:', error);
            return null;
        }
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
     * Actualiza la geometría 3D basándose en los cambios del DOM
     * Este método debe ser llamado desde VariableSvgTextRenderer después de actualizar las variaciones
     */
    update3DFromDOM() {
        if (!this.threeGroup) return;

        // Verificar si hay cambios en las variaciones
        const variationsChanged = this.checkVariationsChanged();
        
        // Verificar si hay cambios en la posición del DOM
        const positionChanged = this.checkPositionChanged();
        
        // Verificar si hay cambios en la escala del DOM
        const scaleChanged = this.checkScaleChanged();

        // Si hay cambios significativos, actualizar la geometría 3D
        if (variationsChanged) {
            this.update3DGeometryFromSVG();
        }

        if (positionChanged) {
            this.update3DPositionFromDOM();
        }

        if (scaleChanged) {
            this.update3DScaleFromDOM();
        }
    }

    /**
     * Verifica si las variaciones han cambiado significativamente
     * @returns {boolean} True si hay cambios significativos
     */
    checkVariationsChanged() {
        const widthChanged = Math.abs(this.variations.width - this.lastVariations.width) > this.updateThreshold.width;
        const weightChanged = Math.abs(this.variations.weight - this.lastVariations.weight) > this.updateThreshold.weight;
        
        if (widthChanged || weightChanged) {
            this.lastVariations = { 
                width: this.variations.width, 
                weight: this.variations.weight 
            };
            return true;
        }
        
        return false;
    }

    /**
     * Verifica si la posición del DOM ha cambiado significativamente
     * @returns {boolean} True si hay cambios significativos
     */
    checkPositionChanged() {
        if (!this.svgElement) return false;
        
        const rect = this.svgElement.getBoundingClientRect();
        const newPosition = {
            x: rect.left + rect.width / 2,
            y: -(rect.top + rect.height / 2), // Invertir Y para Three.js
            z: 0
        };
        
        const positionChanged = 
            Math.abs(newPosition.x - this.lastPosition.x) > this.updateThreshold.position ||
            Math.abs(newPosition.y - this.lastPosition.y) > this.updateThreshold.position;
        
        if (positionChanged) {
            this.lastPosition = newPosition;
            return true;
        }
        
        return false;
    }

    /**
     * Verifica si la escala del DOM ha cambiado significativamente
     * @returns {boolean} True si hay cambios significativos
     */
    checkScaleChanged() {
        if (!this.svgElement) return false;
        
        const rect = this.svgElement.getBoundingClientRect();
        const newScale = {
            x: rect.width / 100, // Factor de escala basado en el ancho
            y: rect.height / 100, // Factor de escala basado en el alto
            z: 1
        };
        
        const scaleChanged = 
            Math.abs(newScale.x - this.lastScale.x) > this.updateThreshold.scale ||
            Math.abs(newScale.y - this.lastScale.y) > this.updateThreshold.scale;
        
        if (scaleChanged) {
            this.lastScale = newScale;
            return true;
        }
        
        return false;
    }

    /**
     * Actualiza la posición 3D basándose en la posición del DOM
     */
    update3DPositionFromDOM() {
        if (!this.threeGroup || !this.svgElement) return;
        
        const rect = this.svgElement.getBoundingClientRect();
        const position = {
            x: rect.left + rect.width / 2,
            y: -(rect.top + rect.height / 2), // Invertir Y para Three.js
            z: 0
        };
        
        this.threeGroup.position.set(position.x, position.y, position.z);
        this.lastPosition = position;
    }

    /**
     * Actualiza la escala 3D basándose en la escala del DOM
     */
    update3DScaleFromDOM() {
        if (!this.threeGroup || !this.svgElement) return;
        
        const rect = this.svgElement.getBoundingClientRect();
        const scale = {
            x: rect.width / 100, // Factor de escala basado en el ancho
            y: rect.height / 100, // Factor de escala basado en el alto
            z: 1
        };
        
        this.threeGroup.scale.set(scale.x, scale.y, scale.z);
        this.lastScale = scale;
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
            
        } catch (error) {
            console.error('3DSvgVariableCharacter: Error al actualizar geometría 3D:', error);
        }
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
     * Configura los umbrales de actualización
     * @param {Object} thresholds - Nuevos umbrales {width, weight, position, scale}
     */
    setUpdateThresholds(thresholds) {
        this.updateThreshold = { ...this.updateThreshold, ...thresholds };
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
}
