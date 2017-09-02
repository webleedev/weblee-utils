const path = require('path');
const os = require('os');

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');

class RjsTask extends Task {

    run (){
        const defaults = {
            buildPath: path.join(config.paths.workingDir, 'js/src/build.js')
        };
        const opts = Object.assign({}, defaults, this.options);
        const rjsCmd = (os.platform() === 'linux') ? 'r.js' : 'r.js.cmd';

        console.log('starting build...');

        return Utils.execute(rjsCmd + ' -o ' + opts.buildPath);
    }
}

module.exports = RjsTask;
