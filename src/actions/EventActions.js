const NicheEvent = require('../models/NicheEvent')
const ProductActions = require('./ProductActions')
const {MAX_RANK_TRIAL} = require("../constants/Common")

exports.getListEvents = ({page = 1, limit = 10}) => {
    const limitValidated = parseInt(limit, 10)
    const from = (page - 1) * limitValidated

    return NicheEvent
        .find({
            status: 'active',
            time: {
                $gt: Date.now()
            }
        })
        .sort({
            time: 1
        })
        .skip(from)
        .limit(limitValidated)
}

exports.getAllEvents = () => {
    return NicheEvent
        .find({
            status: 'active'
        })
        .sort({
            time: 1
        })
}

exports.getProducts = ({userId, limit = 4, query = {}, isTrial = false}) => {
    const querySearch = {
        searchType: 'at_least_one'
    }

    if (Object.keys(query)) {
        const keyword = query.keyword || ''

        if (keyword) {
            querySearch.term = keyword
        }
    }

    const sortBy = {
        field: 'rank'
    }

    const toRank = isTrial ? MAX_RANK_TRIAL : null

    return ProductActions.search({
        user: userId,
        page: 1,
        limit,
        query: querySearch,
        sortBy,
        rank: {
            from: 0,
            to: toRank
        },
        price: {},
        availableText: {},
        status: 'alive'
    })
}
