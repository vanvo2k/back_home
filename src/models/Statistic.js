const conn = require('../app.database');
const {Statistic} = require('tamz-schemas-database/schemas');

module.exports = conn.model('Statistic', Statistic);