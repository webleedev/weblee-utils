var history = [];

//process.stdin.resume();//so the program will not close instantly

function print() {
    if (history.length) console.log('\nlog:\n');
    for (var i = 0; i < history.length; i++) {
        if(typeof history[i][0] === 'string' || history[i][0] instanceof String) history[i][0] = "\n"+history[i][0];
        console.log.apply(null, history[i]);
    }
}

function onExec(options, err) {
    print();
    if (err) console.error(err.stack);
    if (options.exit) process.exit();
}

//when app is closing
process.on('exit', onExec.bind(null, {exit: true}));

//catches ctrl+c event
process.on('SIGINT', onExec.bind(null, {exit: true}));

//catches uncaught exceptions
process.on('uncaughtException', onExec);

module.exports = function () {
    if(history.length < 100){
        history.push(arguments);
    } else {
        history.pop();
        history.unshift(arguments);
    }
};
