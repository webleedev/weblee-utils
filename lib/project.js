const path = require('path');

const config = require('../config');
const Task = require('./task');

class Project {

    constructor(options) {
        const defaults = {};
        this.options = Object.assign({}, defaults, options);
        this.tasks = config.raw.tasks.reduce((tasksCollection, taskData) => {
            const input = taskData.input || '';
            const output  = taskData.output ? path.join(config.paths.workingDir, taskData.output) : false;
            const taskMeta = {
                input: path.join(config.paths.workingDir, input),
                output,
                options: Object.assign({}, taskData.options, {
                    unfiltered: {
                        input,
                        output
                    }
                })
            };

            tasksCollection[taskData.name] = tasksCollection[taskData.name] || [];

            tasksCollection[taskData.name].push(taskMeta);

            return tasksCollection;
        }, {});
    }

    getModule(taskName) {
        let moduleName;

        switch (taskName) {
            case 'css':
                moduleName = 'css/cssnano';
                break;
            case 'jsx':
            case 'babel':
                moduleName = 'babel/jsx';
                break;
            case 'beautify-js':
            case 'js-beautify':
            case 'js':
                moduleName = 'js/beautify';
                break;
            case 'js-bundle':
            case 'build-rjs':
            case 'requirejs':
            case 'rjs':
                moduleName = 'js/rjs';
                break;
            case 'js-webpack':
            case 'build-webpack':
            case 'webpack':
                moduleName = 'js/webpack';
                break;
            case 'stylus':
            case 'stylus-bem':
                moduleName = 'stylus/compile';
                break;
            case 'less':
                moduleName = 'less/compile';
                break;
            case 'sass':
                moduleName = 'sass/compile';
                break;
            case 'compass':
                moduleName = 'sass/compass';
                break;
            case 'jade':
            case 'pug':
            case 'pug-php':
            case 'pug-ejs':
            case 'pug-html':
                moduleName = 'pug/compile';
                break;
            case 'jade-beautify':
            case 'pug-beautify':
                moduleName = 'pug/beautify';
                break;
            case 'php2pug':
                moduleName = 'pug/php2pug';
                break;
            case 'pug2stylus':
                moduleName = 'pug/pug2stylus';
                break;
            case 'wordpress':
                moduleName = 'extra/wordpress';
                break;
            case 'avocode':
                moduleName = 'extra/avocode';
                break;
            default:
                moduleName = taskName;
        }

        return require(`./${moduleName}`);
    }

    getTasks(taskName) {
        const tasks = this.tasks[taskName] || [];
        const Task = this.getModule(taskName);
        return tasks.map(taskMeta => new Task(taskMeta));
    }

    exec(taskName) {
        const tasks = this.getTasks(taskName);

        if (tasks.length === 0) {
            return Promise.reject(`${taskName}: not found in weblee.config`)
        }

        return Promise.all(tasks.map((task, idx) => {
                const timeRef = `${taskName}(${idx}) time elapsed`;
				console.time(timeRef);
				return task.run().then(() => console.timeEnd(timeRef));
            }))
    }
}


module.exports = Project;
