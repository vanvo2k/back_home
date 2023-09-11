const createClient = require('../libs/createElasticSearch')
const appConfig = require('../app.config');
const elasticSearchHost = appConfig.get('/elasticSearch');

const client = createClient(elasticSearchHost)

module.exports = client