const fs = require('fs');
const path = require('path');

const _ = require('lodash');

const Utils = require('../utils');

const cache = {};

function generateKey(prop) {
    return stripNonChars(prop['val']);
}

function stripNonChars(str) {
    return str.replace(/\W+/g, '');
}

function toLowerCase(str) {
    str['val'] = str['val'].toLowerCase();
    return str;
}


function cacheSave(prop, val) {
    const propKey = generateKey(prop);

    debugLog('cacheSave(%j)  @ \'%s\'', arguments, propKey);
    if (propKey) {
        cache[propKey] = val;
    }

    return val;
}

function cacheLoad(prop) {
    const propKey = generateKey(prop);

    debugLog('cacheLoad(%j) @ \'%s\'', arguments, propKey);
    if (propKey) {
        return cache[propKey];
    }

    return null;
}

function debugLog() {
    const logArgs = Array.prototype.slice.call(arguments).map(function (val, index) {
        return val['string'] || val
    });
    console.log.apply(console, logArgs);
    return arguments[0];
}

function dumpObj(arg1) {
    console.log.apply(console, ['dump: %s', Utils.dump(arg1)]);
    return arg1;
}

function extendProps(arg1, arg2) {
    const args = [{}].concat(arguments);
    const extendArgs = args.map(function (arg) {
        return arg.vals || {};
    });

    arg1.vals = Object.assign({}, ...extendArgs);

    return arg1;
}

function defaults(arg1, arg2) {
    const args = [{}].concat(arguments);
    const defaultsArgs = args.map(function (arg) {
        return arg.vals || {};
    });

    arg1.vals = Object.assign({}, ...defaultsArgs);

    return arg1;
}

function getStylusVal(obj) {
    if (obj.val) {
        return obj.val;
    }

    if (obj.vals) {
        return Object.keys(obj.vals).reduce(function (collection, propName) {
            collection[propName] = this.getStylusVal(obj.vals[propName]);
            return collection;
        }, {});
    }

    if (obj.nodes && obj.nodes[0]) {
        return getStylusVal(obj.nodes[0]);
    }
}

function writeJSON(writePath, data) {
    const dir = path.parse(writePath.filename).dir;
    const absWritePath = writePath.val.match(/^\./) ? path.join(dir, writePath.val) : writePath.val;
    const jsonData = getStylusVal(data);

    fs.writeFileSync(absWritePath, JSON.stringify(jsonData));
}

module.exports = function (style) {
    style.define('cacheSave', cacheSave);
    style.define('debugLog', debugLog);
    style.define('extendProps', extendProps);
    style.define('defaults', defaults);
    style.define('dumpObj', dumpObj);
    style.define('logger', debugLog);
    style.define('cacheLoad', cacheLoad);
    style.define('writeJSON', writeJSON);
    style.define('toLowerCase', toLowerCase);
};
