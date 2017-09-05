const path = require('path');

const fs = require('mz/fs');
const Stylus = require('stylus');
const bemEvaluator = require('stylus-bem-evaluator');
const cssEvaluator = require('stylus-require-css-evaluator');
const koutoSwiss = require('kouto-swiss');
const nib = require('nib');
const typeUtils = new require('stylus-type-utils')();

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');
const stylusFunctions = require('./functions');

class StylusTask extends Task {

    setupEnvironment(dir, options) {
        const localHelpersDir = path.resolve(__dirname, "templates/");
        const helpersDir = path.join(dir, "_auto-generated/");

        return fs.stat(helpersDir)
            .then(dirStat => !dirStat.isDirectory() ? Promise.reject(`'${helpersDir}' is not a directory`) : null)
            .catch(() => fs.mkdir(helpersDir))
            .then(() => fs.readdir(localHelpersDir))
            .then(files => {
                return Promise.all(files.map(fileName => {
                    return fs.readFile(path.resolve(localHelpersDir, fileName), {encoding: 'utf8'})
                        .then(str => fs.writeFile(path.join(helpersDir, fileName), str))
                }))
            });
    }

    compileStylusFile(filename) {
        return fs.readFile(filename, {encoding: 'utf8'})
            .then(str => {
                const stylus = Stylus(str)
                    .set('filename', filename)
                    .import(path.resolve(path.dirname(filename), "_auto-generated/*"));

                if (this.options.koutoSwiss !== false) {
                    stylus.use(koutoSwiss()).import('kouto-swiss');
                } else if (this.options.nib !== false) {
                    stylus.use(nib()).import('nib');
                }

                if (this.options.stylusTypeUtils !== false) {
                    stylus.use(typeUtils)
                        .import("type-utils");
                }

                if (this.options.stylusRequireCssEvaluator !== false) {
                    stylus.use(cssEvaluator)
                }

                if (this.options.stylusBemEvaluator !== false) {
                    stylus.use(bemEvaluator)
                }

                if (this.options.stylusFunctions !== false) {
                    stylus.use(stylusFunctions)
                }

                return new Promise((resolve, reject) => {
                    stylus.render((err, css) => err ? reject(err) : resolve(css))
                })
            })
            .then((css) => {
                const filenameMeta = path.parse(filename);
                const prodCSSPath = path.format({
                    dir: path.normalize(this.output),
                    base: filenameMeta.name.replace(/\.bem/i, '') + '.css'
                });

                return fs.writeFile(prodCSSPath, css, {encoding: 'utf8'})
            })


    }

    run() {
        return this.setupEnvironment(this.input)
            .then(() => Utils.findFiles(path.join(this.input, '**/!(_)*.styl'), {ignore: this.options.ignore || []}))
            .then(files => Promise.all(files.map(filename => this.compileStylusFile(filename))));
    }
}

module.exports = StylusTask;
