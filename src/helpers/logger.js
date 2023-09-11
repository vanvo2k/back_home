'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const myFormat = printf(info => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
});

module.exports = createLogger({
    level: 'debug',
    format: combine(
        timestamp(),
        colorize(),
        myFormat,
    ),
    transports: [
        new transports.Console({}),
    ]
});
