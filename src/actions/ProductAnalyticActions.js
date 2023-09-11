const elastic = require('../connections/elasticsearch')
const appConfig = require('../app.config')
let indexing = appConfig.get('/elasticIndexing')
const ElasticBuilderServices = require('../services/ElasticBuilderServices')

const _getStatsHasRankByKeyword = (keyword, searchType = '', market = 'us') => {
    return ElasticBuilderServices.getQuerySearchTerm({term: keyword, searchType, market})
        .then(mustQuery => {
            const must = [].concat(mustQuery, [
                {
                    range: {
                        rank: {
                            gt: 0
                        }
                    }
                },
                {
                    match: {
                        'category.keyword': 'clothing'
                    }
                },
            ])

            return elastic.search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    size: 0,
                    query: {
                        bool: {
                            must
                        }
                    },
                    aggs: {
                        status: {
                            terms: {
                                field: 'alive',
                                size: 2
                            }
                        },
                        rank: {
                            avg: {
                                field: 'rank'
                            }
                        },
                        trending: {
                            avg: {
                                field: 'trending'
                            }
                        },
                        trendStatus: {
                            range: {
                                field: 'trending',
                                ranges: [
                                    {
                                        from: 1,
                                    }
                                ]
                            }
                        },
                        rankMin: {
                            min: {
                                field: 'rank'
                            }
                        },
                        rankMax: {
                            max: {
                                field: 'rank'
                            }
                        }
                    }
                }
            })
        })
        .then(result => {
            const {aggregations, hits} = result
            const {total} = hits
            const {rank, trending, trendStatus, rankMax, rankMin, status} = aggregations
            const rankAvg = rank.value
            const trendAvg = trending.value

            const statusBuckets = status.buckets
            let countAlive = 0
            let countDead = 0
            statusBuckets.forEach(bucket => {
                if (bucket.key === 1) {
                    countAlive = bucket.doc_count
                    countDead = total - countAlive
                }
            })

            const trendStatusBuckets = trendStatus.buckets
            let trendUp = 0
            let trendDown = 0
            trendStatusBuckets.forEach(bucket => {
                if (bucket.from === 1) {
                    trendUp = bucket.doc_count
                    trendDown = total - trendUp
                }
            })

            let minRank = null
            let maxRank = null

            if (rankMax.value) {
                maxRank = rankMax.value
            }

            if (rankMin.value) {
                minRank = rankMin.value
            }

            return {
                rankAvg: rankAvg ? parseInt(rankAvg, 10) : null,
                trendAvg: trendAvg ? parseFloat(trendAvg).toFixed(2) : null,
                trending: {
                    up: trendUp,
                    down: trendDown
                },
                minRank,
                maxRank,
                statusHasRank: {
                    alive: countAlive,
                    dead: countDead
                }
            }
        })
}

const _statsByKeyword = (keyword, searchType = '', market = 'us') => {
    return ElasticBuilderServices.getQuerySearchTerm({term: keyword, searchType, market})
        .then(mustQuery => {
            const must = [].concat(mustQuery, {
                match: {
                    'category.keyword': 'clothing'
                }
            })

            return elastic.search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    size: 0,
                    query: {
                        bool: {
                            must
                        }
                    },
                    aggs: {
                        status: {
                            terms: {
                                field: 'alive',
                                size: 2
                            }
                        },
                        rank: {
                            range: {
                                field: 'rank',
                                ranges: [
                                    {from: 1}
                                ]
                            }
                        }
                    }
                }
            })
        })
        .then(result => {
            const {aggregations, hits} = result
            const {total} = hits

            const statusBuckets = aggregations.status.buckets
            let aliveCount = 0
            let deadCount = 0
            statusBuckets.forEach(bucket => {
                if (bucket.key_as_string === 'true') {
                    aliveCount = bucket.doc_count
                }

                if (bucket.key_as_string === 'false') {
                    deadCount = bucket.doc_count
                }
            })

            const rankBuckets = aggregations.rank.buckets
            let totalHasRank = 0
            rankBuckets.forEach(bucket => {
                if (bucket.from === 1) {
                    totalHasRank = bucket.doc_count ? parseInt(bucket.doc_count, 10) : 0
                }
            })

            const totalNoRank = total - totalHasRank

            return {
                total,
                status: {
                    alive: aliveCount,
                    dead: deadCount
                },
                rank: {
                    has: totalHasRank,
                    no: totalNoRank
                }
            }
        })
}

const _getTotalHasRankLessThan500k = (keyword, searchType = '', market = 'us') => {
    return ElasticBuilderServices.getQuerySearchTerm({term: keyword, searchType, market})
        .then(mustQuery => {
            const must = [].concat(mustQuery, {
                match: {
                    'category.keyword': 'clothing'
                }
            }, {
                range: {
                    rank: {
                        gte: 1,
                        lt: 500000
                    }
                }
            })

            return elastic.search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    size: 0,
                    query: {
                        bool: {
                            must
                        }
                    }
                }
            })
        })
        .then(result => {
            const {hits} = result
            const {total} = hits

            return {
                totalHasRankLessThan500k: total
            }
        })

}

const _computeScore = (result) => {
    const {total, status, rank, rankAvg, trendAvg, treding, minRank, maxRank} = result

    if (!total) {
        return 0
    }

    return 100
}

exports.getStatsByKeyword = (keyword, searchType = '', market = 'us') => {
    const keywordValidated = (keyword + '').toLowerCase()

    return Promise.all([
        _getStatsHasRankByKeyword(keywordValidated, searchType, market),
        _statsByKeyword(keywordValidated, searchType, market),
        _getTotalHasRankLessThan500k(keywordValidated, searchType, market)
    ]).then(([hasRank, all, totalHasRankLessThan500k]) => {
        const result = Object.assign({}, all, hasRank, totalHasRankLessThan500k)
        const score = _computeScore(result)

        return Object.assign({}, result, {score})
    })
}

const _getDeletedHistory = (keyword, searchType = '', market = 'us') => {
    const timeAgo = '30d'

    return ElasticBuilderServices.getQuerySearchTerm({term: keyword, searchType, market})
        .then(mustQuery => {
            const must = [].concat(mustQuery, [
                {
                    term: {
                        'category.keyword': {
                            value: 'clothing'
                        }
                    }
                },
                {
                    range: {
                        deleted_at: {
                            gte: `now-${timeAgo}`
                        }
                    }
                }
            ])

            return elastic.search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    query: {
                        bool: {
                            must
                        }
                    },

                    aggs: {
                        deleted: {
                            date_histogram: {
                                field: 'deleted_at',
                                interval: 'day'
                            }
                        }
                    }
                }
            })
        })
        .then(result => {
            const {aggregations, hits} = result
            const {total} = hits

            const {deleted} = aggregations

            const deletedHistory = deleted.buckets.map(({key, doc_count}) => ({count: doc_count, time: key}))

            return {
                totalDeleted: total,
                deleted: deletedHistory
            }
        })
}

const _getAvailableHistory = (keyword, searchType = '', market = 'us') => {
    const timeAgo = '30d'

    return ElasticBuilderServices.getQuerySearchTerm({term: keyword, searchType, market})
        .then(mustQuery => {
            const must = [].concat(mustQuery, [
                {
                    term: {
                        'category.keyword': {
                            value: 'clothing'
                        }
                    }
                },
                {
                    range: {
                        available: {
                            gte: `now-${timeAgo}`
                        }
                    }
                }
            ])

            return elastic.search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    query: {
                        bool: {
                            must
                        }
                    },

                    aggs: {
                        available: {
                            date_histogram: {
                                field: 'available',
                                interval: 'day'
                            }
                        },
                    }
                }
            })
        })
        .then(result => {
            const {aggregations, hits} = result
            const {total} = hits

            const {available} = aggregations

            const availableHistory = available.buckets.map(({key, doc_count}) => ({count: doc_count, time: key}))

            return {
                totalAvailable: total,
                available: availableHistory
            }
        })
}

exports.getHistogram = (keyword, searchType = '', market = 'us') => {
    return Promise.all([
        _getDeletedHistory(keyword, searchType, market),
        _getAvailableHistory(keyword, searchType, market)
    ]).then(([deletedResult, availableResult]) => {
        const {totalDeleted, deleted} = deletedResult;
        const {totalAvailable, available} = availableResult;
        const total = totalAvailable + totalDeleted;

        return {
            total,
            deleted,
            available
        }
    })
}
