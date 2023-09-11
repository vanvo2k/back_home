const uuid = require('uuid/v4');

const _client = require('../connections/elasticsearch')

const indexing = {
    index: 'spyamz_logging',
    type: 'events'
};

const _log = (args) => {
    const body = Object.assign({}, args, {
        created: new Date()
    });

    return _client.create({
        index: indexing.index,
        type: indexing.type,
        id: uuid(),
        body
    });
};

exports.info = ({owner = '', event = '', data = {}, app = '', IP = '', store = true, section=''}) => {
    console.log(`Event ${event} of ${owner} with data ${JSON.stringify(data)}`);

    const appVersion = app || data.app || '';
    const userIP = IP || data.IP || '';

    if (!store) {
        return;
    }

    _log({
        IP: userIP,
        app: appVersion,
        owner,
        event,
        section,
        data: JSON.stringify(data)
    });
};