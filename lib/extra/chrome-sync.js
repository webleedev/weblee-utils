const path = require('path');
const fs = require('fs');
const http = require('http');

const IO = require('socket.io');
const prompt = require('prompt');
const colors = require('colors/safe');
const debug = require('debug');

const config = require('../../config');
const Utils = require('../utils');
const Task = require('../task');

const log = debug('weblee-utils:chrome-sync');

class ChromeSync extends Task {
    constructor(...args) {
        const syncDefaults = {
            tabRegex: "localhost|192.168.",
            ignoreTabRegex: "wp-admin|phpmyadmin"
        };

        super(...args);

        this.state = {files: [], watchers: []};
        this.options = Object.assign({}, syncDefaults, {workingDir: config.paths.workingDir}, this.options);
        this.server = http.createServer();
        this.io = IO(this.server);
    }

    watch(globSelector, callback) {
        return Utils.findFiles(globSelector, {})
            .then(files => {
                this.state.files = files;
                this.state.files.forEach(filePath => {
                    log(`watching ${filePath}`);
                    this.state.watchers.push(fs.watch(filePath, (...args) => {
                        callback && callback(...args);
                    }));
                })
            });
    }

    connect() {
        if (!this.socket) {
            this.io.on('connection', socket => {
                this.socket = socket;
                this.socket.on('disconnect', () => {
                    log('disconnected: %o', arguments);
                    this.clear();
                });
            });
            this.server.listen(3000);
        }
    }

    clear() {
        log('closing watchers');
        this.state.watchers.forEach(watcher => watcher.close());
        this.state.watchers = [];
    }

    stop() {
        log('stopping');
        return new Promise(resolve => {
            this.clear();
            this.server.close(() => log('stopped') && resolve())
        })
    }

    run() {
        const refreshEvtData = {
            tabRegex: this.options.tabRegex,
            ignoreTabRegex: this.options.ignoreTabRegex
        };
        const fileSelector = path.join(config.paths.workingDir, this.input);

        return this.connect()
            .then(() => this.watch(fileSelector, () => this.socket.emit('refresh', refreshEvtData)));
    }
}

module.exports = ChromeSync;
