const Favorite = require('../models/Favorite')
const FCategory = require('../models/F-Category')
const Item = require('../models/Item')
const NUMBER_TO_INVERSE = 1000000000;

exports.getDefaultCategory = (userId) => {
    return FCategory.findOne({
        owner: userId,
        default: true
    }).then(category => {
        if (!category) {
            const newCategory = new FCategory({
                owner: userId,
                title: 'Uncategorized',
                default: true
            })

            return newCategory.save()
        }

        return Promise.resolve(category)
    })
}

const getItemByID = (itemId, select = '') => {
    return Item.findById(itemId)
        .select(select)
        .then(item => {
            if (!item) {
                return Promise.reject(new Error('Product not found!'))
            }

            return Promise.resolve(item)
        })
}

exports.toggleFavorites = ({userId, productId, categoryId}) => {
    const query = {
        owner: userId,
        item: productId,
    }

    if (categoryId) {
        query.category = categoryId
    }

    FCategory.updateOne({
        _id: categoryId
    }, {
        updated: Date.now()
    }).exec()

    return Favorite.findOne(query)
        .then(favorite => {
            if (!favorite) {
                return getItemByID(productId, 'rank')
                    .then(item => {
                        const {rank} = item
                        const ranked = (!rank || isNaN(rank) || parseInt(rank) === 0) ? 0 : (NUMBER_TO_INVERSE / rank);
                        const newFavorite = new Favorite(Object.assign({}, {ranked: ranked}, query))
                        return newFavorite.save()
                    })
                    .then(() => Promise.resolve(true))
            }

            return favorite.remove()
                .then(() => Promise.resolve(false))
        })
        .then(added => {
            return Promise.resolve({
                productId,
                categoryId,
                added
            })
        })
}
