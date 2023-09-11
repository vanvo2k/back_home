const appConfig = require('../app.config');
const apiKey = appConfig.get('/tapfiliate/apiKey');
const request = require('request-promise');

const _createConversion = (args) => {
    const {
        visitor_id,
        external_id,
        amount,
        meta_data
    } = args;

    return request({
        uri: 'https://api.tapfiliate.com/1.6/conversions/?override_max_cookie_time=false',
        method: 'POST',
        headers: {
            'Api-Key': apiKey,
            'Content-Type': 'application/json'
        },
        body: {
            visitor_id,
            external_id,
            amount,
            meta_data
        },
        json: true
    });
};

exports.createConversion = _createConversion;