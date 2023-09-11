const conn = require('../app.database');
const {NicheEvent} = require('tamz-schemas-database/schemas');

module.exports = conn.model('NicheEvent', NicheEvent);