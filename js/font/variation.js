/*
* Variation - Text variation from variable font
* @author: JuanFuent.es
*/
import VariableFont from './variable_font';
import Glyph from './glyph';

export default class Variation {
    constructor(params) {
        this.fontPath = '/HubotSans.ttf';
        this.validateParams(params);
        this.initializeProperties(params);
        this.initializeFont();
    }

    validateParams(params) {
        if (!params.font) throw new Error('Font is required');
    }

    initializeProperties(params) {
        this.txt = params.txt || "Hello";
        this.glyphs = [];
        this.fontSize = 300;
        this.wght = params.wght || 400;
        this.wdth = params.wdth || 100;
    }

    initializeFont() {
        this.font = new VariableFont(this.fontPath);
        this.font.addEventListener('fontloaded', () => this.setup());
    }

    setup() {
        const txt = this.font.textVariation(this.txt, this.variation);
        this.createGlyphs(txt);
    }

    createGlyphs(txt) {
        for (let i = 0; i < txt.length; i++) {
            this.createGlyph(txt[i]);
        }
    }

    createGlyph(_glyph) {
        const glyph = new Glyph(_glyph.name, this.getGlyphParams(_glyph));
        this.glyphs.push(glyph);
    }

    getGlyphParams(_glyph) {
        return {
            fontSize: this.fontSize,
            commands: _glyph.path.commands,
            width: _glyph.advanceWidth,
            height: _glyph.advanceHeight,
            lineHeight: .75
        };
    }

    draw(_ctx) {
        let offset_x = 0;
        for (let i = 0; i < this.glyphs.length; i++) {
            this.drawGlyph(_ctx, this.glyphs[i], offset_x);
            offset_x += this.glyphs[i].width;
        }
    }

    drawGlyph(_ctx, glyph, offset_x) {
        glyph.draw(_ctx, { offset_x });
    }

    get variation() {
        return {
            wght: this.wght,
            wdth: this.wdth
        };
    }
}