const MongoosePaginate = require('mongoose-paginate');
const conn = require('../app.database');
const {Item} = require('tamz-schemas-database/schemas');

Item.plugin(MongoosePaginate);

module.exports = conn.model('Item', Item, 'items');
