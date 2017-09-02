const _ = require('lodash');
const util = require('util');

const SelectorTemplate = require('./selector-template');

/**
 *
 * @param [options]
 * @param {String} [options.selectorStyle='default'] method to use for block, element, modifier mixins. options include ('default', 'lib', 'stylus-bem')
 * @param {String} [options.stylusEmptyText='empty()']
 * @param {Number} [options.tabSize=2]
 * @returns {*}
 */
class BemRenderer {
    constructor(options) {
        const defaults = {
            selectorStyle: 'default',
            rootSelector: 'page-content',
            stylusEmptyText: 'empty()',
            tabSize: 2
        };

        this.options = Object.assign({}, defaults, options);
        this.templates = {
            block: new SelectorTemplate.Block(this.options.selectorStyle),
            mod: new SelectorTemplate.Mod(this.options.selectorStyle),
            element: new SelectorTemplate.Element(this.options.selectorStyle),
            modElement: new SelectorTemplate.ModElement(this.options.selectorStyle)
        };
        this._buffer = '';
        this.depth = 0;
        this.stylusText = '';
    }

    buffer(str) {
        return this._buffer += str;
    }

    /**
     *
     * @param {Number} charCount
     * @returns {String}
     */
    popBuffer(charCount) {
        if (charCount) {
            return this._buffer = this._buffer.substr(0, this._buffer.length - charCount)
        }
        return this._buffer = '';
    }

    print() {
        this.stylusText += this._buffer;
        this.popBuffer();
    }

    indent(depth) {
        var _depth = depth || this.depth,
            _tab = '',
            tabSize = this.options.tabSize;
        for (var i = 0; i < _depth * tabSize; i++) {
            _tab += ' ';
        }
        return this.buffer(_tab);
    }

    increaseIndentAmount(depth) {
        this.depth = (depth || this.depth) + 1;
    }

    decreaseIndentAmount(depth) {
        this.depth = (depth || this.depth) - 1;
    }

    selector(selector) {
        return this.buffer(selector);
    }

    emptyText() {
        return this.buffer(this.options.stylusEmptyText);
    }

    block(selector) {
        return this.buffer(util.format(this.templates.block.toString(), selector));
    }

    modifier(selector) {
        return this.buffer(util.format(this.templates.mod.toString(), selector));
    }

    element(selector) {
        return this.buffer(util.format(this.templates.element.toString(), selector));
    }

    modElement(selector) {
        return this.buffer(util.format(this.templates.modElement.toString(), selector));
    }

    newLine() {
        var _newLine = "\n";
        return this.buffer(_newLine);
    }

    deleteLine() {
        this._buffer = this._buffer.replace(/\n.*$/, '');
        return this._buffer;
    }

    isRoot() {
        return this.depth === 0;
    }

    isCustomRoot(bemNode) {
        return this.depth === 0 && bemNode.name === this.options.rootSelector && bemNode.modifiers.length > 0;
    }

    reset() {
        this.depth = 0;
        this.popBuffer();
    }

    printElements(elements) {
        const isModElements = this.depth > 2;

        if (elements.length === 0) {
            this.emptyText();
            this.newLine();
            this.indent();
            return
        }

        // if not using BEM mixins, add selector to reset `&` selector to block
        if (isModElements && this.options.selectorStyle === 'default') {
            this.selector('& ^[-2..-2]');
            this.newLine();
            this.increaseIndentAmount();
            this.indent();
        }

        _.forEachRight(elements, (selector) => {
            if (isModElements) {
                this.modElement(selector)
            } else {
                this.element(selector);
            }

            this.newLine();
            this.increaseIndentAmount();
            this.indent();

            this.emptyText();

            this.newLine();
            this.decreaseIndentAmount();
            this.indent();
        });

        // pop indentation of `&` reset selector
        if (isModElements && this.options.selectorStyle === 'default') {
            this.deleteLine();
            this.newLine();
            this.decreaseIndentAmount();
            this.indent();
        }
    }

    /**
     *
     * @param {BEMTree} bemTree
     * @returns {String}
     */
    render(bemTree) {

        _.forEach(bemTree, (bemNode) => {
            var isRoot = false;
            if (this.isCustomRoot(bemNode)) {
                var rootBemTemplate = (this.options.selectorStyle === 'stylus-bem') ? '%s/--%s' : '%s--%s',
                    rootBemNodeName = util.format(rootBemTemplate, bemNode.name, bemNode.modifiers.splice(0, 1));
                this.block(rootBemNodeName);
                this.newLine();
                this.increaseIndentAmount();
                this.indent();
                isRoot = true;
            } else if (this.isRoot()) {
                this.block(bemNode.name);
                this.newLine();
                this.increaseIndentAmount();
                this.indent();
                isRoot = true;
            } else {
                this.block(bemNode.name);
                this.newLine();
                this.increaseIndentAmount();
                this.indent();
            }

            this.printElements(bemNode.elements);

            _.forEachRight(bemNode.modifiers, (selector) => {
                this.modifier(selector);

                this.newLine();
                this.increaseIndentAmount();
                this.indent();

                this.printElements(bemNode.elements);

                this.deleteLine();
                this.newLine();
                this.decreaseIndentAmount();
                this.indent();
            });

            if (!isRoot) {
                this.deleteLine();
                this.newLine();
                this.decreaseIndentAmount();
                this.indent();
            }
            this.print();
        });

        return this.stylusText;
    }
}

module.exports = BemRenderer;
