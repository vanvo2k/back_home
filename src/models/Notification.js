const conn = require('../app.database');
const {Notification} = require('tamz-schemas-database/schemas');

module.exports = conn.model('Notification', Notification, 'notifications');
