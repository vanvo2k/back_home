const jwt = require('jsonwebtoken')
const User = require('../models/User')
const appConfig = require('../app.config')
const SessionServices = require('../services/SessionServices')
const BroadCaster = require('tamz-broadcaster')
const UserActions = require('./UserActions')
const {NEW_USER_REGISTER} = require('spyamz-constants').events
const {transporter, PREFIX} = require('../services/TransportServices')

exports.oauth = async (provider, redirectUri) => {
    const allowHosts = [
        'spybadass.com',
        'spyamz.com'
    ]

    if (process.env.NODE_ENV !== 'production') {
        allowHosts.push('localhost:3000')
    }

    const webClient = appConfig.get('/webClient')
    let isAllow = false
    allowHosts.forEach(host => {
        if (redirectUri.indexOf(host) !== -1) {
            isAllow = true
        }
    })

    if (!isAllow) {
        throw new Error(`Not allow this host! ${redirectUri}`)
    }

    switch (provider) {
        case 'facebook':
            return Promise.resolve('auth/facebook')

        case 'google':
            return Promise.resolve('auth/google')

        default:
            return Promise.resolve('/')
    }
}

exports.validateSocialUser = (user, provider, cookies) => {
    if (!user) {
        return Promise.reject('User is empty!')
    }

    const {emails, id, IP, code} = user
    let email = `${id}@facebook.com`

    if (emails && emails.length) {
        email = emails[0].value
    }
    const name = user.displayName

    const profile = {
        name,
        [`${provider}_id`]: id,
    }

    const uuid = cookies['_spz_uuid'] || ''
    console.log('LOGIN_UUID', uuid, code)

    /**
     * Find or create.
     */
    return User.findOne({email})
        .then(async (user) => {
            if (user) {
                // update affiliate code
                if (code) {
                    user.affiliateRefCode = code
                    await user.save()
                }
                return Promise.resolve(user)
            }
            const affiliateCode = await User.createAffiliateCode()
            const userData = {email, profile, heartbeat: Date.now(), affiliateCode}
            if (code) userData.affiliateRefCode = code
            const newUser = new User(userData)
            return newUser.save()
                .then(newUser => {
                    transporter.publish(`${PREFIX}.${NEW_USER_REGISTER}`, {
                        userId: newUser.get('_id'),
                        email,
                    })

                    BroadCaster.broadcast(NEW_USER_REGISTER, {
                        userId: newUser.get('_id'),
                        email,
                    })

                    UserActions.saveUserLocation(newUser._id, IP)
                        .catch(error => {
                            console.error('SAVE_LOCATION_FAILED', error)
                        })

                    return Promise.resolve(newUser)
                })
        })
        .then(user => {
            const userIP = user.get('IP')
            if (!userIP) {
                user.update({
                    $set: {
                        IP,
                        profile
                    }
                }).then((result) => {
                })
            }

            return Promise.resolve(user)
        })
        .then(user => {
            const firstShowPromotionTime = user.get('firstShowPromotionTime')
            if (!firstShowPromotionTime) {
                user.update({
                    $set: {
                        firstShowPromotionTime: Date.now()
                    }
                }).then((result) => {
                })
            }

            return Promise.resolve(user)
        })
        .then((user) => {
            const userId = user.get('_id')
            return SessionServices.createNewSession({userId, IP, uuid})
                .then(({access_token, refresh_token}) => {
                    console.log(`[CREATE_NEW_SESSION] Success access token ${access_token} | Refresh token ${refresh_token}`)
                    return {
                        accessToken: access_token,
                        refreshToken: refresh_token
                    }
                })
        })
}

exports.loginSocialCallback = ({callback, accessToken, refreshToken}) => {
    let redirectTo = callback || appConfig.get('/webClient') + '/oauth-callback'
    redirectTo += `?access_token=${accessToken}&refreshToken=${refreshToken}`

    return Promise.resolve(redirectTo)
}

exports.isAuthorized = (token) => {
    if (token) {
        const secretKey = appConfig.get('/secretKey')

        return new Promise((resolve, reject) => {
            jwt.verify(token, secretKey, (err, decoded) => {
                if (err) {
                    return reject(new Error('Failed to authenticate token.'))
                } else {
                    return resolve(decoded)
                }
            })
        })
    } else {
        return Promise.reject(new Error('No token provided.'))
    }
}
