const SpyggsQuery = require('../models/SpyggsQuery')

exports.deleteSpyggsQuery = ({userId, id}) => {
    return SpyggsQuery.remove({
        _id: id,
        owner: userId
    }).then(() => Promise.resolve(true))
}

exports.createSpyggsQuery = ({queryId, userId, title, args}) => {
    const defaultArgs = {
        search: {},
        filter: {},
        sort: {}
    }

    const {search, filter, sort} = Object.assign(defaultArgs, args)

    if (queryId) {
        return SpyggsQuery.update({
            _id: queryId,
            owner: userId
        }, {
            $set: {
                args: {search, filter, sort}
            }
        }).then(() => {
            return SpyggsQuery.findById(queryId)
        })
    }

    const spyggsQuery = new SpyggsQuery({
        title,
        owner: userId,
        args: {search, filter, sort}
    })

    return spyggsQuery.save()
}

exports.getListSpyggsQueries = ({userId, term = '',  page = 1, limit = 10}) => {
    const termValidated = (term + '').trim()

    const query = {
        owner: userId
    }

    if (term) {
        query.title = {
            $regex: new RegExp(termValidated, 'gi')
        }
    }

    return SpyggsQuery
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
                pages
            })
        )
}