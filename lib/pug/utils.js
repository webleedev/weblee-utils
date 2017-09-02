const path = require('path');

const _ = require('lodash');

class PugUtils {

    /**
     *
     * @description matches filenames that end with either pug or jade
     * @param filename
     * @param fileList
     */
    static findFile(filename, fileList) {
        const fileMatchRegex = new RegExp(`${path.sep}${filename}(.pug|.jade)?$`);

        return _.find(fileList, function (filePath) {
            return filePath.match(fileMatchRegex);
        });
    }
}

module.exports = PugUtils;
