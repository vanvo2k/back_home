const {emitEvent} = require("../services/EventServices")
const User = require('../models/User')
const _ = require('lodash')
const {GET_HEARTBEAT} = require("../constants/Events")
const SessionServices = require('../services/SessionServices')
const LocationServices = require('../services/LocationServices')
const {throwErrorWithCode} = require("../helpers/CommonHelpers")
const RecapchaServices = require('../services/RecapchaServices')
const SlackNotification = require('../services/SlackNotification')
const compareVersions = require('compare-versions')
const BlackListedServices = require('tamz-middleware/services/BlackListedServices')
const OauthServices = require('tamz-middleware/services/OauthServices')

const getUserByID = (userId) => {
    return User.findById(userId)
        .then(user => {
            if (!user) {
                return throwErrorWithCode('User not found!', 403)
            }

            return Promise.resolve(user)
        })
        .then(user => {
            const status = user.get('status')

            if (status === 'blocked') {
                return throwErrorWithCode('Your account was locked.', 403)
            }

            return Promise.resolve(user)
        })
}

exports.saveUserIP = (userId, IP) => {
    return getUserByID(userId)
        .then(user => {
            const currentIP = user.get('IP')

            if (currentIP) {
                return Promise.resolve(user)
            }

            return user.update({
                $set: {
                    IP
                }
            }).then(() => {
                return Promise.resolve(user)
            })
        })
}

exports.getProfile = (userId) => {
    return User.getProfileById(userId)
        .then(profile => {
            if (!profile) {
                return Promise.reject('User not found!')
            }

            User.update(
                {
                    _id: userId
                },
                {
                    $set: {
                        heartbeat: Date.now()
                    }
                }
            ).exec()

            return Promise.resolve(profile)
        })
}

exports.saveSettings = (userId, settings) => {
    return getUserByID(userId)
        .then(user => {
            return user.saveSettings(settings)
        })
        .then(user => {
            return Promise.resolve(user.settings)
        })
}

exports.getSettings = (userId) => {
    return getUserByID(userId)
        .then(user => {
            const settings = user.get('settings') || {}

            return Promise.resolve(settings)
        })
}

exports.getScopes = (userId) => {
    return getUserByID(userId)
        .then(user => {
            return user.getScopes()
        })
}

exports.isRevoked = ({refreshToken, userId, IP, uuid}) => {
    return SessionServices.isRevoked({refreshToken, userId, IP, uuid})
}

exports.revokeSession = ({userId, refreshToken}) => {
    return SessionServices.removeSession({userId, refreshToken})
}

exports.heartbeat = ({userId, currentScopes, IP, recapcha, accessToken, appVersion}) => {
    emitEvent(GET_HEARTBEAT, {userId})

    if (appVersion && compareVersions(appVersion, '1.10') <= 0) {
        SlackNotification.sendMessage(`Old version userId: ${userId}, version: ${appVersion}, IP: ${IP}`)
        BlackListedServices.addToBackList(accessToken, 24 * 3600)
    }

    if (recapcha) {
        RecapchaServices.verify(IP, recapcha)
            .then(score => {
                console.log(`RECAPCHA`.green, `UserId: ${userId}`, `Score: ${score}`.red)

                if (score >= 0.21) {
                    return RecapchaServices.goodRequest(userId, score)
                }

                if (score < 0.3) {
                    console.error('RECAPCHA', userId, score)
                }

                if (score <= 0.11) {
                    console.log('MARK_BAD_REQUEST', userId)

                    RecapchaServices.badRequest(userId, accessToken)
                }
            })
    }

    return getUserByID(userId)
        .then(user => {
            const IPs = user.IPs
            const IPsValidated = Array.isArray(IPs) ? IPs : []

            const $update = {
                $set: {
                    heartbeat: Date.now()
                }
            }

            if (IPsValidated.indexOf(IP) === -1) {
                $update['$push'] = {
                    IPs: IP
                }
            }

            user.update($update).exec()

            return Promise.all([
                OauthServices.getScopesByUserId(userId),
                OauthServices.getRolesByUserId(userId)
            ]).then(([scopes, roles]) => {
                return {
                    scopes,
                    roles
                }
            })
        })
}

exports.saveUserLocation = (userId, IP) => {
    return Promise.all([
        getUserByID(userId),
        LocationServices.getLocationByIP(IP)
    ]).then(([user, location]) => {
        if (!user) {
            return Promise.resolve(false)
        }

        if (!location) {
            return Promise.resolve(false)
        }

        const {country, city} = location

        user.location = {
            country,
            city,
        }

        return user.save()
    })
}

exports.saveMeta = (userId, meta) => {
    return getUserByID(userId)
        .then(user => {
            return user.saveMeta(meta)
        })
        .then(user => {
            return Promise.resolve(user.meta)
        })
}

exports.updateAffiliate = async (userId, affiliate) => {
    await User.update(
        {
            _id: userId
        },
        {
            $set: {
                affiliateRefCode: affiliate
            }
        }
    ).exec()
    return true
}

exports.savePhoneNumber = (userId, phoneNumber) => {
    return getUserByID(userId)
        .then(user => {
            if (!user) {
                return Promise.resolve(false)
            }

            return user.savePhoneNumber(phoneNumber)
        })
        .then(user => {
            return Promise.resolve(user.phoneNumber)
        })
}
