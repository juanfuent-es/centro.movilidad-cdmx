/*
* GlyphMorph - Morphing between glyph variations
* Author: JuanFuent.es
*/
import Glyph from './glyph'

export default class GlyphMorph {
    constructor(glyphName, font) {
        this.initializeProperties(glyphName, font);
        this.createGlyphVariations();
    }

    initializeProperties(glyphName, font) {
        this.glyphName = glyphName;
        this.font = font;
        this.axes = this.font.axes;
        this.fontSize = 100;
    }

    createGlyphVariations() {
        this.minGlyph = this.createGlyph(this.getMinVariation());
        this.maxGlyph = this.createGlyph(this.getMaxVariation());
    }

    getMinVariation() {
        return this.createVariationObject('min');
    }

    getMaxVariation() {
        return this.createVariationObject('max');
    }

    createVariationObject(property) {
        const variation = {};
        for (const axis in this.axes) {
            variation[axis] = this.axes[axis][property];
        }
        return variation;
    }

    getInterpolatedVariation(t) {
        const min = this.getMinVariation();
        const max = this.getMaxVariation();
        return this.interpolateVariations(min, max, t);
    }

    interpolateVariations(min, max, t) {
        const interp = {};
        for (const axis in min) {
            interp[axis] = min[axis] + (max[axis] - min[axis]) * t;
        }
        return interp;
    }

    getInterpolatedGlyph(t) {
        const variation = this.getInterpolatedVariation(t);
        return this.font.glyphVariation(this.glyphName, variation);
    }

    createGlyph(variation) {
        const glyph = this.font.glyphVariation(this.glyphName, variation);
        return this.createGlyphObject(glyph);
    }

    createGlyphObject(glyph) {
        return new Glyph(glyph.name, {
            fontSize: this.fontSize,
            commands: glyph.path.commands,
            width: glyph.advanceWidth,
            height: glyph.advanceHeight,
            lineHeight: .75
        });
    }

    createInterpolatedGlyph(t) {
        const glyph = this.getInterpolatedGlyph(t);
        return this.createGlyphObject(glyph);
    }

    getInterpolatedSVGPathData(t) {
        const glyph = this.createInterpolatedGlyph(t);
        return glyph.svgPathData;
    }

    createSVG() {
        return this.createSVGElement(this.maxGlyph.width, this.maxGlyph.lineHeight);
    }

    createSVGElement(width, height) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        return svg;
    }
    
    createSVGPath(svgPathData, fill = "#FFF") {
        const svgNS = 'http://www.w3.org/2000/svg';
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', svgPathData);
        path.setAttribute('fill', fill);
        path.setAttribute('transform', `translate(0, ${this.maxGlyph.lineHeight})`);
        return path;
    }

    createInterpolatedSVG(t, options = {}) {
        const svg = this.createSVGElement(
            options.width || 10,
            options.height || 7.5
        );
        this.addPathToSVG(svg, t, options);
        return svg;
    }

    addPathToSVG(svg, t, options) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', this.getInterpolatedSVGPathData(t));
        path.setAttribute('fill', options.fill || '#FFF');
        svg.appendChild(path);
    }
}