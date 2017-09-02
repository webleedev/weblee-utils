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
};

module.exports = ProjectUtils;