const path = require('path');
const util = require('util');

const fs = require('mz/fs');
const php2pug = require('php2pug');
const debug = require('debug');

const Utils = require('../utils');
const Task = require('../task');

const log = debug('weblee-utils:pug');

log.error = debug('weblee-utils:pug:error');

class Php2PugTask extends Task {
    run() {
        const defaults = {
            fileExtension: 'html',
            taskName: 'html-2-pug'
        };
        this.options = Object.assign({}, defaults, this.options);

        return Utils.findFiles(path.join(this.input, `/**/*.${this.options.fileExtension}`), {ignore: this.options.ignore || []})
            .then(fileList => {
                return Promise.all(fileList.map((filePath) => {
                    const basePath = path.join(this.output, path.relative(this.input, path.dirname(filePath)));
                    const pugDest = path.join(basePath, util.format('%s%s', path.basename(filePath, this.options.fileExtension), 'pug'));

                    return fs.readFile(filePath, {encoding: 'utf8'})
                        .then(str => php2pug(str))
                        .then(pugText => fs.writeFile(pugDest, pugText))
                        .then(() => log('%s -> %s', filePath, pugDest))
                        .catch(err => console.error(err) && log.error(err));
                }))
            })
    }
}

module.exports = Php2PugTask;
