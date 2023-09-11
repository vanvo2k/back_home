const Item = require('../models/Item')
const Favorite = require('../models/Favorite')
const ElasticSearch = require('../services/ElasticSearchServices')
const StatisticServices = require('../services/StatisticServices')

const getItemByID = (userId) => {
    return Item.findById(userId)
        .then(item => {
            if (!item) {
                return Promise.reject(new Error('Item not found!'))
            }

            return Promise.resolve(item)
        })
}

const _getLikeItem = (user, itemId) => {
    return Favorite
        .findOne({
            item: itemId,
            owner: user
        })
        .then(favorite => {
            return Promise.resolve(!!favorite)
        })
}

const _fetchItems = (ids) => {
    return Item
        .find({
            _id: {
                $in: ids
            }
        })
        .select('-ranks -prices -features -description -from_keywords -from_spiders')
        .then(items => {
            let objectItems = {}

            items.forEach(item => {
                const id = item._id.toString()
                const object = item.toJSON()

                objectItems = Object.assign({}, objectItems, {[id]: object})
            })

            return Promise.resolve(objectItems)
        })
}

const _fetchLikedItems = (user, ids) => {
    return Favorite
        .find({
            owner: user,
            item: {
                $in: ids
            }
        })
        .then(items => {
            let object = {}

            items.forEach(item => {
                const id = item.item.toString()

                object = Object.assign({}, object, {[id]: true})
            })

            return Promise.resolve(object)
        })
}

exports.getTotalItems = () => {
    return StatisticServices.getTotalItems()
}

exports.fetchItemsByIds = _fetchItems

exports.getItems = ({page, limit, query, status, user, rank, price, availableText, sortBy, type}) => {
    page = page > 0 ? parseInt(page, 10) : 1
    limit = limit > 0 ? parseInt(limit, 10) : 10
    const {field} = sortBy
    const fieldSortBy = field ? field : 'rank'

    const startTime = Date.now()

    return ElasticSearch.searchItem({
        page: page,
        limit: limit,
        query,
        status,
        rank,
        price,
        availableText,
        type,
        sortBy: {field: fieldSortBy}
    }).then(result => {
        const {items, total, ranks} = result

        const doneElastic = Date.now() - startTime
        console.log('ELASTIC', doneElastic)

        return Promise
            .all([
                _fetchItems(items),
                _fetchLikedItems(user, items)
            ])
            .then(([itemsById, itemsLiked]) => {
                const doneMongo = Date.now() - startTime
                console.log('MONGODB', doneMongo)

                const computedItems = items
                    .filter(itemId => {
                        return !!itemsById[itemId]
                    })
                    .map((itemId) => {
                        const object = itemsById[itemId]

                        if (itemsLiked.hasOwnProperty(itemId)) {
                            return Object.assign({}, object, {liked: true})
                        }

                        return Object.assign({}, object, {liked: false})
                    })

                return Promise.resolve({
                    items: computedItems,
                    total,
                    ranks
                })
            })
    })
        .then(({items, total, ranks}) => {
            const totalPage = Math.ceil(total / limit) || 1

            const result = {
                docs: items,
                ranks,
                limit,
                page,
                total,
                pages: totalPage
            }

            return Promise.resolve(result)
        })
}

exports.getItemDetail = (itemId, userId = false) => {
    return Promise.all([
        getItemByID(itemId),
        _getLikeItem(userId, itemId)
    ]).then(([item, liked]) => {
        const object = item.toJSON()

        return Object.assign({}, object, {liked})
    })
}

exports.getLike = (user, itemId) => {
    return _getLikeItem(user, itemId)
}

exports.postLike = (user, itemId) => {
    return Favorite
        .findOne({
            item: itemId,
            owner: user
        })
        .then(favorite => {

            if (!favorite) {
                const newFavorite = new Favorite({
                    item: itemId,
                    owner: user
                })

                return newFavorite.save()
                    .then(() => {
                        return Promise.resolve(true)
                    })
            }

            return favorite.remove()
                .then(() => {
                    return Promise.resolve(false)
                })
        })
}

exports.getTrendItems = ({limit, userId}) => {
    return ElasticSearch.getTrendItems({limit})
        .then(({total, items}) => {

            return Promise
                .all([
                    _fetchItems(items),
                    _fetchLikedItems(userId, items)
                ])
                .then(([itemsObject, itemsLiked]) => {
                    const computedItems = items.map(itemId => {
                        const object = itemsObject[itemId]

                        if (itemsLiked.hasOwnProperty(itemId)) {
                            return Object.assign({}, object, {liked: true})
                        }

                        return Object.assign({}, object, {liked: false})
                    })


                    return Promise.resolve(computedItems)
                })
                .then(_items => {
                    return Promise.resolve({
                        docs: _items,
                        total
                    })
                })
        })
}

exports.getTrendItemsV2 = ({limit, userId, isTrial}) => {
    const minRank = 1

    return ElasticSearch.getTrendItems({limit, minRank})
        .then(({total, items}) => {

            return Promise
                .all([
                    _fetchItems(items),
                    _fetchLikedItems(userId, items)
                ])
                .then(([itemsObject, itemsLiked]) => {
                    const computedItems = items.map(itemId => {
                        const object = itemsObject[itemId]

                        if (itemsLiked.hasOwnProperty(itemId)) {
                            return Object.assign({}, object, {liked: true})
                        }

                        return Object.assign({}, object, {liked: false})
                    })


                    return Promise.resolve(computedItems)
                })
                .then(_items => {
                    return Promise.resolve({
                        docs: _items,
                        total
                    })
                })
        })
}
