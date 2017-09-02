const path = require('path');

const fs = require('mz/fs');
const babel = require('babel-core');

const Utils = require('../utils');
const Task = require('../task');

class BabelTask extends Task {

    constructor(...args) {
        super(...args);
        const defaults = {
            ignore: ["**/node_modules/**", "**/vendors/**"],
            babelOptions: {
                "presets": ["es2015"],
                "plugins": [
                    "transform-react-jsx"
                ]
            }
        };
        this.config = Object.assign({}, defaults, options);
    }

    run() {
        return Utils.findFiles(path.join(this.input, '/**/*.jsx'), {ignore: this.options.ignore || ["**/node_modules/**", "**/vendors/**"]})
            .then(fileList => {
                return Promise.all(fileList.map(filename => {
                    const originalPathOptions = path.parse(filename);
                    const writePath = path.format({
                        dir: originalPathOptions.dir,
                        name: originalPathOptions.name,
                        base: originalPathOptions.name + '.js'
                    });

                    return Promise.resolve()
                        .then(() => {
                            return new Promise((resolve, reject) => {
                                babel.transformFile(filename, this.config.babelOptions, function (err, result) {
                                    if (err) {
                                        reject(err);
                                        return;
                                    }
                                    resolve(result)
                                });
                            })
                        })
                        .then((result) => {
                            return fs.writeFile(writePath, result.code);
                        })
                }));
            });
    }
}

module.exports = BabelTask;
