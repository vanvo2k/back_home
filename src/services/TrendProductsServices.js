const appConfig = require('../app.config');
const client = require('../connections/elasticsearch')
const moment = require('moment');

let indexing = appConfig.get('/trendsIndexing');

exports.getTrendItems = ({page, limit, minRank = 1}) => {
    const from = (page - 1) * limit;
    const twoDaysAgo = moment().subtract(2, "d").format('DD/MM/YYYY');

    if ((page * limit) > 10000) {
        return Promise.resolve({
            total: 0,
            items: []
        });
    }

    return client.search({
        index: indexing.index,
        type: indexing.type,
        body: {
            size: limit,
            from,
            sort: [
                {
                    rank: {
                        order: "asc"
                    }
                },
                {
                    available: {
                        "order": "desc"
                    }
                }
            ],
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                alive: {
                                    value: true
                                }
                            }
                        },
                        {
                            range: {
                                rank: {
                                    gt: 0,
                                    lte: 1000000
                                }
                            }
                        },
                        {
                            range: {
                                available: {
                                    gte: twoDaysAgo,
                                    format: "dd/MM/yyyy"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }).then(result => {
        const {hits} = result;
        const {total} = hits;
        const items = hits['hits'];

        const ids = items.map((item) => {
            return item._id;
        });

        return Promise.resolve({
            total,
            items: ids
        });
    });
};
