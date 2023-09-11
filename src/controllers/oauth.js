const OauthActions = require('../actions/OauthActions')
const {getUserIP} = require("../helpers/CommonHelpers")
const appConfig = require('../app.config')
const {sendSuccess, sendError} = require("../helpers/ResponseHelopers")
const request = require('request-promise');

exports.oauth = (req, res) => {
    const query = Object.assign({provider: '', redirectUri: ''}, req.query)
    const {provider, redirectUri} = query
    console.log('redirectUri', redirectUri)

    OauthActions.oauth(provider, redirectUri)
        .then(redirectTo => {
            req.session.socialCallback = redirectUri
            res.cookie('socialCallback', redirectUri, {expires: new Date(Date.now() + 900000), httpOnly: true})

            return res.redirect(redirectTo)
        })
        .catch(() => {
            const webClient = appConfig.get('/webClient')

            return res.redirect(webClient)
        })
}

//! Deprecated
exports.validateSocialUser = (provider = '') => (req, res, next) => {
    let {user, cookies} = req
    const IP = getUserIP(req)
    user = Object.assign({}, user, {IP})

    OauthActions.validateSocialUser(user, provider, cookies)
        .then(({accessToken, refreshToken}) => {
            req.accessToken = accessToken
            req.refreshToken = refreshToken

            next()
        })
        .catch((error) => {
            const message = error.message || error
            const code = error.code || ''

            res.redirect(`/?m=${message}&c=${code}`)
        })
}

const verifyGoogleToken = (accessToken) => {
    return request({
        uri: `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        json: true
    });
}

//! Deprecated
exports.validateSocialUserV2 = (provider = '') => async (req, res, next) => {
    const {cookies} = req
    let {user} = req.body

    const {profileObj, tokenObj} = user
    const {access_token} = tokenObj
    const {email, name, googleId} = profileObj
    const IP = getUserIP(req)

    const verify = await verifyGoogleToken(access_token, googleId)
    const {error, user_id} = verify

    if (error || user_id !== googleId) {
        throw new Error('Invalid Token.')
    }

    user = Object.assign({}, user, {emails: [{value: email}], id: googleId, displayName: name, IP})

    OauthActions.validateSocialUser(user, provider, cookies)
        .then(({accessToken, refreshToken}) => {
            req.accessToken = accessToken
            req.refreshToken = refreshToken

            next()
        })
        .catch((error) => {
            const message = error.message || error
            const code = error.code || ''
            console.log('error validateSocialUserV2', error)
            res.redirect(`/?m=${message}&c=${code}`)
        })
}

exports.validateSocialUserV3 = (provider = '') => async (req, res, next) => {
    const { user, cookies } = req
    const { state } = req.query

    const IP = getUserIP(req)
    let code
    try {
        code = (state && typeof state === 'string') 
            ? JSON.parse(state)['af']
            : undefined
    } catch(err) {
        code = undefined
    }

    try {
        const { accessToken, refreshToken } = await OauthActions.validateSocialUser(
            { IP, code, ...user },
            provider,
            cookies,
        )

        req.accessToken = accessToken
        req.refreshToken = refreshToken

        next()
    } catch (error) {
        const message = error.message || error
        const code = error.code || ''

        return res.redirect(`/?m=${message}&c=${code}`)
    }
}


exports.facebookCallback = (req, res, next) => {
    next()
}

exports.googleCallback = (req, res, next) => {
    next()
}

//! Deprecated
exports.loginSocialCallback = (req, res) => {
    const callback = req.session.socialCallback || req.cookies.socialCallback || ''
    const {accessToken, refreshToken} = req

    OauthActions.loginSocialCallback({callback, accessToken, refreshToken})
        .then(redirectTo => {
            res.redirect(redirectTo)
        })
        .catch((error) => {
            console.error(error)

            res.redirect('/')
        })
}

//! Deprecated
exports.loginSocialCallbackV2 = (req, res) => {
    const callback = null
    const {accessToken, refreshToken} = req

    OauthActions.loginSocialCallback({callback, accessToken, refreshToken})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.loginSocialCallbackV3 = async (req, res) => {
    const callback = null
    const {accessToken, refreshToken} = req

    try {
        const redirectTo = await OauthActions.loginSocialCallback({ callback, accessToken, refreshToken })
        
        return res.redirect(redirectTo)
    } catch (error) {
        console.log(`oauth.loginSocialCallbackV3 IN backend: ${error}`)

        return res.redirect('/')
    }
}

exports.isAuthorized = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers['authorization']
    const IP = getUserIP(req)

    OauthActions.isAuthorized(token)
        .then(result => {
            const {id, scopes, roles} = result

            req['userScopes'] = scopes
            req['userRoles'] = roles
            req['authenticatedUserId'] = id

            console.log('USER_REQUEST_IP', IP, id)

            next()
        })
        .catch(error => {
            return res.status(403).send({
                success: false,
                message: error.message || ''
            })
        })
}

exports.maybeAuthorized = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers['authorization']

    OauthActions.isAuthorized(token)
        .then(result => {
            const {id, scopes, roles} = result

            req['userScopes'] = scopes
            req['userRoles'] = roles
            req['authenticatedUserId'] = id
            next()
        })
        .catch(error => {
            next()
        })
}
