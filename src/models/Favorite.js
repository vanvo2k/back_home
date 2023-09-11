const MongoosePaginate = require('mongoose-paginate');
const conn = require('../app.database');
const {Favorite} = require('tamz-schemas-database/schemas');

Favorite.plugin(MongoosePaginate);

module.exports = conn.model('Favorite', Favorite);