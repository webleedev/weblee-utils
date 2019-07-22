const path = require('path');
const fs = require('fs');

const utils = require('./lib/utils');

const rootDirectory = utils.getPackageJSONDir();
const jsonConfig = (function getProjectConfig() {
    const projectConfigNames = [
        'weblee.config.json',
        'weblee-config.json'
    ];

    try {
        const projectRootFiles = fs.readdirSync(rootDirectory);
        const projectConfigName = projectRootFiles.find(filename => {
            return projectConfigNames.includes(filename);
        });

        if (!projectConfigName) {
            throw new Error(`Could not find a valid weblee-utils config file (${projectConfigNames.join('|')}) in path '${rootDirectory}'`);
        }

        return JSON.parse(fs.readFileSync(path.resolve(rootDirectory, projectConfigName), 'utf8'));

    } catch (err) {
        console.error(err);
        return {tasks: []};
    }
})();
const avocodeDefaults = {
    userSelector: null,
    projectSelector: 'boilerplate'
};
const avocodeConfig = Object.assign({}, avocodeDefaults,jsonConfig.avocode);
const wordpressConfig = Object.assign({}, jsonConfig.wordpress);
const projectName = jsonConfig.name || 'boilerplate';
const paths = {
    rootDir: rootDirectory,
    tmpDir: jsonConfig.tmp || path.resolve(rootDirectory, 'tmp/')
};

switch (jsonConfig.workingDir) {
    case 'default':
        paths.workingDir = rootDirectory;
        break;
    case 'wordpress':
        const themeDir = jsonConfig.wordpress && jsonConfig.wordpress.themeDir;
        paths.workingDir = path.join(rootDirectory, `wp-content/themes/${themeDir || projectName}/`);
        break;
    default:
        paths.workingDir = path.normalize(jsonConfig.workingDir || rootDirectory);
}

module.exports = {
    raw: jsonConfig,
    wordpress: wordpressConfig,
    avocode: avocodeConfig,
    projectName,
    paths
};
