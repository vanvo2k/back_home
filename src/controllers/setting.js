const SettingActions = require('../actions/SettingActions')
const {sendError, sendSuccess} = require("../helpers/ResponseHelopers")

exports.getForceRefreshApp = (req, res) => {
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || '1.0.0'

    return SettingActions.getForceRefreshApp(version)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getSetting = (req, res) => {
    const defaultQueries = {
        key: ''
    }

    const userScopes = req['userRoles'] || []

    const {key} = Object.assign({}, defaultQueries, req.query)

    return SettingActions.getSetting({key, userScopes})
        .then(sendSuccess(req, res)).catch(sendError(req, res))
}
