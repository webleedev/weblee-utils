const path = require('path');

const compass = require('node-compass');

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');

class CompassTask extends Task {

    run() {
        const compassDefaults = {
            config_file: path.join(config.paths.workingDir, '/config.rb'),
            css: this.output,
            sass: this.input
        };
        const compassOpts = Object.assign({}, compassDefaults, this.options);

        return Utils.findFiles(path.join(this.input, '/**/!(_)*.scss'))
            .then(files => {
                return Promise.all(files.map(() => {
                    return new Promise((resolve, reject) => {
                        compass(compassOpts, (err, stdout, stderr) => {
                            err || stderr ? reject(err || stderr) : resolve(stdout)
                        })
                    })
                }))
            })
    }
}

module.exports = CompassTask;
