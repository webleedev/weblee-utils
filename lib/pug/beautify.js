const path = require('path');

const fs = require('mz/fs');
const pugBeautify = require('pug-beautify');

const Utils = require('../utils');
const Task = require('../task');

class PugBeautifyTask extends Task {

    constructor(...args) {
        const defaults = {
            globSuffix: `/**/*.?(jade|pug)`,
            ignore: [],
            fill_tab: false,
            omit_div: false,
            tab_size: 4
        };

        super(...args);

        this.options = Object.assign({}, defaults, this.options);
    }

    beautifyFile(filename) {
        return fs.readFile(filename, {encoding: 'utf8'})
            .then(src => pugBeautify(src, this.options));
    }

    run() {
        return Utils.findFiles(path.join(this.input, this.options.globSuffix), {ignore: this.options.ignore})
            .then((fileList) => {
                return Promise.all(fileList.map((filePath) => {
                    return this.beautifyFile(filePath)
                        .then(pugSrc => fs.writeFile(filePath, pugSrc))
                        .then(() => log("beautified %s", filePath))
                }))
            })
    }
}

module.exports = PugBeautifyTask;
