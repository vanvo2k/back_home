const conn = require('../app.database');
const {Setting} = require('tamz-schemas-database/schemas');

Setting.methods.toJSON = function () {
    const object = this.toObject();

    delete object.permissions;
    delete object.created;

    return object;
};

module.exports = conn.model('Setting', Setting);