const MyAnalyticActions = require('../actions/MyAnalyticActions')
const {sendError, sendSuccess} = require('../helpers/ResponseHelopers')
const authHelpers = require('tamz-middleware/helpers/auth')
const Moment = require('moment')

exports.createQuery = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    const defaultArgs = {
        title: '',
        query: {}
    }

    const {query, title} = Object.assign({}, defaultArgs, req.body)
    const now = Moment().format('DD-MM-YYYY HH:m')
    const titleValidated = title || `Query - ${now}`

    MyAnalyticActions.createMyAnalytic({userId, args: query, title: titleValidated})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.deleteQuery = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const myAnalyticId = req.params['id'] || ''

    MyAnalyticActions.deleteMyAnalytic({userId, ID: myAnalyticId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getListQueries = (req, res) => {
    const defaultArgs = {
        page: 1,
        limit: 10,
        term: ''
    }

    const userId = authHelpers.authenticatedUserId(req)
    const {page, limit, term} = Object.assign({}, defaultArgs, req.query)

    MyAnalyticActions
        .getListItems({
            userId,
            limit: parseInt(limit, 10),
            page: parseInt(page, 10),
            term
        })
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}
