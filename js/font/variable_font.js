import { loadFont } from '../utils/fontloader'

/**
 * VariableFont - Load and manipulate variable fonts
 * @extends EventTarget
 */
export default class VariableFont extends EventTarget {
    constructor(_source) {
        super();
        this.validateSource(_source);
        this.initializeProperties(_source);
        this.loadFont();
    }

    validateSource(_source) {
        if (!_source) throw new Error("VFont: No source provided");
    }

    initializeProperties(_source) {
        this.src = _source;
        this.axes = {};
        this.font = null;
    }

    async loadFont() {
        try {
            const font = await loadFont(this.src);
            this.setFontData(font);
            this.dispatchEvent(new Event('fontloaded'));
        } catch (error) {
            this.handleLoadError(error);
        }
    }

    setFontData(font) {
        this.font = font;
        this.axes = font.variationAxes;
    }

    handleLoadError(error) {
        console.error("Error loading font:", error);
        this.dispatchEvent(new Event('fontloaderror'));
    }

    glyphVariation(char, args = {}) {
        this.validateFontLoaded();
        const { wght, wdth } = this.getVariationParams(args);
        return this.getGlyphVariation(char, wght, wdth);
    }

    textVariation(txt, args = {}) {
        this.validateFontLoaded();
        const { wght, wdth } = this.getVariationParams(args);
        return this.getTextVariation(txt, wght, wdth);
    }

    validateFontLoaded() {
        if (!this.font) {
            throw new Error("Font not loaded yet. Wait for 'fontloaded' event.");
        }
    }

    getVariationParams(args) {
        return {
            wght: args.wght || this.defaultAxe('wght'),
            wdth: args.wdth || this.defaultAxe('wdth')
        };
    }

    defaultAxe(_axe) {
        this.validateAxis(_axe);
        return this.axes[_axe].default;
    }

    validateAxis(_axe) {
        if (!this.axes[_axe]) {
            const availableAxes = Object.keys(this.axes).join(', ');
            throw new Error(`Axis '${_axe}' not found. Available: ${availableAxes}`);
        }
    }

    getAxes() {
        return this.axes;
    }

    isLoaded() {
        return this.font !== null;
    }

    getGlyphVariation(char, wght, wdth) {
        const variation = this.font.getVariation({ wght, wdth });
        const run = variation.layout(char);
        return run.glyphs[0];
    }

    getTextVariation(txt, wght, wdth) {
        const variation = this.font.getVariation({ wght, wdth });
        const run = variation.layout(txt);
        return run.glyphs;
    }
}