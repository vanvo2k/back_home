const MyAnalytic = require('../models/MyAnalytic')

exports.deleteMyAnalytic = ({userId, ID}) => {
    return MyAnalytic.remove({
        _id: ID,
        owner: userId,
    }).then(() => Promise.resolve(true))
}

exports.createMyAnalytic = ({analyticId, userId, title, args}) => {
    const defaultArgs = {
        search: {},
        filter: {},
        sort: {}
    }

    const {search, filter, sort} = Object.assign(defaultArgs, args)

    if (analyticId) {
        return MyAnalytic.update({
            _id: analyticId,
            owner: userId,
        }, {
            $set: {
                args: {search, filter, sort},
            }
        }).then(() => {
            return MyAnalytic.findById(analyticId)
        })
    }

    const myAnalytic = new MyAnalytic({
        title,
        owner: userId,
        args: {search, filter, sort},
    })

    return myAnalytic.save()
}

exports.getListItems = ({userId, term = '', page = 1, limit = 10}) => {
    const termValidated = (term + '').trim()

    const query = {
        owner: userId
    }

    if (term) {
        query.title = {
            $regex: new RegExp(termValidated, 'gi')
        }
    }

    return MyAnalytic
        .paginate(
            query,
            {
                page,
                limit,
                sort: {
                    created: 'desc'
                }
            }
        )
        .then(({docs, total, limit, page, pages}) =>
            Promise.resolve({
                docs,
                total,
                limit,
                page,
                pages,
            })
        )
}
