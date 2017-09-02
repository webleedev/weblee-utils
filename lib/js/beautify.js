const path = require('path');

const fs = require('mz/fs');
const beautifyJS = require('js-beautify');

const Utils = require('../utils');
const Task = require('../task');

class BeautifyJsTask extends Task {

    beautifyFile(filename){
        return fs.readFile(filename, 'utf8')
            .then(str => fs.writeFile(filename, beautifyJS(str), 'utf8'))
    }
    run() {
        const defaults = {
            globSuffix: '/**/*.js',
            ignore: ["**/node_modules/**", "**/vendors/**"]
        };

        this.options = Object.assign({}, defaults, this.options);

        Utils.findFiles(path.join(this.input, this.options.globSuffix), {ignore: this.options.ignore})
            .then(fileList => Promise.all(fileList.map(filename => this.beautifyFile(filename))))
    }
}

module.exports = BeautifyJsTask;
