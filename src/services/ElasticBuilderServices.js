const client = require('../connections/elasticsearch')
const appConfig = require('../app.config')
const {detectASIN} = require("../helpers/AmazonHelpers")

let indexing = appConfig.get('/elasticIndexing')

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

exports.sortByBuilder = (filed) => {
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

exports.getQuerySearchTerm = ({term, searchType, market = 'us'}) => {
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

    if (market) {
        _mustQuery = [].concat(_mustQuery, {
            match: {
                market
            }
        })
    }

    const name = (term + '').trim().toLowerCase()

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

