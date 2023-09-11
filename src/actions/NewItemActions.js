const Item = require('../models/Item')
const Favorite = require('../models/Favorite')
const ElasticSearch = require('../services/ElasticSearchServices')

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


exports.getItems = ({page, limit, query, status, user, rank, price, availableText, sortBy, type, brandType}) => {
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
        brandType,
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

