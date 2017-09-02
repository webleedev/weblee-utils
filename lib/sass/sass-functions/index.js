const fs = require('fs');
const path = require('path');

const _ = require('lodash');

const log = require('./logger');

const global = {_json: {}};

class SassFunctionLib {

    /**
     *
     * @param {Object} [options]
     */
    constructor(options) {
        let self = this;

        this.config = Object.assign({}, options);

        this.resetCache();

        this.functions = {

            "jsonStore($key, $value)": function ($key, $value) {
                var key = $key.getValue(),
                    value = $value;
                switch ($value.__proto__.constructor.name) {
                    case 'SassColor':
                        value = {
                            r: $value.getR(),
                            g: $value.getG(),
                            b: $value.getB(),
                            a: $value.getA()
                        };
                        break;
                    default:
                        value = $value.getValue();
                }
                _.set(global._json, key, value);
                return $value;
            },

            "jsonWrite($writePath)": function ($writePath) {
                const baseWritePath = path.parse(this.options.file).dir,
                    relWritePath = $writePath.getValue();

                try {
                    fs.writeFileSync(path.join(baseWritePath, relWritePath), JSON.stringify(global._json));
                } catch (err) {
                    console.error(err);
                }
                return $writePath;
            },

            "log($data)": function (data) {
                log('\nlog: "%s"', data.getValue());
                return data;
            }
        };
    }
}

module.exports = new SassFunctionLib();
