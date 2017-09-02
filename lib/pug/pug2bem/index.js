const _ = require('lodash');

class BEMParser {

    constructor(options) {
        const defaults = {
            includeMixins: true,
            elementSelectorIdentifier: '__',
            modifierSelectorIdentifier: '--'
        };
        this.options = Object.assign({}, defaults, options);
        this._classes = [];
        this.classData = {};
        this._mixinCache = {};
    }

    parseTag(node) {
        node.attrs.forEach(attr => {
            switch (attr.name) {
                case 'class':
                    this._classes.push(attr.val.replace(/[\/\"\']/g, ''));
                    break;
                default:
                    break;
            }
        });
        this.read(node.block);
    };

    parseInterpolatedTag(...args) {
        return this.parseTag(...args);
    }

    parseMixin(node) {
        if (node.call) {
            // write to classList
            var cachedNode = this._mixinCache[node.name];
            if (this.options.includeMixins && cachedNode) this.read(cachedNode.block);
            if (node.block) this.read(node.block);
        } else {
            // save
            this._mixinCache[node.name] = node;
        }
    }

    parseConditional(node) {
        if (node.consequent && node.consequent.nodes) {
            this.read(node.consequent);
        }
        if (node.alternate && node.alternate.nodes) {
            this.read(node.alternate);
        }
    }

    read(node) {
        var parseFuncName = 'parse' + node.type;

        if (this[parseFuncName]) {
            this[parseFuncName].call(this, node);
        }

        if (node.nodes) {
            node.nodes.forEach(childNode => {
                this.read(childNode);
            });
        }
    }

    optimizeClassList() {
        const classData = {};
        const classList = this._classes;
        const modifierSelectorIdentifierRegex = new RegExp(this.options.modifierSelectorIdentifier);
        const elementSelectorIdentifierRegex = new RegExp(this.options.elementSelectorIdentifier);

        classList.forEach(selector => {
            let selectorComponents;
            let blockSelector;
            let elementSelector;
            let modifierSelector;

            if (elementSelectorIdentifierRegex.test(selector)) {
                // class is an element
                selectorComponents = selector.split(this.options.elementSelectorIdentifier);
                blockSelector = selectorComponents[0];
                elementSelector = selectorComponents[1];

                classData[blockSelector] = classData[blockSelector] || {modifiers: [], elements: []};
                classData[blockSelector].elements.push(elementSelector);
            } else if (modifierSelectorIdentifierRegex.test(selector)) {
                // class is an modifier
                selectorComponents = selector.split(this.options.modifierSelectorIdentifier);
                blockSelector = selectorComponents[0];
                modifierSelector = selectorComponents[1];

                classData[blockSelector] = classData[blockSelector] || {
                    modifiers: [],
                    elements: []
                };
                classData[blockSelector].modifiers.push(modifierSelector);
            } else {
                // class is standard
                classData[selector] = classData[selector] || {modifiers: [], elements: []};
            }
        });

        // remove duplicates?
        Object.keys(classData).forEach(baseClassName => {
            const baseClassData = classData[baseClassName];
            classData[baseClassName].name = baseClassName;
            classData[baseClassName].elements = _.uniq(baseClassData.elements);
            classData[baseClassName].modifiers = _.uniq(baseClassData.modifiers);
        });

        // save class data within instance
        this.classData = classData;

        return this.classData;
    }

    parse(data) {
        Object.keys(data).forEach(key => {
            this.read(data[key]);
        });
        return this.optimizeClassList();
    }
}

module.exports = BEMParser;
