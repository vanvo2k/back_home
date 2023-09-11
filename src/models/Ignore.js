const MongoosePaginate = require('mongoose-paginate');
const conn = require('../app.database');
const {Ignore} = require('tamz-schemas-database/schemas');

Ignore.plugin(MongoosePaginate);

module.exports = conn.model('Ignore', Ignore);