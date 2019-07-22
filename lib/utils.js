const os = require('os');
const util = require('util');
const path = require('path');
const childProcess = require('child_process');

const fs = require('mz/fs');
const glob = require('glob');
const debug = require('debug');

const exec = childProcess.exec;
const log = debug('weblee-utils');

class ProjectUtils {
    static buildGlobSelector(arr, suffix) {
        if (!arr) throw new Error('Task w/ suffix ' + suffix + ' is not defined');
        if (arr.length === 1) {
            return path.join(arr[0].input, suffix);
        } else {
            return arr.map(taskMeta => path.join(taskMeta.input, suffix))
        }
    }

    static dump(obj) {
        return util.inspect(obj, {colors: true});
    }

    static findFiles(...args) {
        return new Promise((resolve, reject) => {
            glob(...args, function (err, files) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(files);
            })
        });
    }

   static persistDir(dir) {
        return fs.stat(dir)
            .then(dirStat => {
                if (!dirStat.isDirectory()) {
                    return Promise.reject(new Error(`dir '${dir}' is not a directory`));
                }
            })
            .catch(() => fs.mkdir(dir))
    }

    static execute(command) {
        let buffer;
        return new Promise((resolve, reject) => {
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    buffer += `\nerror:\n${err}'`;
                }

                if (stderr) {
                    buffer += `\nstd-error:\n${stderr}`;
                }

                if (stdout) {

                    buffer += `\nresults:\n${stdout}`;
                }

                log(buffer);

                err || stderr ? reject(err || stderr) : resolve(stdout);
            });
        })
    }

    static getPackageJSONDir(startPath = process.cwd(), ignore = false) {
        let searchPath = startPath;
        let fileFound = false;
        let nextPath = '';

        while (!fileFound) {
            searchPath = nextPath || searchPath;

            try {
                fs.statSync(path.join(searchPath + '/package.json'));
                if (ignore > 0) {
                    ignore--;
                } else {
                    fileFound = true;
                }
            } catch (error) {
            }

            nextPath = path.join(searchPath + '/..');
            // Linux root is "/"
            // Windows root is "C:\" or any other drive letter
            const root =
                os.platform() === 'win32'
                    ? nextPath.split(path.sep)[0] + path.sep
                    : path.normalize('/');
            if (nextPath === root || nextPath === '.' || nextPath === '..') {
                break;
            }
        }

        if (fileFound) {
            return searchPath;
        }

        return false;
    }
};

module.exports = ProjectUtils;