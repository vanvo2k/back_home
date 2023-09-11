const conn = require('../app.database');

const {Session} = require('tamz-schemas-database/schemas');

Session.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.refreshToken;

    return obj;
};

module.exports = conn.model('Session', Session);