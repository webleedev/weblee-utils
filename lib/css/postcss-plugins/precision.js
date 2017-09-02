const postcss = require('postcss');

module.exports =  postcss.plugin('postcss-precision', function () {
    const longTest = /(\d+?\.\d{3,})(%|em|px)/i;

    return function (style) {
        style.walkDecls(function (decl) {

            if (decl.value && longTest.test(decl.value)) {
                // Grab array of matches.
                const matches = longTest.exec(decl.value);

                // We'll assume there's one.
                const value = matches[1];

                // Round two decimal places.
                // var rounded = _.round(parseFloat(value), 2 );
                const rounded = Math.round(parseFloat(value) * 100) / 100;

                // Change the value in the tree.
                decl.value = decl.value.replace(value, rounded.toString());
            }
        });
    };
});
