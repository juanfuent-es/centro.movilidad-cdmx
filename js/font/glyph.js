/*
* Glyph - Single character glyph with path data
* Author: JuanFuent.es
*/
export default class Glyph {
    constructor(char, args = {}) {
        this.validateCommands(args);
        this.initializeProperties(char, args);
        this.setupCommands();
    }

    validateCommands(args) {
        if (!args.commands) {
            throw new Error("Glyph: commands are required");
        }
    }

    initializeProperties(char, args) {
        this.char = char || "";
        this.fontSize = args.fontSize || 28;
        this.lineHeight = this.fontSize * (args.lineHeight || .75);
        this.scale = 1 / 1024 * this.fontSize;
        this.width = ~~(args.width * this.scale);
        this.height = ~~(args.height * this.scale);
        this.commands = args.commands || [];
    }

    setupCommands() {
        const formattedCommands = this.formatCommands();
        this.path = this.commandsToPath(formattedCommands);
        this.svgPathData = this.commandsToSVG(formattedCommands);
    }

    formatCommands() {
        return this.commands.map(command => this.commandFormatter(command));
    }

    commandFormatter(_command) {
        return {
            command: _command.command,
            args: this.scaleCommandArgs(_command.args)
        };
    }

    scaleCommandArgs(args) {
        return args.map((pos, i) => {
            const axisScale = i % 2 ? -this.scale : this.scale;
            return pos * axisScale;
        });
    }

    commandsToSVG(_commands) {
        return _commands.map(cmd => this.commandToSVG(cmd)).join(' ');
    }

    commandToSVG(cmd) {
        switch (cmd.command) {
            case 'moveTo': return `M${cmd.args.join(' ')}`;
            case 'lineTo': return `L${cmd.args.join(' ')}`;
            case 'bezierCurveTo': return `C${cmd.args.join(' ')}`;
            case 'quadraticCurveTo': return `Q${cmd.args.join(' ')}`;
            case 'closePath': return 'Z';
            default: return '';
        }
    }

    commandsToPath(_commands) {
        const _path = new Path2D();
        _commands.forEach(c => _path[c.command].apply(_path, c.args));
        return _path;
    }

    draw(_ctx, args = {}) {
        _ctx.save();
        this.applyTransform(_ctx, args);
        _ctx.fill(this.path);
        _ctx.restore();
    }

    applyTransform(_ctx, args) {
        const offsetX = args.offset_x || 0;
        const offsetY = args.offset_y || 0;
        _ctx.translate(offsetX, this.lineHeight + offsetY);
    }

    appendSVG(fillColor = '#FFF') {
        const svg = this.createSVGElement();
        const path = this.createSVGPath(fillColor);
        svg.appendChild(path);
        document.body.appendChild(svg);
        return svg;
    }

    createSVG(fillColor = '#FFF') {
        const svg = this.createSVGElement();
        const path = this.createSVGPath(fillColor);
        svg.appendChild(path);
        return svg;
    }

    createSVGElement() {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', this.width);
        svg.setAttribute('height', this.lineHeight);
        svg.setAttribute('viewBox', `0 0 ${this.width} ${this.lineHeight}`);
        return svg;
    }

    createSVGPath(fillColor) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', this.svgPathData);
        path.setAttribute('fill', fillColor);
        path.setAttribute('transform', `translate(0, ${this.lineHeight})`);
        return path;
    }

    getDimensions() {
        return {
            width: this.width,
            height: this.height,
            lineHeight: this.lineHeight
        };
    }

    getSVGPathData() {
        return this.svgPathData;
    }
}