const BlackListedServices = require('tamz-middleware/services/BlackListedServices')
const ScraperBlackListServices = require('tamz-middleware/services/ScraperBlackListServices')
const BlockedEventActions = require('../actions/BlockedEventActions')
const User = require("../models/User")
const Moment = require('moment')

exports.checkAppVersion = ({appVersion, userId, IP, userAgent, accessToken}) => {
    const oneDay = 24 * 3600

    if (!appVersion) {
        BlockedEventActions.log({
            IP,
            userId,
            userAgent,
            code: 'fraud_request',
            message: `Fraudulent request without app version.`,
            meta: {accessToken}
        })

        return ScraperBlackListServices.addToBackList(userId, oneDay)
    }
}

exports.searchProduct = ({userId, IP, userAgent, accessToken, postData = {}}) => {
    const {limit} = postData
    const limitValidated = limit ? limit : 10

    const listLimit = {
        10: true,
        20: true,
        36: true,
        50: true,
        100: true
    }

    const checkValid = Number.isInteger(limitValidated) ? listLimit[limitValidated] : false

    if (!checkValid) {
        const tenMinutes = 10 * 60
        BlackListedServices.addToBackList(accessToken)
        ScraperBlackListServices.addToBackList(userId, tenMinutes)

        const message = `Fraudulent query with limit ${limit} ${typeof limit}.`
        console.error(userId, IP, message)

        BlockedEventActions.log({
            IP,
            userId,
            userAgent,
            code: 'fraud_query',
            message: `Fraudulent query with limit ${limit}.`,
            meta: {postData, accessToken}
        })
    }
}

exports.checkHeartBeat = ({userId, IP, userAgent, accessToken, postData = {}, appVersion}) => {
    return User.findById(userId)
        .then(user => {
            if (!user) {
                BlackListedServices.addToBackList(accessToken)
            }

            const heartbeatTime = user.get('heartbeat')

            if (!heartbeatTime) {
                return user.update({
                    $set: {
                        heartbeat: Date.now()
                    }
                }).exec()
            }

            const momentTime = Moment(heartbeatTime)
            const oneHourAgo = Moment().subtract(24, 'hour')

            if (momentTime.isBefore(oneHourAgo)) {
                console.log('NO_HEART_BEAT', userId, IP, userAgent)

                BlackListedServices.addToBackList(accessToken)
                ScraperBlackListServices.addToBackList(userId, 5 * 60)

                BlockedEventActions.log({
                    IP,
                    userId,
                    userAgent,
                    code: 'no_heartbeat',
                    message: 'No heart beat',
                    meta: {heartbeatTime, postData, accessToken, appVersion}
                })
            }
        })
}
