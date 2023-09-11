const createConnection = require('./libs/createConnection');
const appConfig = require('./app.config');

const app = createConnection({
    uri: appConfig.get('/mongodb')
});

module.exports = app;