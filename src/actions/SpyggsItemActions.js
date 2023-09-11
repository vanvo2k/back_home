const SpyggsItem = require('../models/SpyggsItem')
const ElasticSearchSpyggs = require('../services/ElasticSearchSpyggsServices');
const {MAX_PAGE} = require("../constants/Common")
const AmazonHelpers = require("../helpers/AmazonHelpers")

const getItemByID = (userId, select = '') => {
    return SpyggsItem.findById(userId)
        .select(select)
        .then(item => {
            if (!item) {
                return Promise.reject(new Error('Product not found!'))
            }

            return Promise.resolve(item)
        })
}

exports.getItemDetail = (itemId, userId = false, scopes) => {
    return getItemByID(itemId, '-ASIN')
        .then(item => {
            const object = item.toJSON()

            const isAdmin = scopes.indexOf('admin') !== -1 || scopes.indexOf('super-admin') !== -1
            const market = object.market

            if (!isAdmin && ((scopes.indexOf('standard-de') === -1 && market === 'de') || (scopes.indexOf('standard-uk') === -1 && market === 'uk'))) {
                throw new Error('You do not have permission to access this resource.');
            }

            const preview = object.thumbnail || ''

            delete object.link_status
            delete object.thumbnail

            return Object.assign({}, object, {preview})
        })
}

const _fetchItems = (ids) => {
    return SpyggsItem
        .find({
            _id: {
                $in: ids
            }
        })
        .select('-ranks -prices -ASIN -link')
        .lean()
        .then(items => {
            let objectItems = {}

            items.forEach(item => {
                const id = item._id
                objectItems = Object.assign({}, objectItems, {[id]: item})
            })

            return Promise.resolve(objectItems)
        })
}

exports.search = ({page, limit, query, status, user, rank, minPrice, maxPrice, sortBy, excludeIds = [], aggs = {}, market = 'us'}) => {
    page = page > 0 ? parseInt(page, 10) : 1
    limit = limit > 0 ? parseInt(limit, 10) : 10
    const field = sortBy ? sortBy.field : ''
    const fieldSortBy = field ? field : 'rank'
    const limitValidated = limit <= 100 ? limit : 100
    const pageValidated = page <= MAX_PAGE ? page : 1

    const start = Date.now()
    return ElasticSearchSpyggs.searchItem({
        page: pageValidated,
        limit: limitValidated,
        query,
        status,
        rank,
        minPrice,
        maxPrice,
        sortBy: {field: fieldSortBy},
        excludeIds,
        aggs,
        market
    }).then(result => {
        const {items, total, aggregations} = result

        return _fetchItems(items)
            .then(itemsById => {
                const computedItems = items
                    .filter(itemId => {
                        return !!itemsById[itemId]
                    })
                    .map((itemId) => {
                        const object = itemsById[itemId]

                        const preview = object.thumbnail || ''

                        delete object.thumbnail
                        delete object.link_status

                        return Object.assign({}, object, {preview})
                    })

                return {
                    items: computedItems,
                    total,
                    aggregations
                }
            })

    }).then(({items, total, aggregations}) => {
        const totalPages = Math.ceil(total / limit) || 1
        const stop = Date.now()
        console.log('Search time: ', stop - start, totalPages)

        const totalPagesValidated = totalPages <= MAX_PAGE ? totalPages : MAX_PAGE

        return {
            docs: items,
            limit,
            page,
            total,
            pages: totalPagesValidated,
            aggregations
        }
    })
}

exports.getTotalProducts = () => {
    return ElasticSearchSpyggs.getTotalItems()
}

exports.getSimilarProductV2 = ({userId, productId, page}) => {
    return SpyggsItem.findById(productId)
        .then(product => {
            if (!product) {
                throw new Error('Product not found.')
            }

            return Promise.resolve(product)
        })
        .then(product => {
            const title = product.get('name') || ''
            const filteredTitle = AmazonHelpers.filterStopWords(title)
            const market = product.get('market') || 'us'

            return exports.search({
                user: userId,
                page: page >= 1 ? page : 1,
                limit: 100,
                query: {
                    term: filteredTitle
                },
                sortBy: {
                    field: 'rank'
                },
                status: 'all',
                rank: {},
                price: {},
                excludeIds: [productId],
                aggs: {
                    count: {
                        terms: {
                            field: 'alive',
                            size: 2
                        }
                    }
                },
                market
            })
        })
        .then(result => {
            const {aggregations} = result

            if (!aggregations || typeof aggregations !== 'object' || !aggregations.count) {
                return result
            }

            const {buckets} = aggregations.count
            if (!buckets || typeof buckets !== 'object' || !buckets.length) {
                return result
            }

            let aliveCount = 0
            let deadCount = 0

            buckets.forEach(bucket => {
                if (bucket.key_as_string === 'true') {
                    aliveCount = bucket.doc_count
                }

                if (bucket.key_as_string === 'false') {
                    deadCount = bucket.doc_count
                }
            })

            delete result.aggregations

            return Object.assign({}, result, {
                aggs: {
                    alive: aliveCount,
                    dead: deadCount
                }
            })

        })
}