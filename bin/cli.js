#!/usr/bin/env node
const path = require('path');

const fs = require('mz/fs');
const prompt = require('prompt');
const colors = require("colors/safe");
const yargs = require('yargs');

const Utils = require('../lib/utils');
const Project = require('../lib/project');

const root = path.join(__dirname, '../lib/');
const libRoots = [
    'pug',
    'javascript',
    'sass',
    'babel',
    'sass',
    'less',
    'css',
    'ts',
    'extra'
];
const preDefinedTaskNames = [
    'pug',
    'pug-php',
    'pug-ejs',
    'pug-html',
    'php2pug',
    'pug2stylus',
    'jade',
    'jsx',
    'babel',
    'stylus',
    'sass',
    'less',
    'css',
    'rjs',
    'webpack',
    'wordpress'
];
const globParams = {
    nodir: true
};

const modulesSelector = path.join(root, `{${libRoots.join(',')}}/*.js`);

yargs.command({
    command: 'setup',
    desc: 'recreates gulpfile and config files',
    handler: setup
});

Utils.findFiles(modulesSelector, globParams)
    .then(files => {
        files.concat(preDefinedTaskNames).forEach(fileName => {
            const taskName = fileName.split('/').slice(-2).join('/').replace(/\.\w+$/, '');
            yargs.command({
                command: taskName.replace('extra/', ''),
                desc: `executes '${taskName}'`,
                handler: argv => {
                    const project = new Project();
                    return project.exec(argv._[0])
                        .then(results => console.log(`${taskName}: done`))
                        .catch(err => console.error(err));
                }
            })
        });

        yargs.demandCommand(1, 'You need at least one command before moving on')
            .strict()
            .argv;
    })
    .catch(err => console.error(err));


function setup() {
    const promptParams = {
        properties: {
            createNew: {
                description: colors.red('Create a new weblee-config.json file?'),
                default: (function () {
                    try {
                        fs.accessSync(path.join(process.cwd(), 'weblee-config.json'));
                        return 'no';
                    } catch (err) {
                        return 'yes';
                    }
                })()
            }
        }
    };

    fs.readFile(path.resolve(__dirname, '../templates/gulpfile.js'), {encoding: 'utf8'})
        .then(gulpSrc => fs.writeFile(path.resolve(process.cwd(), 'gulpfile.js'), gulpSrc))
        .catch(err => console.error(err));

    prompt.message = '';

    if (!prompt.started) {
        prompt.start();
    }

    prompt.get(promptParams, function (err, result) {
        prompt.stop();
        if (err) {
            console.error(err);
            return;
        }

        if (/^\s*(yes|y)\s*$/.test(result.createNew)) {
            fs.readFile(path.resolve(__dirname, '../templates/weblee-config.json'), {encoding: 'utf8'})
                .then(function (configSrc) {
                    return fs.writeFile(path.resolve(process.cwd(), 'weblee-config.json'), configSrc)
                })
                .then(function () {
                    console.log('created new weblee-config.json file.');
                })
                .catch(err => console.error(err));
        }
    });
}
