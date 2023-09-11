const client = require('../connections/elasticsearch')
const _ = require('lodash')
const moment = require('moment')
const appConfig = require('../app.config')
const {detectASIN} = require("../helpers/AmazonHelpers")
const isNumeric = require("../helpers/isNumeric")

let indexing = appConfig.get('/elasticIndexing')

const MAX_LENGTH_SEARCH_TERM = 512

const _getTimeAlias = (alias) => {
    if (!alias || typeof alias !== 'string') {
        return false
    }

    if (alias.indexOf('-ago') === -1) {
        return false
    }

    const arr = alias.split('-')

    if (arr.length !== 3) {
        return false
    }

    const unit = arr[1].toLowerCase()

    if (['d', 'w', 'm', 'y', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years'].indexOf(unit) === -1) {
        return false
    }

    if (!isNumeric(arr[0])) {
        return false
    }

    const amount = parseInt(arr[0], 10)

    return moment().subtract(amount, unit)
}

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

const sortByBuilder = (filed) => {
    const _sortBy = {
        rank: {
            ranked: 'desc'
        },
        crawled: {
            crawled: "desc"
        },
        price: {
            price: "asc"
        },
        available: {
            available: "desc"
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
            {
                available: {
                    "order": "desc"
                }
            }
        ]
    }

    return _sortBy[filed] || false
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

const _validateSearchTerm = (term) => {
    let validatedTerm = term

    if (term && term.length > MAX_LENGTH_SEARCH_TERM) {
        validatedTerm = term.substr(0, MAX_LENGTH_SEARCH_TERM)

        if (term.charAt(MAX_LENGTH_SEARCH_TERM) !== " ") {
            validatedTerm = validatedTerm.substr(0, validatedTerm.lastIndexOf(" "))
        }
    }

    return validatedTerm
}

exports.validateSearchTerm = _validateSearchTerm

const _prepareSearchItems = ({page, limit, query, status, rank, price, availableText, type, category = 'clothing', brandType, sortBy, excludeIds = [], aggs = {}, market = 'us', ignores = []}) => {
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
    let term = _validateSearchTerm(queryValidated.term) || ''
    const searchType = queryValidated.searchType || 'all_words'
    const excludedKeyword = queryValidated.excludedKeyword ? _validateSearchTerm((queryValidated.excludedKeyword + '').trim().toLowerCase()) : ''

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

    /**
     * Brand type.
     */
    if (brandType === 'official') {
        _mustQuery = [].concat(_mustQuery, [{
            term: {
                official: {
                    value: true
                }
            }
        }])

    } else if (brandType === 'unofficial') {
        _mustNotQuery = [].concat(_mustNotQuery, [{
            term: {
                official: {
                    value: true
                }
            }
        }])
    }

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

    if(market) {
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
     * Ignore items
     */

    if(ignores && Array.isArray(ignores) && ignores.length) {
        must_not = [...must_not, {
            ids: {
                "values": ignores
            }
        }]
    }


    /**
     * Filter price
     */
    const priceValidate = Object.assign({}, {from: '', to: ''}, price)
    const fromPrice = Math.abs(priceValidate.from)
    const toPrice = Math.abs(priceValidate.to)

    let mustPrice = {
        gte: fromPrice
    }

    if (toPrice > 0) {
        mustPrice = Object.assign({}, mustPrice, {lte: toPrice})
    }

    if (fromPrice || toPrice) {
        must = [].concat(must, {
            range: {
                price: mustPrice
            }
        })
    }

    /**
     * Filter available
     */
    const availableValidated = Object.assign({}, {from: '', to: ''}, availableText)
    const _fromAlias = _getTimeAlias(availableValidated.from)
    const _toAlias = _getTimeAlias(availableValidated.to)

    const fromA = _fromAlias ? _fromAlias : moment(availableValidated.from, 'DD/MM/YYYY')
    const toA = _toAlias ? _toAlias : moment(availableValidated.to, 'DD/MM/YYYY')

    const fromAvailable = fromA.isValid() ? fromA.format('DD/MM/YYYY') : null
    const toAvailable = toA.isValid() ? toA.format('DD/MM/YYYY') : null

    if (category !== 'popsockets' && fromAvailable || toAvailable) {
        must = [].concat(must, {
            range: {
                available: {
                    gte: fromAvailable,
                    lte: toAvailable,
                    format: "dd/MM/yyyy"
                }
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
     * Filter type
     */
    if (type && type !== 'all') {
        must = [].concat(must, {
            match: {
                type
            }
        })
    }

    /**
     * Filter category
     */
    const allowCategories = ['clothing', 'popsockets']
    const categoryValidated = category && allowCategories.indexOf(category) !== -1 ? category : 'clothing'
    if (categoryValidated) {
        must = [].concat(must, {
            match: {
                "category.keyword": categoryValidated
            }
        })
    }

    /**
     * Trends
     */
    if (fieldSortBy === 'trends') {
        must = [].concat(must, {
            range: {
                trending: {
                    gt: 20
                }
            }
        })
    }

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

exports.searchItem = ({page, limit, query, status, rank, price, availableText, type, category, brandType, sortBy, excludeIds = [], aggs = {}, market = 'us', ignores = []}) => {
    return _prepareSearchItems({
        page,
        limit,
        query,
        status,
        rank,
        price,
        availableText,
        type,
        category,
        brandType,
        sortBy,
        excludeIds,
        aggs,
        market,
        ignores
    }).then(({limit, queryBuilder, sort, from, aggs}) => {
        console.log('QUERY', JSON.stringify(queryBuilder))

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

exports.getTrendItems = ({page, limit, minRank = 1}) => {
    const from = (page - 1) * limit

    if ((page * limit) > 10000) {
        return Promise.resolve({
            total: 0,
            items: []
        })
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
                                    gte: "now-3d"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }).then(result => {
        const {hits} = result
        const {total} = hits
        const items = hits['hits']

        const ids = items.map((item) => {
            return item._id
        })

        return Promise.resolve({
            total,
            items: ids
        })
    })
}

exports.searchItemsToExport = ({size, page, limit, query, status, rank, price, availableText, type, category, brandType, sortBy, excludeIds = [], aggs = {}, market = 'us'}) => {
    return _prepareSearchItems({
        page,
        limit,
        query,
        status,
        rank,
        price,
        availableText,
        type,
        category,
        brandType,
        sortBy,
        excludeIds,
        aggs,
        market
    }).then(({limit, queryBuilder, sort, from, aggs}) => {
        console.log('EXPORT SEARCH QUERY', JSON.stringify(queryBuilder))

        return client
            .search({
                index: indexing.index,
                type: indexing.type,
                body: {
                    size: size,
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
