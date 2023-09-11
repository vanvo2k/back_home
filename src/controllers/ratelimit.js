const RateLimitActions = require('../actions/RateLimitActions')
const authHelpers = require("tamz-middleware/helpers/auth")
const {getUserIP} = require("../helpers/CommonHelpers")

exports.limitSearch = (req, res, next) => {
    next()

    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const userId = authHelpers.authenticatedUserId(req)
    const accessToken = req.headers['authorization'] || req.body.token || req.query.token
    const scopes = authHelpers.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1

    RateLimitActions.limitSearch({isTrial, userId, IP, userAgent, accessToken, postData: req.body})
}


exports.limitAPICall = (event) => (req, res, next) => {
    next()

    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const userId = authHelpers.authenticatedUserId(req)
    const accessToken = req.headers['authorization'] || req.body.token || req.query.token
    const scopes = authHelpers.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1

    RateLimitActions.limitAPICall({event, isTrial, userId, IP, userAgent, accessToken, postData: req.body})
}
