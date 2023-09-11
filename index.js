require('dotenv').config();

/**
 * Run app
 */
require('./src/app');

/**
 * Emit running log
 */
const fluentd = require('./src/helpers/fluentd')
const uuid = require('uuid/v4')
const workerID = uuid()

setInterval(() => {
    fluentd.emitLog({
        event_type: 'info',
        '@timestamp': (new Date()).toISOString(),
        worker_id: workerID,
        app_name: 'spyamz-backend-services',
        event: 'service_is_running'
    })
}, 60 * 1000)
