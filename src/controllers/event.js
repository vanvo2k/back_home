const EventActions = require('../actions/EventActions')
const {sendSuccess, sendError} = require('../helpers/ResponseHelopers')
const authHelpers = require("tamz-middleware/helpers/auth")

exports.getListEvents = (req, res) => {
    const defaultArgs = {
        page: 1,
        limit: 10
    }

    const {page, limit} = Object.assign({}, defaultArgs, req.query)
    EventActions.getListEvents({page, limit})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getAllEvents = (req, res) => {
    EventActions.getAllEvents()
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getProducts = (req, res) => {
    const defaultArgs = {
        limit: 4,
        query: {
            keyword: ''
        }
    }

    const userId = authHelpers.authenticatedUserId(req)
    const scopes = authHelpers.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1

    const {limit, query} = Object.assign({}, defaultArgs, req.body)
    const limitValidated = limit <= 10 ? limit : 10

    EventActions.getProducts({limit: limitValidated, query, userId, isTrial})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}
