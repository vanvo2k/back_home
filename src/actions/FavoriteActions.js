const ItemActions = require('./ItemActions')
const ProductActions = require('./ProductActions')
const Favorite = require('../models/Favorite')
const FCategory = require('../models/F-Category')
const arrayToObject = require("../helpers/CommonHelpers").arrayToObject

exports.getTotalItems = (userId) => {
    return Favorite
        .count({
            owner: userId
        })
}

exports.getItems = ({userId, page, limit}) => {
    return Favorite
        .paginate(
            {
                owner: userId
            },
            {
                page,
                limit,
                sort: {
                    created: 'desc'
                }
            }
        )
        .then(({docs, total, limit, page, pages}) => {
            const ids = docs.map(favorite => {
                return favorite.item.toString()
            })

            return ItemActions.fetchItemsByIds(ids)
                .then(itemsById => {
                    const items = ids.map(id => {
                        return Object.assign({}, itemsById[id], {liked: true})
                    })

                    return Promise.resolve({docs: items, total, limit, page, pages})
                })
        })
}

exports.getProductsByCategory = ({userId, categoryId, page, limit, sortBy}) => {
    const sort =  sortBy === 'rank' ? {ranked: 'desc'} : {created: 'desc'}
    return Favorite
        .paginate(
            {
                owner: userId,
                category: categoryId
            },
            {
                page,
                limit,
                sort: sort
            }
        )
        .then(({docs, total, limit, page, pages}) => {
            const ids = docs.map(favorite => {
                return favorite.get('item')
            })

            return ProductActions.getProductsByIds(ids)
                .then(productsObject => {
                    const items = ids
                        .filter(id => !!productsObject[id])
                        .map(id => {
                            const object = productsObject[id]

                            const cropped = !!object.cropped
                            const preview = cropped ? object.thumbnailCropped : object.thumbnail || ''

                            delete object.link_status
                            delete object.link
                            delete object.downloaded
                            delete object.isMerch
                            delete object.thumbnail
                            delete object.thumbnailCropped

                            return Object.assign({}, object, {preview})
                        })

                    return Promise.resolve({docs: items, total, limit, page, pages})
                })
        })

}

exports.getListCategories = ({userId, productId, term = ''}) => {
    const _getFavorites = productId ? Favorite.find({owner: userId, item: productId}) : Promise.resolve([])

    const query = {
        owner: userId,
    }

    if (term) {
        query.title = new RegExp((term + '').trim(), 'gi')
    }

    return Promise.all([
        FCategory.find(query).sort({updated: -1}),
        _getFavorites
    ]).then(([categories, favorites]) => {
        const addedCategories = arrayToObject(favorites, 'category')

        const computedCategories = categories.map(category => {
            const object = category.toJSON()
            const categoryId = object._id
            const added = addedCategories.hasOwnProperty(categoryId)

            return Object.assign({}, object, {added})
        })

        return Promise.resolve(computedCategories)
    })
}

exports.getCategoryDetails = ({userId, categoryId}) => {
    return FCategory.findOne({
        _id: categoryId,
        owner: userId,
    }).then(category => {
        if (!category) {
            throw new Error('Category not found!')
        }

        return Promise.resolve(category)
    })
}

exports.createCategory = ({userId, title, productId}) => {
    const category = new FCategory({
        owner: userId,
        title,
    })

    return category.save()
        .then(category => {
            const object = category.toJSON()

            if (productId) {
                const newFavorites = new Favorite({
                    owner: userId,
                    category: category.get('_id'),
                    item: productId
                })

                return newFavorites.save()
                    .then(() => {
                        return Promise.resolve(Object.assign({}, object, {added: true}))
                    })
            }

            return Promise.resolve(object)
        })
}

exports.deleteCategory = ({userId, categoryId}) => {
    return Promise.all([
        FCategory.deleteOne({
            _id: categoryId,
            owner: userId
        }),
        Favorite.remove({
            category: categoryId
        })
    ]).then(([removed, removedF]) => {
        console.log(removed)
        console.log(removedF)

        return true
    })
}

exports.updateCategory = ({userId, categoryId, title, description = ''}) => {
    return FCategory.findOneAndUpdate({
            _id: categoryId,
            owner: userId
        },
        {
            $set: {
                title,
                description
            }
        },
        {
            new: true
        }
    )
}

exports.getTotalProductsByCategory = ({userId, categoryId}) => {
    return Favorite.count({
        owner: userId,
        category: categoryId
    })
}
