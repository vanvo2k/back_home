const UserActions = require('../actions/UserActions')
const LoggingServices = require('../services/LoggingServices')
const {getUserIP} = require("../helpers/CommonHelpers")
const authHelpers = require("tamz-middleware/helpers/auth")
const {catchError, sendSuccess, sendError} = require("../helpers/ResponseHelopers")

exports.getProfile = (req, res) => {
    const userId = req['authenticatedUserId']

    UserActions.getProfile(userId)
        .then((profile) => {
            res.header('Cache-Control', 'no-cache')
                .send({
                    success: true,
                    profile
                })
        })
        .catch(catchError(req, res))
}

exports.getProfileV2 = (req, res) => {
    const userId = req['authenticatedUserId']

    UserActions.getProfile(userId)
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.saveSettings = (req, res) => {
    const userId = req['authenticatedUserId']
    const settings = req.body.settings || {}

    UserActions.saveSettings(userId, settings)
        .then(settings => {
            res.send(settings)
        })
        .catch(catchError(req, res))
}

exports.getSettings = (req, res) => {
    const userId = req['authenticatedUserId']

    UserActions.getSettings(userId)
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getScopes = (req, res) => {
    const userId = req['authenticatedUserId']

    UserActions.getScopes(userId)
        .then(scopes => {
            res.send({
                success: true,
                scopes
            })
        })
        .catch(catchError(req, res))
}

exports.checkRefreshToken = (req, res, next) => {
    const refreshToken = req.headers['x-refresh-token'] || req.body['refresh-token'] || req.query['refresh-token'] || ''
    const uuid = req.headers['x-uid'] || req.headers['x-uuid'] || req.body['x-uuid'] || req.query['x-uuid'] || ''

    if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
        return res.status(403).send({
            success: false,
            message: 'The refresh token is empty.'
        })
    }

    const IP = getUserIP(req)
    const userId = req['authenticatedUserId']

    UserActions.isRevoked({refreshToken, userId, IP, uuid}).then(isRevoked => {
        if (!isRevoked) {
            return next()
        }

        console.log('Revoked token!', isRevoked)

        if (isRevoked instanceof Error) {
            const message = isRevoked.message

            return res.send({
                success: false,
                message,
                notify: true,
                contact: true
            })
        }

        return res.status(403).send({
            success: false,
            message: 'Your session has ended! Please sign in again.'
        })
    }).catch(error => {
        next()
    })
}

exports.getHeartbeat = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const currentScopes = authHelpers.getUserScopes(req)

    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || ''
    const IP = getUserIP(req)
    const recapcha = req.headers['x-recapcha'] || ''
    const accessToken = authHelpers.getAccessToken(req)

    LoggingServices.info({
        request: req,
        owner: userId,
        event: 'HEART_BEAT',
        IP,
        data: {
            IP,
            app: version
        },
        store: false
    })

    UserActions.heartbeat({userId, currentScopes, IP, recapcha, accessToken, appVersion: version})
        .then(data => {
            const scopes = data.scopes || []

            res.send({
                success: true,
                data,
                scopes,//backward
                token: ''
            })
        })
        .catch(sendError(req, res))
}

exports.logOut = (req, res) => {
    const refreshToken = req.headers['x-refresh-token'] || req.body['refresh-token'] || req.query['refresh-token'] || false
    const userId = req['authenticatedUserId']

    if (!refreshToken) {
        return sendSuccess(req, res)(true)
    }

    UserActions.revokeSession({userId, refreshToken})
        .then(() => {
            return sendSuccess(req, res)(true)
        })
        .catch(error => {
            return sendSuccess(req, res)(true)
        })
}

exports.saveMeta = (req, res) => {
    const userId = req['authenticatedUserId']
    const meta = req.body.meta || {}

    UserActions.saveMeta(userId, meta)
        .then(meta => {
            res.send(meta)
        })
        .catch(catchError(req, res))
}

exports.updateAffiliate = (req, res) => {
    const userId = req['authenticatedUserId']
    const affiliate = req.body.affiliate || {}

    UserActions.updateAffiliate(userId, affiliate)
        .then(affiliate => {
            res.send(affiliate)
        })
        .catch(catchError(req, res))
}

exports.savePhoneNumber = (req, res) => {
    const userId = req['authenticatedUserId']
    const phoneNumber = req.body.phoneNumber || ''

    if (!phoneNumber) {
        return res.status(400).send({
            success: false,
            message: 'Phone number is required.'
        })
    }

    UserActions.savePhoneNumber(userId, phoneNumber)
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}
