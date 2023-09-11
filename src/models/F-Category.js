const conn = require('../app.database');
const {FCategory} = require('tamz-schemas-database/schemas');

module.exports = conn.model('FCategory', FCategory);