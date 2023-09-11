const MyAnalytic = require('../models/MyAnalytic')
const FCategory = require('../models/F-Category')
const defaultQueries = require('../data/defaultQueries')
const defaultCategoryFavorites = require('../data/defaultCategoryFavorites')

exports.createDefaultQueries = (userId) => {
    const queries = defaultQueries()
    const queriesWithOwner = queries.map(query => {
        const defaultArgs = {title: '', description: '', args: {}}

        return Object.assign({}, defaultArgs, query, {owner: userId, creator: 'bot'})
    }).reverse()

    return MyAnalytic.insertMany(queriesWithOwner)
        .then(docs => {
            return Promise.resolve(docs)
        })
        .catch(error => {
            console.log(error)
        })
}

exports.createDefaultFavoriteCategory = (userId) => {
    const categoryDefault = defaultCategoryFavorites()
    const categoryWithOwner = {
        title: categoryDefault,
        owner: userId,
        default: true
    }

    const category = new FCategory(categoryWithOwner)
    return category.save()
}
