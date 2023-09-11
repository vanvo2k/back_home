const StatisticServices = require('../services/StatisticServices')
const ItemActions = require('../actions/ItemActions')
const {getRandomInt} = require("../helpers/CommonHelpers")
const {MAX_RANK_TRIAL} = require("../constants/Common")

exports.getItemsBestSellerRank = ({maxRank = null}) => {
    return StatisticServices.getItemsBestSellerRank({
        maxRank,
    }).then(ids => {
        return ItemActions.fetchItemsByIds(ids)
            .then(itemsObject => {
                const items = ids
                    .map(id => itemsObject[id] || false)
                    .filter(item => !!item)
                    .map(item => {
                        const cropped = !!item.cropped
                        const preview = cropped ? item.thumbnailCropped : item.thumbnail || ''

                        delete item.link
                        delete item.link_status
                        delete item.downloaded
                        delete item.isMerch

                        return Object.assign({}, item, {preview})
                    })

                return Promise.resolve(items)
            })
    })
}


exports.getItemsRandom = (isTrial) => {
    const minRank = getRandomInt(1, 200000)
    const maxRank = !isTrial ? getRandomInt(minRank + 200000, minRank + 1000000) : MAX_RANK_TRIAL

    const sorts = ['rank', 'trending', 'available', 'crawled', 'price', 'ranked']
    const indexSortRandom = getRandomInt(0, sorts.length - 1)
    const sortBy = sorts[indexSortRandom] || 'rank'

    const minTrending = !isTrial ? getRandomInt(1, 40) : getRandomInt(-90, 0)
    const maxTrending = getRandomInt(minTrending + 50, 100)

    const orderBy = ['desc', 'asc']
    const rand = getRandomInt(0, 1)
    const order = orderBy[rand]

    return StatisticServices.getItemsRandom({
        minRank,
        maxRank,
        minTrending,
        maxTrending,
        sortBy,
        order
    }).then(ids => {
        return ItemActions.fetchItemsByIds(ids)
            .then(itemsObject => {
                const items = ids
                    .map(id => itemsObject[id] || false)
                    .filter(item => !!item)
                    .map(item => {
                        const cropped = !!item.cropped
                        const preview = cropped ? item.thumbnailCropped : item.thumbnail || ''

                        return Object.assign({}, item, {preview})
                    })

                return Promise.resolve(items)
            })
    })
}

exports.getItemsTopRising = ({minRank = 1, minTrending}) => {
    const maxRank = 100000

    return StatisticServices.getItemsTopRising({maxRank, minRank, minTrending})
        .then(ids => {
            return ItemActions.fetchItemsByIds(ids)
                .then(itemsObject => {
                    const items = ids
                        .map(id => itemsObject[id] || false)
                        .filter(item => !!item)
                        .map(item => {
                            const cropped = !!item.cropped
                            const preview = cropped ? item.thumbnailCropped : item.thumbnail || ''

                            return Object.assign({}, item, {preview})
                        })

                    return Promise.resolve(items)
                })
        })
}

exports.getStatisticByDate = (dateString) => {
    return Promise.all([
        StatisticServices.getTotalItems(),
        StatisticServices.getTotalItemsHasRankAllTime(),
        StatisticServices.getTotalItemsWasUpdated(dateString),
        StatisticServices.getTotalItemsWasCrawled(dateString),
        StatisticServices.getTotalItemsAvailable(dateString),
        StatisticServices.getTotalItemsHasRankByDate(dateString),
        StatisticServices.getTotalItemsWasDeleted(dateString),
        StatisticServices.getTotalItemsAlive(dateString),
    ]).then(([total, hasRankAll, updated, crawled, available, hasRank, deleted, alive]) => {
        return Promise.resolve({
            total,
            hasRankAll,
            updated,
            crawled,
            available,
            hasRank,
            deleted,
            alive
        })
    })
}

exports.getOverview = (from) => {
    return StatisticServices.getItemsAvailableStatistic(from)
}

exports.getHasRank = (from) => {
    return StatisticServices.getItemsHasRankStatistic(from)
}

exports.getRangeRank = () => {
    return StatisticServices.getRangeRankStatistic()
}

exports.getTypes = () => {
    return StatisticServices.getItemTypesStatistic()
}
