const client = require('../connections/elasticsearch')
const _ = require('lodash')
const moment = require('moment')
const appConfig = require('../app.config')
const {detectASIN} = require("../helpers/AmazonHelpers")
const isNumeric = require("../helpers/isNumeric")
const ElasticSearchServices = require('./ElasticSearchServices')

let indexing = appConfig.get('/elasticIndexing')

const _getTimeAlias = (alias, milestone) => {
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
    const milestoneMoment = moment(milestone.split('-').reverse().join('-'))
    return milestoneMoment.subtract(amount, unit);
}

const sortByBuilder = (field) => {
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

    return _sortBy[field] || false
}

const _tokenizeText = (text, dateTextValidated) => {
    const dateTextFormatted = _formatDateText(dateTextValidated)
    const index = dateTextValidated ? `${indexing.index}-${dateTextFormatted}` : indexing.index;

    return client.indices.analyze({
        index: index,
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

const getOperatorTempQuery = (type) => {
    if (type === 'at_least_one') {
        return 'or'
    }

    return 'and'
}

const getQuerySameOrder = (term, field, dateTextValidated) => {
    return _tokenizeText(term, dateTextValidated)
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

const _getQuerySearchTerm = ({term, searchType, dateTextValidated}) => {
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
                return getQuerySameOrder(name, 'name', dateTextValidated)
                    .then(_querySameOrder => {
                        if (_querySameOrder) {
                            _mustQuery = [].concat(_mustQuery, _querySameOrder)
                        }

                        return Promise.resolve(_mustQuery)
                    })
            } else {
                _mustQuery = [].concat(_mustQuery, {
                    match: {
                        name: {
                            query: name,
                            operator: getOperatorTempQuery(searchType)
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
            return getQuerySameOrder(name, 'name', dateTextValidated)
                .then(_querySameOrder => {
                    if (_querySameOrder) {
                        _mustQuery = [].concat(_mustQuery, _querySameOrder)
                    }

                    return Promise.resolve(_mustQuery)
                })
        } else {
            _mustQuery = [].concat(_mustQuery, {
                match: {
                    name: {
                        query: name,
                        operator: getOperatorTempQuery(searchType)
                    }
                }
            })

            return Promise.resolve(_mustQuery)
        }
    }

    return Promise.resolve(_mustQuery)
}

const _formatDateText = (dateText) => {
    const regex = /^\d{2}-\d{2}-\d{4}$/;

    return regex.test(dateText) ? dateText.split('-').reverse().join('') : dateText
};

const _prepareQuerySearchArchiveItems = ({page, limit, query, rank, price, availableText, type, brandType, sortBy, excludeIds = [], aggs = {}, market = 'us', dateTextValidated}) => {
    let queryBuilder = {
        bool: {}
    };

    let must = [];
    let must_not = [];

    /**
     * Sort by
     */
    let sort = [];
    const fieldSortBy = sortBy.field;
    const _sortBy = sortByBuilder(fieldSortBy);
    if (_sortBy) {
        sort = Array.isArray(_sortBy) ? _sortBy : [_sortBy];
    }

    let _mustNotQuery = []
    const queryValidated = Object.assign({}, {searchType: '', term: '', excludedKeyword: ''}, query)
    let term = ElasticSearchServices.validateSearchTerm(queryValidated.term) || ''
    const searchType = queryValidated.searchType || 'all_words'
    const excludedKeyword = queryValidated.excludedKeyword ? ElasticSearchServices.validateSearchTerm((queryValidated.excludedKeyword + '').trim().toLowerCase()) : '';

    /**
     * Excluded keywords
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
                    lte
                }
            }
        })
    }

    if (lte === null && gte > 1) {
        must_not = [].concat(must_not, {
            range: {
                rank: {
                    gte: 1,
                    lt: gte
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
     * Filter price
     */
    const priceValidated = Object.assign({}, {from: '', to: ''}, price)
    const fromPrice = Math.abs(priceValidated.from);
    const toPrice = Math.abs(priceValidated.to);

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
    const _fromAlias = _getTimeAlias(availableValidated.from, dateTextValidated)
    const _toAlias = _getTimeAlias(availableValidated.to, dateTextValidated)
    const fromA = _fromAlias ? _fromAlias : moment(availableValidated.from, 'DD/MM/YYYY')
    const toA = _toAlias ? _toAlias : moment(availableValidated.to, 'DD/MM/YYYY')
    const fromAvailable = fromA.isValid() ? fromA.format('DD/MM/YYYY') : null
    const toAvailable = toA.isValid() ? toA.format('DD/MM/YYYY') : null
    if (fromAvailable || toAvailable) {
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

    return _getQuerySearchTerm({term, searchType, dateTextValidated})
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

exports.searchArchiveItems = ({page, limit, query, rank, price, availableText, dateText, type, category, brandType, sortBy, excludeIds = [], aggs = {}, market = 'us'}) => {
    const _dateAlias = _getTimeAlias(dateText);
    const date = _dateAlias ? _dateAlias : moment(dateText, 'DD-MM-YYYY')
    const dateTextValidated = date.isValid() ? date.format('DD-MM-YYYY') : null

    return _prepareQuerySearchArchiveItems({
        page,
        limit,
        query,
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
        dateTextValidated
    }).then(({limit, queryBuilder, sort, from, aggs}) => {
        console.log('QUERY', JSON.stringify(queryBuilder))

        const dateTextFormatted = _formatDateText(dateTextValidated)
        const index = dateTextValidated ? `${indexing.index}-${dateTextFormatted}` : indexing.index;
        console.log(index)

        return client
            .search({
                index: index,
                type: indexing.type,
                body: {
                    _source: true,
                    size: limit,
                    from,
                    stored_fields: [],
                    query: queryBuilder,
                    sort,
                    aggs
                }
            })
    }).then(result => {
        const {hits, aggregation} = result
        const {total} = hits
        const items = hits['hits']

        const ids = items.map((item) => item._id)

        const response = {
            total,
            items,
            ids
        }

        if (aggregation && typeof aggregation === 'object' && Object.keys(aggregation).length) {
            response.aggregations = aggregation
        }

        return response
    })
}

exports.itemDetailInHistoricalDay = ({productId, dateText}) => {
    const dateTextFormatted = _formatDateText(dateText)
    const index = dateText ? `${indexing.index}-${dateTextFormatted}` : indexing.index;
    console.log(index)

    return client.search({
        index: index,
        type: indexing.type,
        body: {
            query: {
                bool: {
                    must: [
                        {
                            ids: {
                                values: productId
                            }
                        }
                    ]
                }
            },
            _source: true
        }
    }).then(result => {
        const {hits, total} = result;
        const items = hits['hits'];
        const item = items[0]

        const {_id, _source} = item
        let finalItem = _source
        finalItem._id = _id

        delete finalItem.link
        delete finalItem.ASIN
        delete finalItem.crawled
        delete finalItem.thumbnailCropped

        return Promise.resolve({item: finalItem});
    })
}