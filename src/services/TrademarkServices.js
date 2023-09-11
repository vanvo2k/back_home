const TrademarkClient = require('tamz-trademark-worker/client');
const LoggerServices = require("./LoggerServices");

exports.checkManual = (item) => {
    const itemId = item.get('_id');
    const text = item.get('text');

    LoggerServices.log('CHECK_TM', itemId + ' - ' + text);

    const job = TrademarkClient.addToQueue({
        itemId,
        searchPhrase: text,
    }, 'critical');

    return Promise.resolve(job);
};