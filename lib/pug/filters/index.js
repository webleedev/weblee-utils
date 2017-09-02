module.exports = {
    php : require('pug-php-filter'),
    ejs : function (text) {
        return '<% ' + text + ' %>';
    }
};