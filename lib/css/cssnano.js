const path = require('path');

const fs = require('mz/fs');
const postcss = require('postcss');
const cssnano = require('cssnano');
const postcssDuplicatePlugin = require('postcss-discard-duplicates');

const Utils = require('../utils');
const Task = require('../task');
const postcssPrecisionPlugin = require('./postcss-plugins/precision');


class MinifyCssTask extends Task {

    /**
     *
     * @param {String} filepath
     * @param {String} output
     * @param {Object} [options]
     * @param {Object} [options.cssnano]
     * @returns {Promise}
     */
    minifyFile(filepath, output, options) {
        const cssnanoDefaults = {
            zindex: false,
            discardUnused: {
                keyframes: false
            },
            reduceIdents: {
                keyframes: false
            }
        };
        const opts = Object.assign({}, options);
        const cssnanoOptions = Object.assign({}, cssnanoDefaults, opts.cssnano);
        const filenameMeta = path.parse(filepath);
        const mapCSSPath = path.join(output, filenameMeta.name + '.css.map');
        const prodCSSPath = path.join(output, filenameMeta.name + '.min.css');
        const postcssPlugins = [postcssPrecisionPlugin(), postcssDuplicatePlugin];
        let result;

        if (opts.cssnano) {
            postcssPlugins.push(cssnano(cssnanoOptions));
        }

        return fs.readFile(filepath, 'utf8')
            .then(fileContent => postcss(postcssPlugins).process(fileContent, {from: filepath, to: prodCSSPath}))
            .then((postcssResult => {
                result = postcssResult;
                if (result.map){
                    return fs.writeFile(mapCSSPath, result.map)
                }
            }))
            .then(() => fs.writeFile(prodCSSPath, result.css, {encoding: 'utf8'}))
    }

    /**
     *
     * @returns {Promise}
     */
    minifyFiles() {
        const minifyDefaults = {
            input: this.input,
            output: this.output,
            cssnano: true
        };
        const minifyOpts = Object.assign(minifyDefaults, this.options);
        const globSelector = this.input.match(/css$/) ? this.input : path.join(this.input, '/*.css');

        return Utils.findFiles(globSelector)
            .then(files => {
                return Promise.all(files.map(filepath => this.minifyFile(filepath, this.output, minifyOpts)));
            });
    }

    run(){
        return this.minifyFiles();
    }
}

module.exports = MinifyCssTask;
