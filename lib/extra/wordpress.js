const path = require('path');

const fs = require('fs-extra');
const request = require('superagent');
const prompt = require('prompt');
const debug = require('debug');
const colors = require('colors/safe');

const config = require('../../config');
const Task = require('../task');
const Utils = require('../utils');

const log = debug('weblee-utils:extra:wordpress');

class WordPressTask extends Task {

    constructor(...args) {
        const defaults = {
            dbNamePrefix: 'boilerplate_',
            dbTablePrefix: 'boilerplate',
            themeNamePrefix: '',
            theme: {}
        };
        super(...args);

        this.options = Object.assign({}, defaults, this.options);
        this.options.theme.path = path.join(config.paths.rootDir, `wp-content/themes/${this.options.themeNamePrefix}${config.projectName}`);

        this.submodules = [];
    }

    updateGitSubmodules() {
        return fs.readFile(path.resolve(config.paths.rootDir, '.gitmodules'), 'utf8')
            .then(content => {
                const submoduleContentPathRegex = /path\s=\s([^\s]+)\n/g;
                const submoduleLinePathRegex = /path\s=\s([^\s]+)\n/;

                this.submodules = content.match(submoduleContentPathRegex).map(str => {
                    return path.resolve(config.paths.rootDir, submoduleLinePathRegex.exec(str)[1]);
                });

                return this.submodules.reduce((chain, submodulePath) => {
                    const newSubmodulePath = submodulePath.replace(this.options.originalThemeName, path.parse(config.paths.workingDir).base);
                    const gitCommand = `git mv ${submodulePath} ${newSubmodulePath}`;

                    if (submodulePath !== newSubmodulePath) {
                        log(`ignoring move of git submodule ${newSubmodulePath}`);
                        return Promise.resolve();
                    }

                    log("executing '%s'", gitCommand);

                    return Utils.execute(gitCommand);
                }, Promise.resolve())
            })
            .catch(err => console.warn('failed to initialize git submodules'))
    }

    getCurrentThemePath() {
        const promptParams = {
            properties: {
                isDPTheme: {
                    description: colors.red('Is this a dp theme? (yes or no)'),
                    default: this.options.theme.path.match(/^dp-/i) ? 'yes' : 'no'
                },
                originalProjectName: {
                    description: colors.red('What is the original project name?'),
                    default: config.projectName
                }
            }
        };

        prompt.message = '';

        return Promise.resolve(prompt.start())
            .then(() => {
                return new Promise((resolve, reject) => {
                    prompt.get(promptParams, (err, result) => {
                        prompt.stop();
                        err ? reject(er) : resolve(result);
                    });

                })
            })
            .then(result => {
                this.options.originalProjectName = result.originalProjectName;

                if (/^\s*(yes|y)\s*$/.test(result.isDPTheme)) {
                    this.options.originalThemeName = this.options.themeNamePrefix + this.options.originalProjectName;
                } else {
                    this.options.originalThemeName = this.options.originalProjectName;
                }
            });
    }

    createNewTheme() {
        const copyParams = {
            preserveTimestamps: true,
            filter: (filePath) => {
                const isSubmodule = (this.submodules.indexOf(filePath) > -1);
                // if (isSubmodule) console.log('skipping copy of %s', filePath);
                return !isSubmodule; // ignore git submodules
            }
        };
        const srcDir = path.join(this.options.theme.path, `../${this.options.originalThemeName}`);
        const destDir = this.options.theme.path;

        log('found git submodules: %s', Utils.dump(this.submodules));

        return fs.copy(srcDir, destDir, copyParams)
            .catch(err => log(`failed to create new theme folder...\n${Utils.dump(err)}`) && Promise.reject(err));
    }


    buildWpConfig() {
        const databaseRegex = /database_name_here/;
        const saltRegex = /\/\/SALT_KEYS_HERE/;
        const tablePrefixRegex = /prefix_/;
        const wpConfigPath = path.resolve(config.paths.rootDir, 'wp-config.php');

        return fs.readFile(wpConfigPath, 'utf8')
            .then(wpConfigContent => {
                wpConfigContent = wpConfigContent.replace(databaseRegex, this.options.dbNamePrefix + config.projectName.toLocaleLowerCase());

                wpConfigContent = wpConfigContent.replace(tablePrefixRegex, this.options.dbTablePrefix + '_');

                return request.get('https://api.wordpress.org/secret-key/1.1/salt/')
                    .then(response => fs.writeFile(wpConfigPath, wpConfigContent.replace(saltRegex, response.text)))
                    .then(() => log('successfully updated %s', wpConfigPath));
            });
    }

    /**
     *
     * @description changes all instances of boilerplate to projectName
     * @param {Object} [options]
     * @param {RegExp} [options.defaultProjectNamespaceRegex=/boilerplate/gi]
     * @returns {Promise.<Object[]>} - an array containing each file result
     */
    updateReferences(options) {
        const defaults = {
            defaultProjectNamespaceRegex: /boilerplate/gi
        };
        const opts = Object.assign({}, options, defaults);
        const themeFilesGlobRegex = path.join(config.paths.workingDir, '/**/*');

        return Utils.findFiles(themeFilesGlobRegex)
            .then(files => {
                return Promise.all(files.map(filePath => {
                    return fs.readFile(filePath)
                        .then(data => {
                            const fileContent = String(data);
                            if (opts.defaultProjectNamespaceRegex.test(fileContent)) {
                                return fs.writeFile(filePath, fileContent.replace(opts.defaultProjectNamespaceRegex, config.projectName))
                            }
                        })
                        .then(() => {
                            console.log('updated %s', filePath);
                            return {result: 'success'}
                        })
                        .catch(err => {
                            console.error(err);
                            return {result: err}
                        });
                }))
            })
    }

    /**
     * @description makes copy of a WordPress theme with tailored files
     * @returns {Promise}
     */
    run() {
        const projectDefaults = {
            originalProjectName: 'boilerplate',
            originalThemeName: 'dp-boilerplate'
        };

        this.options = Object.assign({}, projectDefaults, this.options);

        return this.updateGitSubmodules()
            .then(() => this.getCurrentThemePath())
            .then(() => this.createNewTheme())
            .then(() => log('successfully created theme folder...'))
            .then(() => this.updateReferences({defaultProjectNamespaceRegex: new RegExp(this.options.originalProjectName, 'ig')}))
            .then(() => this.buildWpConfig())
            .catch(err => console.error(err))
    }
}

module.exports = WordPressTask;