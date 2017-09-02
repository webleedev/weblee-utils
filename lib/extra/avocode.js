const path = require('path');

const fs = require('mz/fs');
const prompt = require('prompt');

const AvocodeProjectToolkit = require('avocode-toolkit');

const config = require('../../config');
const Task = require('../task');

const defaultProjectName = config.avocode ? config.avocode.projectSelector : false;

class AvocodeTask extends Task {

    loadConfig (){

        return fs.readFile(path.join(process.cwd(), 'avocode.config.json'))
            .catch(() => '{}')
            .then(configText => {
                const defaultConfig = {
                    projectName: config.avocode ? config.avocode.projectSelector : null,
                    userName: config.avocode ? config.avocode.userSelector : null
                };
                const localConfig = JSON.parse(configText);

                this.options = Object.assign({}, defaultConfig, localConfig);
            })
    }

    autofill(){
        const avcdProjectParams = {userName: this.options['userName']};
        const avcdProject = new AvocodeProjectToolkit(this.options.projectName, avcdProjectParams);

        console.log('loading %s', this.options.projectName);

        return new Promise((resolve) => {
            avcdProject.autofill({
                done: (colors, fonts) => {
                    console.log('done loading %s', this.options.projectName);
                    resolve();
                }
            })
        })
    }

    /**
     *
     * @returns {Promise}
     */
    run() {
        const promptConfig = {
            userName: {
                properties: {
                    userName: {
                        'type': 'string',
                        'description': 'Avocode user full name:',
                        'required': false
                    }

                }
            },
            projectName: {
                properties: {
                    projectName: {
                        'type': 'string',
                        'description': 'AvocodeProject project name:',
                        'required': false,
                        'default': defaultProjectName
                    }
                }
            }
        };

        return this.loadConfig()
            .then(() => {
                return Promise.all(Object.keys(this.options).map(configPropName => {
                    if (!this.options[configPropName]) {
                        if (!prompt.started) {
                            prompt.start();
                        }

                        return new Promise((resolve, reject) => {
                            prompt.get(promptConfig[configPropName], (err, result) => {
                                err ? reject(err) : resolve(this.options[configPropName] = result[configPropName]);
                            });
                        })
                    }

                    return Promise.resolve();
                }))
            })
            .then(() => !prompt.started ? prompt.stop() : null)
            .then(() => this.autofill());
    }
}

module.exports = AvocodeTask;