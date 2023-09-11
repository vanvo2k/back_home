const client = require('../connections/elasticsearch')
const appConfig = require('../app.config');
const LoggerServices = require("./LoggerServices");
let indexing = appConfig.get('/elasticIndexing');

exports.getItemsRandom = ({minRank, maxRank, minTrending, maxTrending, sortBy, order, limit = 10}) => {
    LoggerServices.log('GET_RANDOM', JSON.stringify({
        minRank,
        maxRank,
        minTrending,
        maxTrending,
        sortBy,
        order,
        limit
    }));


    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: limit,
                sort: [
                    {
                        [sortBy]: {
                            "order": order
                        }
                    }
                ],
                query: {
                    bool: {
                        must: [
                            {
                                "term": {
                                    "alive": true
                                }
                            },
                            {
                                "term": {
                                    "category.keyword": 'clothing'
                                }
                            },
                            {
                                "range": {
                                    "rank": {
                                        "gte": minRank,
                                        "lte": maxRank
                                    }
                                }
                            },
                            {
                                "range": {
                                    "trending": {
                                        "gte": minTrending,
                                        "lte": maxTrending,
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }).then(result => {
            const {hits} = result;
            const items = hits['hits'];

            const ids = items.map((item) => item._id);
            return Promise.resolve(ids);
        });
};

exports.getItemsTopRising = ({maxRank = 100000, minRank = 1, minTrending = 90, limit = 10}) => {
    const maxRankValidated = maxRank > minRank ? maxRank : (minRank + 500000);

    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: limit,
                sort: [
                    {
                        trending: {
                            "order": "desc"
                        }
                    }
                ],
                query: {
                    bool: {
                        must: [
                            {
                                "term": {
                                    "alive": true
                                }
                            },
                            {
                                "term": {
                                    "category.keyword": 'clothing'
                                }
                            },
                            {
                                "range": {
                                    "rank": {
                                        "gte": minRank,
                                        "lte": maxRankValidated
                                    }
                                }
                            },
                            {
                                "range": {
                                    "trending": {
                                        "gte": minTrending
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }).then(result => {
            const {hits} = result;
            const items = hits['hits'];

            const ids = items.map((item) => item._id);
            return Promise.resolve(ids);
        });
};

exports.getItemsBestSellerRank = ({maxRank = null, limit = 10}) => {
    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: limit,
                sort: [
                    {
                        ranked: {
                            "order": "desc"
                        }
                    }
                ],
                query: {
                    bool: {
                        must: [
                            {
                                "term": {
                                    "category.keyword": 'clothing'
                                }
                            },
                            {
                                "term": {
                                    "alive": true
                                }
                            },
                            {
                                "range": {
                                    "rank": {
                                        "lte": maxRank,
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }).then(result => {
            const {hits} = result;
            const items = hits['hits'];

            const ids = items.map((item) => item._id);
            return Promise.resolve(ids);
        });
};

exports.getItemsAvailableStatistic = (from) => {
    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: 0,
                query: {
                    range: {
                        available: {
                            gte: from
                        }
                    }
                },
                aggs: {
                    available: {
                        date_histogram: {
                            field: "available",
                            interval: "1d",
                            format: "dd-MM-yyyy"
                        }
                    }
                }
            }
        })
        .then(result => {
            const {aggregations} = result;
            const {available} = aggregations;
            const {buckets} = available;

            const statistic = buckets.map(bucket => {
                return {
                    count: bucket.doc_count,
                    date: bucket.key_as_string
                }
            });

            return Promise.resolve(statistic);
        });
};

exports.getItemsHasRankStatistic = (from) => {
    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: 0,
                query: {
                    bool: {
                        filter: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            available: {
                                                gte: from
                                            }
                                        }
                                    },
                                    {
                                        range: {
                                            ranked: {
                                                gt: 0
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                aggs: {
                    available: {
                        date_histogram: {
                            field: "available",
                            interval: "1d",
                            format: "dd-MM-yyyy"
                        }
                    }
                }
            }
        })
        .then(result => {
            const {aggregations} = result;
            const {available} = aggregations;
            const {buckets} = available;

            const statistic = buckets.map(bucket => {
                return {
                    count: bucket.doc_count,
                    date: bucket.key_as_string
                }
            });

            return Promise.resolve(statistic);
        });
};

const _getTotalItemsByFieldDate = (filedName, dateString, format = 'dd-MM-yyyy') => {
    return client.count({
        index: indexing.index,
        type: indexing.type,
        body: {
            "query": {
                "range": {
                    [filedName]: {
                        "gte": dateString,
                        "lte": dateString,
                        "format": format
                    }
                }
            }
        }
    }).then(result => {
        const {count} = result;

        return Promise.resolve(count);
    });
};

exports.getTotalItems = () => {
    return client
        .count({
            index: indexing.index,
            type: indexing.type,
        })
        .then(result => {
            const {count} = result;

            return Promise.resolve(count);
        });
};

exports.getTotalItemsAlive = () => {
    return client.count({
        index: indexing.index,
        type: indexing.type,
        body: {
            query: {
                term: {
                    alive: true
                }
            }
        }
    }).then(result => {
        const {count} = result;

        return Promise.resolve(count);
    });
};

exports.getTotalItemsHasRankAllTime = () => {
    return client
        .count({
            index: indexing.index,
            type: indexing.type,
            body: {
                query: {
                    bool: {
                        filter: {
                            bool: {
                                must: [
                                    {
                                        term: {
                                            alive: true
                                        }
                                    },
                                    {
                                        range: {
                                            ranked: {
                                                gt: 0
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        })
        .then(result => {
            const {count} = result;

            return Promise.resolve(count);
        });
};

exports.getTotalItemsWasUpdated = (dateString, format = 'dd-MM-yyyy') => {
    return _getTotalItemsByFieldDate('updated', dateString, format);
};

exports.getTotalItemsWasCrawled = (dateString, format = 'dd-MM-yyyy') => {
    return _getTotalItemsByFieldDate('crawled', dateString, format);
};

exports.getTotalItemsAvailable = (dateString, format = 'dd-MM-yyyy') => {
    return _getTotalItemsByFieldDate('available', dateString, format);
};

exports.getTotalItemsHasRankByDate = (dateString, format = 'dd-MM-yyyy') => {
    return client
        .count({
            index: indexing.index,
            type: indexing.type,
            body: {
                query: {
                    bool: {
                        filter: {
                            bool: {
                                must: [
                                    {
                                        range: {
                                            available: {
                                                "gte": dateString,
                                                "lte": dateString,
                                                "format": format
                                            }
                                        }
                                    },
                                    {
                                        range: {
                                            ranked: {
                                                gt: 0
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        })
        .then(result => {
            const {count} = result;

            return Promise.resolve(count);
        });
};

exports.getTotalItemsWasDeleted = (dateString, format = 'dd-MM-yyyy') => {
    return _getTotalItemsByFieldDate('deleted_at', dateString, format);
};

exports.getRangeRankStatistic = () => {
    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: 0,
                query: {
                    term: {
                        alive: true
                    }
                },
                aggs: {
                    rank_ranges: {
                        range: {
                            field: "rank",
                            ranges: [
                                {from: 1, to: 100000},
                                {from: 100000, to: 200000},
                                {from: 200000, to: 500000},
                                {from: 500000, to: 1000000},
                                {from: 1000000}
                            ],
                        }
                    }
                }
            }
        })
        .then((result) => {
            const {aggregations, hits} = result;
            let {total} = hits;

            const {rank_ranges} = aggregations;
            const {buckets} = rank_ranges;

            let totalRank = 0;
            const statistic = buckets.map(bucket => {
                totalRank += parseInt(bucket.doc_count, 10);

                return {
                    from: bucket.from || 0,
                    count: bucket.doc_count,
                    to: bucket.to
                };
            });

            if (!statistic || !statistic.length) {
                return Promise.resolve({
                    total,
                    ranges: []
                });
            }


            const statisticComputed = [].concat(statistic, {
                noRank: true,
                from: 0,
                to: 0,
                count: total - totalRank
            });

            return Promise.resolve({
                total,
                ranges: statisticComputed
            });
        });
};

exports.getItemTypesStatistic = () => {
    return client
        .search({
            index: indexing.index,
            type: indexing.type,
            body: {
                size: 0,
                query: {
                    term: {
                        alive: true
                    }
                },
                aggs: {
                    item_types: {
                        terms: {
                            field: "type.keyword"
                        }
                    }
                }
            }
        })
        .then((result) => {
            const {aggregations, hits} = result;
            let {total} = hits;

            const {item_types} = aggregations;
            const {buckets} = item_types;

            const statistic = buckets.map(bucket => {
                return {
                    key: bucket.key,
                    count: bucket.doc_count,
                };
            });


            return Promise.resolve({
                total,
                statistic
            });
        });
};