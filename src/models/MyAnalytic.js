const conn = require('../app.database');
const {MyAnalytic} = require('tamz-schemas-database/schemas');
const MongoosePaginate = require('mongoose-paginate');

MyAnalytic.plugin(MongoosePaginate);

module.exports = conn.model('MyAnalytic', MyAnalytic);