const conn = require('../app.database');
const {BlockedEvent} = require('tamz-schemas-database/schemas');

module.exports = conn.model('BlockedEvent', BlockedEvent);