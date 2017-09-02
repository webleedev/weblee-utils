const path = require('path');
const fs = require('fs');

const rootDirectory = process.cwd();
const jsonConfig = (function () {
    try {
        return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'weblee-config.json')));
    } catch (err) {
        console.error(err);
        return {};
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