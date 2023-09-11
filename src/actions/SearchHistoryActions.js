const SearchHistory = require('../models/SearchHistory');
const isNumeric = require('../helpers/isNumeric');

exports.getListHistories = ({page = 1, limit = 100, userId}) => {
    if (!userId) {
        throw new Error('User id is required.')
    }

    const pageValidated = isNumeric(page) ? parseInt(page, 10) : 1
    const limitValidated = isNumeric(limit) ? parseInt(limit, 10) : 100
    const from = (pageValidated - 1) * limitValidated;

    const query = {
        owner: userId
    }

    return Promise.all([
        SearchHistory.count(query),
        SearchHistory.find(query)
            .sort({
                created: -1
            })
            .skip(from)
            .limit(limitValidated)
    ]).then(([total, docs]) => {
        const pages = Math.ceil(total / limitValidated) || 1

        const histories = docs
            .filter(doc => doc.get('owner'))
            .map(doc => doc.toJSON())

        return {
            docs: histories,
            total,
            pages,
            page: pageValidated,
            limit: limitValidated
        }
    })
}

exports.getTotalQueries = ({userId}) => {
    if (!userId) {
        throw new Error('User ID is required.')
    }
    return SearchHistory.count({owner: userId})
}

exports.getRecentSearches = ({userId}) => {
    if (!userId) {
        throw new Error('User ID is required.')
    }

    return SearchHistory
        .find({
            owner: userId
        })
        .sort({
            created: -1
        })
        .limit(5)
}