const CheatingActions = require('../actions/CheatingActions')
const authHelpers = require("tamz-middleware/helpers/auth")
const {getUserIP} = require("../helpers/CommonHelpers")

exports.checkAppVersion = (req, res, next) => {
    next()

    const appVersion = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || ''
    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const userId = authHelpers.authenticatedUserId(req)
    const accessToken = authHelpers.getAccessToken(req)

    CheatingActions.checkAppVersion({appVersion, userId, IP, userAgent, accessToken})
}

exports.searchProduct = (req, res, next) => {
    next()

    const defaultArgs = {
        page: 1,
        limit: 10
    }

    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const userId = authHelpers.authenticatedUserId(req)
    const accessToken = authHelpers.getAccessToken(req)

    const postData = Object.assign({}, defaultArgs, req.body)
    CheatingActions.searchProduct({userId, IP, userAgent, accessToken, postData})
}

exports.checkHeartBeat = (req, res, next) => {
    next()

    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''
    const userId = authHelpers.authenticatedUserId(req)
    const accessToken = authHelpers.getAccessToken(req)
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version'

    setTimeout(() => {
        CheatingActions.checkHeartBeat({userId, userAgent, IP, accessToken, postData: req.body, appVersion: version})
    }, 10 * 60 * 1000)
}
