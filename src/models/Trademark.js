const MongoosePaginate = require('mongoose-paginate');
const conn = require('../app.database');
const {Trademark} = require('tamz-schemas-database/schemas');

Trademark.plugin(MongoosePaginate);

Trademark.methods.toJSON = function () {
    const object = this.toObject();
    const results = object.results || [];

    const resultComputed = results.map(result => {
        const serialNumber = result.serialNumber || null;

        if (serialNumber) {
            return Object.assign({}, result, {
                url: `http://tsdr.uspto.gov/#caseNumber=${serialNumber}&caseType=SERIAL_NO&searchType=statusSearch`
            });
        }

        return result;
    });

    return Object.assign({}, object, {
        results: resultComputed
    });
};

module.exports = conn.model('Trademark', Trademark);