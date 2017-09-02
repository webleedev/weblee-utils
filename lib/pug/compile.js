const path = require('path');
const util = require('util');

const fs = require('mz/fs');
const pug = require('pug');
const bemify = require('pug-bemify');
const debug = require('debug');

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');
const customPugFilters = require('./filters');

const log = debug('weblee-utils:pug');

log.error = debug('weblee-utils:pug:error');

class PugTask extends Task {

    copyFile(srcPath, destPath) {
        return fs.readFile(srcPath, 'utf8')
            .then(str => {
                if (destPath.match(/_functions.pug$/)) {
                    const tab = ' '.repeat(4);
                    // prepend dev util.format function
                    str = `-\n${tab}var namespace = '${config.projectName}'` +
                        `\n${tab}var util={format: ${util.format.toString().replace(/\n/g, '\n' + tab)}}\n${str}`;
                }

                return fs.writeFile(destPath, str)
            })
    }

    copyFiles(srcDir, destDir) {
        return fs.readdir(srcDir)
            .then(files => {
                return Promise.all(files.map(fileName => {
                    return this.copyFile(path.join(srcDir, fileName), path.join(destDir, fileName))
                }));
            })
    }

    run() {
        const defaults = {fileExtension: 'php'};
        const autoGenIncludeRegex = /(^|\n)[\W]*include\s+.*_auto-generated\/_-all[\W\-]*\n/;
        const localHelpersDir = path.join(__dirname, "templates/");
        const projectHelpersDir = path.join(this.input, "_auto-generated/");
        let content;

        this.options = Object.assign({}, defaults, this.options);

        return Utils.persistDir(projectHelpersDir)
            .then(() => this.copyFiles(localHelpersDir, projectHelpersDir))
            .then(() => Utils.findFiles(path.join(this.input, '**/[^_]*.pug')))
            .then(files => {
                return Promise.all(files.map(filePath => {
                    const destFilename = `${path.parse(filePath).name.replace(/\.bem/i, '')}.${this.options.fileExtension}`;
                    const destPath = path.join(this.output, destFilename);
                    const pugParams = {
                        filename: filePath,
                        pretty: this.options.pretty,
                        doctype: 'html',
                        plugins: [bemify()],
                        filters: Object.assign(pug.filters, customPugFilters),
                        basedir: path.resolve('/')
                    };

                    return fs.readFile(filePath, 'utf8')
                        .then(fileContent => {

                            content = fileContent;

                            if (!autoGenIncludeRegex.test(fileContent)) {
                                console.warn(`"${filePath}" dev resources import not found. Prepending...`);
                                const autoGenIncludesPath = path.join(this.input, '_auto-generated/_-all');
                                const srcParentDir = path.dirname(filePath);

                                content = `include ${path.relative(srcParentDir, autoGenIncludesPath)}\n${fileContent}`;

                                if (this.options.overwriteSrc !== false) {
                                    return fs.writeFile(filePath, content);
                                }
                            }
                        })
                        .then(() => pug.render(content, pugParams))
                        .then(content => fs.writeFile(destPath, content))
                }))
            });
    }
}

module.exports = PugTask;
