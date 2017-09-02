const path = require('path');

const fs = require('mz/fs');
const libsass = require('node-sass');
const sassCache = require('sass-cache');

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');

class SassTask extends Task {

    render (sassOpts){
        return new Promise((resolve, reject) => {
            libsass.render(sassOpts, (err, result) => {
                err ? reject(err) : resolve(result)
            })
        });
    }

    run() {
        let includes = (this.options.includePaths || []).map(function (includePath) {
            return path.join(config.workingDir, includePath);
        });

        if (this.options.useBourbon) {
            includes = includes.concat(require('bourbon').includePaths);
        }

        if (this.options.useCompassMixins) {
            includes = includes.concat(path.join(process.cwd(), '/node_modules/compass-mixins/lib'));
        }

        return Utils.findFiles(path.join(this.input, '/*.{scss,sass}'))
            .then(files => {
                return Promise.all(files.map(filePath => {
                    const destPath = path.join(this.output, `${path.parse(filePath).name}.css`);
                    const sassOpts = {
                        file: filePath,
                        includePaths: includes,
                        outputStyle: this.options.outputStyle || 'expanded', //nested, expanded, compact, compressed,
                        indentedSyntax: false,
                        sourceMap: true,
                        functions: sassCache.functions
                    };

                    return this.render(sassOpts)
                        .then(result => fs.writeFile(destPath, result.css))
                }));
            });
    }
}

module.exports = SassTask;
