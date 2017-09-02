const path = require('path');

const fs = require('mz/fs');
const less = require('less');
const prompt = require('prompt');
const colors = require('colors/safe');

const Utils = require('../utils');
const Task = require('../task');

class LessTask extends Task {

    constructor(...args) {
        const defaults = {
            minify: true,
            mainFileName: 'custom.less'
        };

        super(...args);

        this.options = Object.assign({}, defaults, this.options);
    }

    compile() {
        const filePath = path.join(this.input, this.options.mainFileName);
        const lessParams = {
            paths: this.input,  // Specify search paths for @import directives
            filename: this.mainFileName, // Specify a filename, for better error messages
            compress: this.options.minify,          // Minify CSS output
            sourceMap: (this.options.minify) ? null : {sourceMapFileInline: true}
        };
        const outputPath = path.format({
            dir: path.normalize(this.output).replace(/\/$/, ''),
            base: path.parse(filePath).name + '.css'
        });

        return fs.readFile(filePath, 'utf8')
            .then(str => less.render(str, lessParams))
            .then(output => fs.writeFile(outputPath, output.css, {encoding: 'utf8'}))
            .then(() => console.log('%s -> %s', filePath, outputPath))
            .catch(err => console.error(err));
    }

    run(options) {
        const promptParams = {
            properties: {
                filename: {
                    description: colors.red('Filename of the less file to compile:'),
                    default: 'custom.less'
                },
                isMinified: {
                    description: colors.red('Minify output?'),
                    default: 'yes'
                }
            }
        };

        if (this.input.match(/\.less$/)){
            delete promptParams.properties.filename;
            this.options.mainFileName = '';
        }

        if (this.options.minify !== null && this.options.minify !== undefined){
            delete promptParams.properties.isMinified;
        }

        if (Object.keys(promptParams.properties).length === 0 || this.options.noPrompt) {
            return Utils.findFiles(path.join(this.input, `**/${this.options.mainFileName}`), {ignore: this.options.ignore || []})
                .then(files => Promise.all(files.map(filename => this.compile(filename))));
        }

        prompt.message = '';
        prompt.start();

        return Promise.resolve(prompt.start())
            .then(() => {
                return new Promise((resolve, reject) => {
                    prompt.get(promptParams, (err, result) => err ? reject(err) : resolve(result));
                });
            })
            .then((result) => {
                prompt.stop();

                if (result.minify) {
                    this.options.minify = /^\s*(y|yes)\s*$/.test(result.isMinified);
                }

                if (result.filename) {
                    this.options.mainFileName = result.filename.match(/\.less$/) ? result.filename : result.filename + '.less'
                }


                return this.compile();
            });
    }
}

module.exports = LessTask;
