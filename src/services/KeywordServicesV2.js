const moment = require('moment');
const appConfig = require('../app.config');

const {index, type} = appConfig.get('/keywordsIndexing');
const client = require('../connections/elasticsearch')

const _tokenizeText = (text) => {
    return client.indices.analyze({
        index,
        body: {
            text
        }
    }).then(response => {
        const {tokens} = response;
        if (!tokens || !tokens.length) {
            return Promise.resolve([]);
        }

        const strToken = tokens.map(item => {
            return item['token'] || '';
        }).filter(token => {
            return !!token;
        });

        return Promise.resolve(strToken);
    });
};

const _getQuerySameOrder = (term, field) => {
    if (!term || typeof term !== 'string') {
        return Promise.resolve(false);
    }

    return _tokenizeText(term)
        .then(tokens => {
            if (!tokens.length) {
                return Promise.resolve(false);
            }

            const clauses = tokens.map(token => {
                return {
                    span_term: {
                        [field]: token
                    }
                };
            });

            const query = {
                span_near: {
                    clauses,
                    slop: 20,
                    in_order: true
                }
            };

            return Promise.resolve(query);
        });
};

exports.getOptions = () => {
    return Promise.resolve({
        maxRank: [
            100000,
            200000,
            350000,
            500000
        ],
        count: [
            4,
            3,
            2,
            1
        ]
    });
};

const _mapRankToText = (rank) => {
    const maps = {
        100000: '100k',
        200000: '200k',
        350000: '350k',
        500000: '500k',
    };

    return maps[rank] || '100k';
};

exports.getKeywords = ({term = '', date, maxRank, length, page = 1, limit = 10}) => {
    const lengthValidated = parseInt(length, 10);
    const dateString = moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD');

    const rankText = _mapRankToText(maxRank);
    const from = (page - 1) * limit;

    const query = {
        "bool": {
            "must": [
                {
                    "term": {
                        "gram": lengthValidated
                    }
                },
                {
                    "term": {
                        "date": {
                            "value": dateString
                        }
                    }
                },
                {
                    "exists": {
                        "field": rankText
                    }
                }
            ]
        }
    };


    return _getQuerySameOrder(term, 'words')
        .then(_querySameOrder => {
            if (_querySameOrder) {
                query.bool.must = [].concat(query.bool.must, _querySameOrder);
            }

            return client.search({
                index,
                type,
                body: {
                    size: limit,
                    from,
                    sort: [
                        {
                            [rankText]: {
                                "order": "desc"
                            }
                        }
                    ],
                    query
                }
            });
        })
        .then(result => {
            const {hits} = result;
            const {total} = hits;
            const items = hits['hits'];

            const docs = items.map((item) => {
                const {_source} = item;

                return {
                    word: _source['words'],
                    count: _source[rankText]
                };
            });

            const totalPage = Math.ceil(total / limit) || 1;

            return Promise.resolve({
                docs,
                page,
                pages: totalPage,
                limit,
                total,
                length: lengthValidated,
            });
        });
};