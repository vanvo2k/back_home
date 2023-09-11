const elasticSearch = require('elasticsearch');

module.exports = (uri = '') => {
    return new elasticSearch.Client({
        host: uri || 'http://157.230.56.93:9200'
    });
};