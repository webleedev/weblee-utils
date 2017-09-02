const path = require('path');

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');

class WebpackTask extends Task {

    run (){
        const defaults = {
            buildPath: path.join(config.paths.workingDir, 'js/src/webpack.config.js')
        };
        const opts = Object.assign({}, defaults, this.options);

        console.log('starting build...');

        return Utils.execute(`webpack --config ${opts.buildPath} --display-reasons`);
    }
}

module.exports = WebpackTask;
