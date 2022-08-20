const opts = {
    logDirectory: './logs',
    fileNamePattern: process.env.APP_NAME + '_<DATE>.log',
    dateFormat: 'YYYY_MM_DD'
};

const log = require('simple-node-logger').createRollingFileLogger(opts);

if (process.env.NODE_ENV == 'development') {
    log.setLevel('debug');
} else {
    log.setLevel('info');
}

var All = (text) => {
    log.all(text);
}

var Trace = (text) => {
    log.trace(text);
}

var Debug = (text) => {
    log.debug(text);
}

var Info = (text) => {
    log.info(text);
}

var Warn = (text) => {
    log.warn(text);
}

var Error = (text) => {
    log.error(text);
}

var Fatal = (text) => {
    log.fatal(text);
}

module.exports = {
    All: All,
    Trace: Trace,
    Debug: Debug,
    Info: Info,
    Warn: Warn,
    Error: Error,
    Fatal: Fatal
}
