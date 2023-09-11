const client = require('../connections/elasticsearch')
const _ = require('lodash')
const appConfig = require('../app.config')
const {detectASIN} = require("../helpers/AmazonHelpers")
const ElasticSearchServices = require('../services/ElasticSearchServices')

let indexing = appConfig.get('/spyggsIndexing')

const _tokenizeText = (text) => {
    return client.indices.analyze({
        index: indexing.index,
        body: {
            text
        }
    }).then(response => {
        const {tokens} = response
        if (!tokens || !tokens.length) {
            return Promise.resolve([])
        }

        const strToken = tokens.map(item => {
            return item['token'] || ''
        }).filter(token => {
            return !!token
        })

        return Promise.resolve(strToken)
    })
}

const getOperatorTermQuery = (type) => {
    if (type === 'at_least_one') {
        return 'or'
    }

    return 'and'
}

const getQuerySameOrder = (term, field) => {
    return _tokenizeText(term)
        .then(tokens => {
            if (!tokens.length) {
                return Promise.resolve(false)
            }

            const clauses = tokens.map(token => {
                return {
                    span_term: {
                        [field]: token
                    }
                }
            })

            const query = {
                span_near: {
                    clauses,
                    slop: 20,
                    in_order: true
                }
            }

            return Promise.resolve(query)
        })
}

const sortByBuilder = (field) => {
    const _sortBy = {
        rank: {
            ranked: 'desc'
        },
        crawled: {
            crawled: "desc"
        },
        maxPrice: {
            maxPrice: "asc"
        },
        minPrice: {
            minPrice: "asc"
        },
        trending: {
            trending: "desc"
        },
        trends: [
            {
                ranked: {
                    order: "desc"
                }
            },
            // {
            //     available: {
            //         "order": "desc"
            //     }
            // }
        ]
    }

    return _sortBy[field] || false
}

const _getQuerySearchTerm = ({term, searchType}) => {
    let _mustQuery = []

    const isASIN = detectASIN(term)

    if (isASIN) {
        _mustQuery = [].concat(_mustQuery, {
            term: {
                "ASIN.keyword": term
            }
        })

        return Promise.resolve(_mustQuery)
    }

    const name = term.trim().toLowerCase()

    const isSearchBrand = name.indexOf('brand:') !== -1
    if (isSearchBrand) {
        const brandName = name.replace('brand:', '')

        if (brandName) {
            if (searchType === 'match_phrase') {
                _mustQuery = [].concat(_mustQuery, {
                    match_phrase: {
                        brand: brandName
                    }
                })

                return Promise.resolve(_mustQuery)
            } else if (searchType === 'same_order') {
                return getQuerySameOrder(brandName, 'brand')
                    .then(_querySameOrder => {
                        if (_querySameOrder) {
                            _mustQuery = [].concat(_mustQuery, _querySameOrder)
                        }

                        return Promise.resolve(_mustQuery)
                    })
            } else {//Has all word or at least one
                _mustQuery = [].concat(_mustQuery, {
                    match: {
                        brand: {
                            query: brandName,
                            operator: getOperatorTermQuery(searchType)
                        }
                    }
                })

                return Promise.resolve(_mustQuery)
            }
        }
    } else if (name && name.length) {
        if (searchType === 'match_phrase') {
            _mustQuery = [].concat(_mustQuery, {
                match_phrase: {
                    name
                }
            })

            return Promise.resolve(_mustQuery)
        } else if (searchType === 'same_order') {
            return getQuerySameOrder(name, 'name')
                .then(_querySameOrder => {
                    if (_querySameOrder) {
                        _mustQuery = [].concat(_mustQuery, _querySameOrder)
                    }

                    return Promise.resolve(_mustQuery)
                })
        } else {//Has all word or at least one
            _mustQuery = [].concat(_mustQuery, {
                match: {
                    name: {
                        query: name,
                        operator: getOperatorTermQuery(searchType)
                    }
                }
            })

            return Promise.resolve(_mustQuery)
        }
    }

    return Promise.resolve(_mustQuery)
}

const _prepareSearchItems = ({page, limit, query, status, rank, minPrice, maxPrice, sortBy, excludeIds = [], aggs = {}, market = 'us'}) => {
    let queryBuilder = {
        bool: {}
    }

    let must = []
    let must_not = []

    /**
     * Sort by
     */
    let sort = []
    const fieldSortBy = sortBy.field
    const _sortBy = sortByBuilder(fieldSortBy)
    if (_sortBy) {
        sort = Array.isArray(_sortBy) ? _sortBy : [_sortBy]
    }

    let _mustNotQuery = []
    const queryValidated = Object.assign({}, {searchType: '', term: '', excludedKeyword: ''}, query)
    let term = ElasticSearchServices.validateSearchTerm(queryValidated.term) || ''
    const searchType = queryValidated.searchType || 'all_words'
    const excludedKeyword = queryValidated.excludedKeyword ? ElasticSearchServices.validateSearchTerm((queryValidated.excludedKeyword + '').trim().toLowerCase()) : ''

    /**
     * Excluded keywords.
     */
    if (excludedKeyword && excludedKeyword.length) {
        const excludedKeywords = excludedKeyword.split(',')
            .map(str => str.trim())

        if (excludedKeywords.length) {
            excludedKeywords.forEach(excluded => {
                _mustNotQuery = [].concat(_mustNotQuery, {
                    match: {
                        name: {
                            query: excluded,
                            operator: 'and'
                        }
                    }
                })
            })
        }
    }

    let _mustQuery = []

    if (_mustQuery.length) {
        queryBuilder.bool.must = _mustQuery
    }

    if (_mustNotQuery.length) {
        queryBuilder.bool.must_not = _mustNotQuery
    }

    /**
     * Filter rank
     */
    const rankValidate = Object.assign({}, {from: '', to: ''}, rank)
    const gte = Math.abs(rankValidate.from)
    const lte = (rankValidate.to || rankValidate.to >= 1) ? parseInt(rankValidate.to, 10) : null
    if (lte) {
        must = [].concat(must, {
            range: {
                rank: {
                    gte,
                    lte,
                }
            }
        })
    }

    if (lte === null && gte > 1) {
        must_not = [].concat(must_not, {
            range: {
                rank: {
                    gte: 1,
                    lt: gte,
                }
            }
        })
    }

    if (market) {
        must = [].concat(must, {
            match: {market}
        })
    }

    /**
     * Exclude ids
     */
    if (excludeIds && Array.isArray(excludeIds) && excludeIds.length) {
        must_not = [].concat(must_not, {
            ids: {
                "values": excludeIds
            }
        })
    }

    /**
     * Filter min price
     */
    const minPriceValidate = Object.assign({}, {from: '', to: ''}, minPrice)
    const fromMinPrice = Math.abs(minPriceValidate.from)
    const toMinPrice = Math.abs(minPriceValidate.to)

    let mustMinPrice = {
        gte: fromMinPrice
    }

    if (toMinPrice > 0) {
        mustMinPrice = Object.assign({}, mustMinPrice, {lte: toMinPrice})
    }

    if (fromMinPrice || toMinPrice) {
        must = [].concat(must, {
            range: {
                minPrice: mustMinPrice
            }
        })
    }

    /**
     * Filter max price
     */
    const maxPriceValidate = Object.assign({}, {from: '', to: ''}, maxPrice)
    const fromMaxPrice = Math.abs(maxPriceValidate.from)
    const toMaxPrice = Math.abs(maxPriceValidate.to)

    let mustMaxPrice = {
        gte: fromMaxPrice
    }

    if (toMaxPrice > 0) {
        mustMaxPrice = Object.assign({}, mustMaxPrice, {lte: toMaxPrice})
    }

    if (fromMaxPrice || toMaxPrice) {
        must = [].concat(must, {
            range: {
                maxPrice: mustMaxPrice
            }
        })
    }

    /**
     * Filter status
     */
    if (status === 'alive') {
        must = [].concat(must, {
            term: {
                alive: true
            }
        })
    } else if (status === 'dead') {
        must = [].concat(must, {
            term: {
                alive: false
            }
        })
    }

    /**
     * Trends
     */
    // if (fieldSortBy === 'trends') {
    //     must = [].concat(must, {
    //         range: {
    //             trending: {
    //                 gt: 20
    //             }
    //         }
    //     })
    // }

    if (market) {
        must = [].concat(must, {
            match: {market}
        })
    }

    let _bool = {}

    if (must.length) {
        _bool = Object.assign({}, _bool, {must})

        queryBuilder.bool.filter = {
            bool: {
                must
            }
        }
    }

    if (must_not.length) {
        _bool = Object.assign({}, _bool, {must_not})
    }

    if (!_.isEmpty(_bool)) {
        queryBuilder.bool.filter = {
            bool: _bool
        }
    }

    const from = (page - 1) * limit

    return _getQuerySearchTerm({term, searchType})
        .then(_mustQuerySearchTerm => {
            if (_mustQuerySearchTerm.length) {
                _mustQuery = [].concat(_mustQuery, _mustQuerySearchTerm)
            }

            if (_mustQuery.length) {
                queryBuilder.bool.must = _mustQuery
            }

            const queryResult = {
                from,
                limit,
                queryBuilder,
                sort
            }

            if (aggs && typeof aggs === 'object' && Object.keys(aggs).length) {
                queryResult.aggs = aggs
            }

            return queryResult
        })
}

exports.searchItem = ({page, limit, query, status, rank, minPrice, maxPrice, sortBy, excludeIds = [], aggs = {}, market = 'us'}) => {
    return _prepareSearchItems({
        page,
        limit,
        query,
        status,
        rank,
        minPrice,
        maxPrice,
        sortBy,
        excludeIds,
        aggs,
        market
    }).then(({limit, queryBuilder, sort, from, aggs}) => {
        console.log('SPYGGS QUERY', JSON.stringify(queryBuilder))

        return client
            .search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    size: limit,
                    from,
                    stored_fields: [],
                    query: queryBuilder,
                    sort,
                    aggs
                }
            })
    }).then(result => {
        const {hits, aggregations} = result
        const {total} = hits
        const items = hits['hits']

        const ids = items.map((item) => item._id)

        const response = {
            total,
            items: ids
        }

        if (aggregations && typeof aggregations === 'object' && Object.keys(aggregations).length) {
            response.aggregations = aggregations
        }

        return response
    })
}

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






