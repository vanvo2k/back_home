const logger = require('fluent-logger')
const cmdLogger = require('../helpers/logger')

logger.configure('applog', {
    host: 'localhost',
    port: 24224,
    timeout: 3.0,
    reconnectInterval: 600000 // 10 minutes
});

logger.on('error', (error) => {
    cmdLogger.error(error);
});
logger.on('connect', () => {
    cmdLogger.info('fluentd connected!');
});

exports.emitLog = (log) => {
    logger.emit('', log);
}
