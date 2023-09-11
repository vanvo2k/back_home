const conn = require('../app.database');
const {AffiliateUser} = require('tamz-schemas-database/schemas');

module.exports = conn.model('AffiliateUser', AffiliateUser);