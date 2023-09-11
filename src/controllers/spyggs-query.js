const SpyggsQueryActions = require('../actions/SpyggsQueryActions')
const {sendError, sendSuccess} = require('../helpers/ResponseHelopers')
const authHelpers = require('tamz-middleware/helpers/auth')
const Moment = require('moment')

exports.createSpyggsQuery = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req);

    const defaultArgs = {
        title: '',
        query: {}
    }

    const {query, title} = Object.assign({}, defaultArgs, req.body)
    const now = Moment().format('DD-MM-YYYY HH:m')
    const titleValidated = title || `SpyggsQuery - ${now}`

    SpyggsQueryActions.createSpyggsQuery({userId, args: query, title: titleValidated})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.deleteSpyggsQuery = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const spyggsQueryId = req.params['id'] || ''

    SpyggsQueryActions.deleteSpyggsQuery({userId, id: spyggsQueryId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getListSpyggsQueries = (req, res) => {
    const defaultArgs = {
        page: 1,
        limit: 10,
        term: ''
    }

    const userId = authHelpers.authenticatedUserId(req)
    const {page, limit, term} = Object.assign({}, defaultArgs, req.query)

    SpyggsQueryActions
        .getListSpyggsQueries({
            userId,
            limit: parseInt(limit, 10),
            page: parseInt(page, 10),
            term
        })
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}