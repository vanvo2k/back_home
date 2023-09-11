const appConfig = require('../app.config');
const createNatsClient = require('../libs/createNatsClient');
const natsConfig = appConfig.get('/nats');

const prefix = process.env.NODE_ENV === 'staging' ? 'spyamz_dev' : 'spyamz';

const nats = createNatsClient(natsConfig);

exports.transporter = nats;

exports.PREFIX = prefix;