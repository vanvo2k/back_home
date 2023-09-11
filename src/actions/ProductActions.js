const NATS = require('nats')
const Item = require('../models/Item')
const Ignore = require('../models/Ignore')
const ElasticSearch = require('../services/ElasticSearchServices')
const TrendProductsServices = require('../services/TrendProductsServices')
const StatisticServices = require("../services/StatisticServices")
const AmazonHelpers = require("../helpers/AmazonHelpers")
const {MAX_PAGE, MAX_EXPORT_ITEMS} = require("../constants/Common")
const Transporter = require('../services/TransportServices').transporter
const json2csv = require('json2csv')

const getItemByID = (userId, select = '') => {
    return Item.findById(userId)
        .select(select)
        .then(item => {
            if (!item) {
                return Promise.reject(new Error('Product not found!'))
            }

            return Promise.resolve(item)
        })
}

const getIgnoreByUserId = async (userId, select = '') => {
    return Ignore.find({owner: userId})
        .select(select)
        .lean()
}

const _fetchItems = (ids) => {
    return Item
        .find({
            _id: {
                $in: ids
            }
        })
        .select('-ranks -prices -features -description -from_keywords -from_spiders -link -thumbnailEXT -ASIN')
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

exports.getSimilarProductsV2 = ({userId, productId, page}) => {
    return Item.findById(productId)
        .then(product => {
            if (!product) {
                throw new Error('Product not found!')
            }

            return Promise.resolve(product)
        })
        .then(product => {
            const title = product.get('name') || ''
            const category = product.get('category') || 'clothing'
            const filteredTitle = AmazonHelpers.filterStopWords(title)
            const market = product.get('market') || 'us'

            return exports.search({
                user: userId,
                page: page >= 1 ? page : 1,
                limit: 100,
                query: {
                    term: filteredTitle,
                },
                sortBy: {
                    field: 'rank'
                },
                status: 'all',
                rank: {},
                price: {},
                availableText: {},
                excludeIds: [productId],
                category,
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
        }).then(result => {
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

exports.getSimilarProducts = ({userId, productId}) => {
    return Item.findById(productId)
        .then(product => {
            if (!product) {
                throw new Error('Product not found!')
            }

            return Promise.resolve(product)
        })
        .then(product => {
            const title = product.get('name')
            const filteredTitle = AmazonHelpers.filterStopWords(title)

            const link = `/a/items?page=1&searchType=all_words&sortByField=rank&status=all&term=${encodeURI(filteredTitle)}`

            return Promise.resolve({
                link,
                term: filteredTitle
            })
        })
}

exports.getProductsByIds = _fetchItems

exports.getTotalItems = () => {
    return StatisticServices.getTotalItems()
}

exports.search = async ({page, limit, query, status, user, rank, price, availableText, sortBy, type, category = '', brandType, excludeIds = [], aggs = {}, market = 'us'}) => {
    page = page > 0 ? parseInt(page, 10) : 1
    limit = limit > 0 ? parseInt(limit, 10) : 10
    const field = sortBy ? sortBy.field : ''
    const fieldSortBy = field ? field : 'rank'
    const limitValidated = limit <= 100 ? limit : 100
    const pageValidated = page <= MAX_PAGE ? page : 1

    const start = Date.now()

    const rawIgnores = await getIgnoreByUserId(user, 'item') 
    const ignores = rawIgnores.map(ignore => ignore.item)

    return ElasticSearch.searchItem({
        page: pageValidated,
        limit: limitValidated,
        query,
        status,
        rank,
        price,
        availableText,
        type,
        category,
        brandType,
        sortBy: {field: fieldSortBy},
        excludeIds,
        aggs,
        market,
        ignores
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

                        const cropped = !!object.cropped
                        const preview = cropped ? object.thumbnailCropped : object.thumbnail || ''

                        delete object.link_status
                        delete object.downloaded
                        delete object.isMerch
                        delete object.thumbnail
                        delete object.thumbnailCropped
                        delete object.instantRank

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
        console.log('SEARCH_TIME', stop - start, totalPages)

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

exports.getItemDetail = (itemId, userId = false, scopes) => {
    return getItemByID(itemId, '-from_keywords -from_spiders -link -ASIN')
        .then(item => {
            const object = item.toJSON()

            const isAdmin = scopes.indexOf('admin') !== -1 || scopes.indexOf('super-admin') !== -1
            const market = object.market

            if (!isAdmin && ((scopes.indexOf('standard-de') === -1 && market === 'de') || (scopes.indexOf('standard-uk') === -1 && market === 'uk'))) {
                throw new Error('You do not have permission to access this resource.');
            }

            const cropped = !!object.cropped
            const preview = cropped ? object.thumbnailCropped : object.thumbnail || ''

            delete object.link_status
            delete object.downloaded
            delete object.isMerch
            delete object.thumbnail
            delete object.thumbnailCropped

            const features = Array.isArray(object.features) ? object.features : []
            const indexFeatures = features.map((_, index) => index)
            const featuresSorted = indexFeatures.sort((index, anotherIndex) => {
                const isAutoA = AmazonHelpers.isAutoFeature(features[index])
                const isAutoB = AmazonHelpers.isAutoFeature(features[anotherIndex])

                if (isAutoA && !isAutoB) {
                    return 1
                }

                if (isAutoB && !isAutoA) {
                    return -1
                }

                return 0
            })

            return Object.assign({}, object, {
                preview,
                features,
                featuresSorted
            })
        })
}

exports.getTrendProducts = ({page, limit, userId, isTrial}) => {
    const minRank = 1

    return TrendProductsServices.getTrendItems({page, limit, minRank})
        .then(({total, items}) => {

            return Promise
                .all([
                    _fetchItems(items),
                ])
                .then(([itemsObject]) => {
                    const computedItems = items
                        .filter(itemId => {
                            return !!itemsObject[itemId]
                        })
                        .map(itemId => {
                            const object = itemsObject[itemId]

                            const cropped = !!object.cropped
                            const preview = cropped ? object.thumbnailCropped : object.thumbnail || ''
                            const rank = object.instantRank || object.rank

                            delete object.link
                            delete object.link_status
                            delete object.downloaded
                            delete object.isMerch
                            delete object.thumbnail
                            delete object.thumbnailCropped
                            delete object.instantRank

                            return Object.assign({}, object, {preview, rank})
                        })


                    return Promise.resolve(computedItems)
                })
                .then(_items => {
                    const totalPage = Math.ceil(total / limit) || 1

                    return Promise.resolve({
                        docs: _items,
                        total,
                        page,
                        limit,
                        pages: totalPage
                    })
                })
        })
}

exports.getUrlProduct = (productId) => {
    return getItemByID(productId, '-from_keywords -from_spiders')
        .then(product => {
            const url = product.get('link') || ''

            return Promise.resolve(url)
        })
}

const prefix = process.env.NODE_ENV === 'staging' ? 'spyamz_dev' : 'spyamz'


const _checkTM = (args) => {
    console.log('Check tm', args)

    return new Promise((resolve, reject) => {
        Transporter.requestOne(`${prefix}.CHECK_TM`, args, {}, 30000, (response) => {
            if (response instanceof NATS.NatsError && response.code === NATS.REQ_TIMEOUT) {
                return reject(new Error('Request timed out.'))
            }

            const {success, data} = response
            if (!success) {
                return resolve([])
            }

            return resolve(data)
        })
    })
}

const _checkTMListFeatures = (features) => {
    const arrValidated = Array.isArray(features) ? features : []

    const tasks = arrValidated.map(phrase => {
        if (AmazonHelpers.isAutoFeature(phrase)) {
            return []
        }

        return _checkTM(phrase)
    })

    return Promise.all(tasks)
}

exports.checkTrademark = (productId) => {
    return getItemByID(productId, 'name features brand')
        .then(product => {
            const name = product.get('name') || ''
            const brand = product.get('brand') || ''
            const features = product.get('features') || []

            return Promise.all([
                _checkTM(name),
                _checkTM(brand),
                _checkTMListFeatures(features)
            ]).then(([nameResults, brandResults, featuresResults]) => {
                return {
                    name: nameResults,
                    brand: brandResults,
                    features: featuresResults
                }
            })
        })
}

exports.getASIN = (productId) => {
    return getItemByID(productId, 'ASIN')
        .then(product => {
            const ASIN = product.get('ASIN') || ''

            return Promise.resolve(ASIN)
        })
}

exports.exportProducts = ({numOfItems, page, limit, query, status, rank, price, availableText, sortBy, type, category = '', brandType, excludeIds = [], aggs = {}, market = 'us'}) => {
    page = page > 0 ? parseInt(page, 10) : 1
    limit = limit > 0 ? parseInt(limit, 10) : 10
    numOfItems = numOfItems > 0 ? parseInt(numOfItems, 10) : 1
    const field = sortBy ? sortBy.field : ''
    const fieldSortBy = field ? field : 'rank'
    const limitValidated = limit <= 100 ? limit : 100
    const pageValidated = page <= MAX_PAGE ? page : 1
    const sizeValidated = numOfItems <= MAX_EXPORT_ITEMS ? numOfItems : MAX_EXPORT_ITEMS

    return ElasticSearch.searchItemsToExport({
        size: sizeValidated,
        page: pageValidated,
        limit: limitValidated,
        query,
        status,
        rank,
        price,
        availableText,
        type,
        category,
        brandType,
        sortBy: {field: fieldSortBy},
        excludeIds,
        aggs,
        market
    }).then(result => {
        const {items} = result
        return Promise.resolve(Item.find({_id: {$in: items}}).select('name thumbnail -_id'))
    }).then(items => {
        const csv = json2csv({data: items, fieldNames: ['title', 'image'], fields: ['name', 'thumbnail']})
        return csv
    })
}
