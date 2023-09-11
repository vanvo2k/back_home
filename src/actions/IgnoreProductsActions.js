const Ignore = require('../models/Ignore')
const Favorite = require('../models/Favorite')
const Item = require('../models/Item')

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

exports.getTotalItems = (userId) => {
    return Ignore
        .count({
            owner: userId
        })
}

exports.toggleIgnores = ({userId, productId}) => {
    const query = {
        owner: userId,
        item: productId,
    }

    return Ignore.findOne(query)
        .then(ignore => {
            if (!ignore) {
                return getItemByID(productId, 'rank')
                    .then(item => {
                        const {rank} = item
                        const ranked = (!rank || isNaN(rank) || parseInt(rank) === 0) ? 0 : rank;
                        const newIgnore = new Ignore(Object.assign({}, {ranked: ranked}, query))
                        return newIgnore.save();
                    })
                    .then(ignore => {
                        const {owner, item} = ignore
                        return Favorite.deleteMany({owner, item});
                    })
                    .then(() => Promise.resolve(true))
            }

            return ignore.remove()
                .then(() => Promise.resolve(false))
        })
        .then(added => {
            return Promise.resolve({
                productId,
                added
            })
        })
}

exports.getProductsFromIgnore = ({userId, page, limit, sortBy}) => {
    const sort =  sortBy === 'rank' ? {ranked: 1} : {created: 'desc'}
    return Ignore
        .paginate(
            {
                owner: userId,
            },
            {
                page,
                limit,
                sort: sort,
                populate: {
                    path:'item',
                    select: '_id cropped last_updated_at name alive brand rank date_first_available computed type category trendy trending price official market thumbnail thumbnailCropped',
                    lean: true
               },
               lean: true
            }
        )
        .then(({docs, total, limit, page, pages}) => {
            const items = docs.map(doc => {
                const item = doc.item
                const cropped = !!item.cropped
                const preview = cropped ? item.thumbnailCropped : item.thumbnail || ''
                const {thumbnailCropped, thumbnail, ...other} = item
                const created = doc.created
                return {
                    ...other,
                    preview,
                    created
                }

            })

            return Promise.resolve({docs: items, total, limit, page, pages});
        })

}