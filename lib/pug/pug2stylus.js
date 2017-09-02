const path = require('path');

const fs = require('mz/fs');
const prompt = require('prompt');
const colors = require("colors/safe");
const pugLexer = require('pug-bem-lexer');
const pug = require('pug');

const Utils = require('../utils');
const Task = require('../task');
const Pug2BEM = require('./pug2bem');
const BEM2Stylus = require('./bem2stylus');
const pugFilters = require('./filters');


class Pug2StylusTask extends Task {
    /**
     *
     * @param {String} pugStr
     * @param {Object} [options]
     * @param {String} [options.selectorStyles] - options include ('default', 'lib', 'stylus-bem')
     * @param {String} [options.stylusEmptyText] - can be
     * @return {Promise.<String>}
     */
    convertPugToStylus(pugStr, options) {
        const opts = Object.assign({}, options);

        return new Promise(resolve => {
            pug.render(pugStr, {
                filename: options.readPath,
                doctype: 'html',
                basedir: path.resolve('/'),
                filters: pugFilters,
                plugins: [{
                    lex: pugLexer,
                    preCodeGen: function (ast) {
                        const bemParser = new Pug2BEM();
                        const bemRenderer = new BEM2Stylus({
                            selectorStyle: opts.selectorStyle,
                            stylusEmptyText: opts.emptyText
                        });
                        const bemData = bemParser.parse(ast.nodes);

                        resolve(bemRenderer.render(bemData));
                        return ast;
                    }
                }]
            });
        })

    }


    /**
     *
     * @param {String} srcFilePath
     * @param {String} writePath
     * @param {Object} options
     * @returns {Promise}
     */
    convertPugFileToStylus(srcFilePath, writePath, options) {
        const opts = Object.assign({}, {selectorStyle: 'stylus-bem'}, options);

        return fs.readFile(srcFilePath, {encoding: 'utf8'})
            .then(pugText => {
                const conversionOpts = {
                    readPath: srcFilePath,
                    writePath: writePath,
                    selectorStyle: opts.selectorStyle,
                    emptyText: opts.emptyText
                };
                return this.convertPugToStylus(pugText, conversionOpts);
            })
            .then(stylusText => fs.writeFile(writePath, stylusText, {encoding: 'utf8'}))
            .then(() => console.log(`${srcFilePath} -> ${writePath}`));
    }

    run() {
        const promptParams = {
            properties: {
                selectorStyle: {
                    'description': colors.red('What selector method to use for selectors?'),
                    'default': 'stylus-bem'
                },
                emptyText: {
                    'description': colors.red('What should be used a placeholder for empty selector rules? (this is a formatting fix for IntelliJ)'),
                    'default': 'empty()'
                }
            }
        };

        prompt.message = '';

        if (this.options.single) {
            promptParams.properties.filename = {
                'description': colors.red('Filename of the pug file to convert to styl:'),
                'required': true
            };
        }

        return Promise.resolve(prompt.start())
            .then(() => {
                return new Promise((resolve, reject) => {
                    prompt.get(promptParams, (err, result) => {
                        err ? reject(err) : resolve(result);
                    })
                })
            })
            .then(result => {
                const conversionOpts = {
                    selectorStyle: result.selectorStyle,
                    emptyText: result.emptyText
                };
                let srcPath = path.join(this.input, '/**/*.+(pug|jade)');

                prompt.stop();

                if (this.options.single) {
                    const writePath = path.resolve(this.output, '_' + path.parse(result.filename).name + '.styl');
                    return this.convertPugFileToStylus(result.filename, writePath, conversionOpts);
                }

                if (this.input.match(/(pug|jade)$/)){
                    srcPath = this.input;
                }

                return Utils.findFiles(srcPath)
                    .then(fileList => {
                        return Promise.all(fileList.map(srcFilePath => {
                            const writePath = path.resolve(this.output, '_' + path.parse(srcFilePath).name + '.styl');
                            return this.convertPugFileToStylus(srcFilePath, writePath, conversionOpts);
                        }))
                    })
            });
    }
}

module.exports = Pug2StylusTask;
