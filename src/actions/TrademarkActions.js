const Trademark = require('../models/Trademark')
const TrademarkServices = require('../services/TrademarkServices')
const MAX_KEYWORDS = 100;
// if(dataUser.scopes[1]=="trademark"){
//     MAX_KEYWORDS = 999999;
// };
// ko call api, log, run function, vv.. trong khu vuc file nay !!!!!!!
exports.markRead = ({ id, userId }) => {
    return Trademark.updateOne(
        {
            _id: id,
            owner: userId,
        },
        {
            $set: {
                read: true,
            },
        }
    ).then(() => {
        return Trademark.findOne({
            _id: id,
            owner: userId,
        })
    })
}

exports.getTrademarkDetail = ({ id, userId }) => {
    return Trademark.findOne({
        _id: id,
        owner: userId,
    }).then((item) => {
        if (!item) {
            return Promise.reject('Item not found.')
        }

        return Promise.resolve(item)
    })
}

exports.getTotal = (userId) => {
    return Trademark.count({
        owner: userId,
    }).then((total) => {
        return Promise.resolve({
            total,
            max: MAX_KEYWORDS,
        })
    })
}

exports.getListTrademarks = ({ userId, page, limit, sortBy = 'created' }) => {
    let fieldSortBy = ''

    switch (sortBy) {
        case 'warning':
            fieldSortBy = 'totalWarnings'
            break

        default:
            fieldSortBy = 'created'
    }

    return Trademark.paginate(
        {
            owner: userId,
        },
        {
            page,
            limit,
            sort: {
                [fieldSortBy]: 'desc',
            },
        }
    )
}

exports.createNewTrademark = ({ userId, text, IP }) => {
    const trademark = new Trademark({
        owner: userId,
        text,
    })

    console.log('[CREATE_TM]', userId, text, IP)

    return trademark.save().then((item) => {
        //Add to check now.
        TrademarkServices.checkManual(item)

        return Promise.resolve(item)
    })
}

exports.deleteTrademark = ({ userId, id }) => {
    return Trademark.deleteOne({
        _id: id,
        owner: userId,
    })
}

exports.refreshManual = ({ userId, id }) => {
    return Trademark.findOne({
        _id: id,
        owner: userId,
    })
        .then((item) => {
            if (!item) {
                return Promise.reject('Item not found.')
            }

            const status = item.get('status')
            if (status === 'processing' || status === 'pending') {
                return Promise.resolve(item)
            }

            return TrademarkServices.checkManual(item).then(() => {
                return Promise.resolve(item)
            })
        })
        .then((item) => {
            return item
                .update({
                    $set: {
                        status: 'pending',
                        updated: Date.now(),
                    },
                })
                .then(() => Trademark.findById(item._id))
        })
}

exports.getTotalWarnings = ({ userId }) => {
    return Trademark.count({
        owner: userId,
        status: 'completed',
        totalWarnings: {
            $gt: 0,
        },
        read: {
            $ne: true,
        },
    })
}
exports.getStatistic = ({ userId }) => {
    return Trademark.count({
        owner: userId,
    }).then((total) => {
        return {
            max: MAX_KEYWORDS,
            total,
            remain: MAX_KEYWORDS - total,
        }
    })
}