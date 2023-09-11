const ProductActions = require('../actions/ProductActions')
const DeprecatedActions = require('../actions/DeprecatedActions')
const {catchError, sendError, sendSuccess} = require("../helpers/ResponseHelopers")
const authHelpers = require("tamz-middleware/helpers/auth")
const {getUserIP} = require("../helpers/CommonHelpers")
const sDecode = require("../helpers/sDecode")
const appConfig = require('../app.config')
const {MAX_RANK_TRIAL} = require("../constants/Common")
const {SEARCH_PRODUCTS_V2} = require('../constants/Events')
const LoggingServices = require('../services/LoggingServices')
const {PREFIX, transporter} = require('../services/TransportServices')

const _isTrial = (req) => {
    const scopes = authHelpers.getUserScopes(req)
    return scopes.indexOf('trial') !== -1
}

exports.getSimilarProductsV2 = (req, res) => {
    const productId = req.params.id || false
    const userId = authHelpers.authenticatedUserId(req)

    const defaultArgs = {
        page: 1
    }

    const {page} = Object.assign({}, defaultArgs, req.query)

    return ProductActions.getSimilarProductsV2({userId, productId, page: parseInt(page, 10)})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getSimilarProducts = (req, res) => {
    const productId = req.params.id || false
    const userId = authHelpers.authenticatedUserId(req)

    return ProductActions.getSimilarProducts({userId, productId})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.totalProducts = (req, res) => {
    const IP = getUserIP(req)
    const {s} = Object.assign({}, req.query)
    const v = s || req.headers['x-vctt'] || ''

    const uuid = req.headers['x-uid'] || ''
    console.log('HELLO', IP, uuid)

    if (v === 'vuive') {
        console.log('[HELLO VCTT]', IP)
        console.log(req.headers)
    }

    ProductActions.getTotalItems()
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

const _verifyFilterMarket = ({scopes = [], market = 'us'}) => {
    const isAdmin = scopes.indexOf('admin') !== -1 || scopes.indexOf('super-admin') !== -1
    const ukAccessible = scopes.indexOf('standard-uk') !== -1
    const deAccessible = scopes.indexOf('standard-de') !== -1

    return !((!isAdmin) && ((!ukAccessible && market === 'uk') || (!deAccessible && market === 'de')))
}

exports.searchV2 = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const scopes = authHelpers.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1
    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''

    const q = req.body.q || ''
    const payload = sDecode(q)

    const dataDefault = {
        page: 1,
        limit: 10,
        query: {},
        user: userId,
        rank: {
            from: 1,
            to: ''
        },
        price: {
            from: 0,
            to: 0
        },
        availableText: {
            from: null,
            to: null
        },
        sortBy: {
            field: 'rank'
        },
        type: 'all',
        brandType: 'all',
        category: 'clothing',
        market: 'us'
    }
    const args = Object.assign({}, dataDefault, payload)

    const {rank, market} = args
    const {from, to} = rank

    if (isTrial && to && to > MAX_RANK_TRIAL) {
        return res.send({
            success: false,
            message: `Your account only can access products with rank less than 1M. Please upgrade to a higher plan :)`,
            notify: true,
            upgradePlan: true
        })
    }

    if (!_verifyFilterMarket({scopes, market})) {
        return res.send({
            success: false,
            message: `Your account can not access products in this market. Please upgrade to a higher plan :)`,
            notify: true,
            upgradePlan: true
        })
    }

    const rankValidated = !isTrial ? rank : {
        from: from < MAX_RANK_TRIAL ? from : 0,
        to: to <= MAX_RANK_TRIAL ? to : MAX_RANK_TRIAL
    }

    const argsValidated = Object.assign({}, args, {rank: rankValidated, market})
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version'

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'SEARCH_PRODUCTS',
        section: 'PRODUCTS',
        IP,
        data: {
            IP,
            userAgent,
            query: argsValidated
        }
    })

    const {query} = argsValidated

    const data = Object.assign({}, query, {userId})
    transporter.publish(`${PREFIX}.${SEARCH_PRODUCTS_V2}`, data)

    ProductActions.search(argsValidated)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.search = (req, res) => {
    DeprecatedActions.deprecatedAPI(res)
}

exports.redirectToUrlProduct = (req, res) => {
    const client = appConfig.get('/webClient')

    res.redirect(client)
}

exports.redirectToUrlProductV2 = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    if (!userId) {
        return res.redirect('/')
    }

    const productId = req.params.id || false

    if (!productId) {
        return res.status(404).send('Product not found.')
    }


    const IP = getUserIP(req)
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version'
    const userAgent = req.headers['user-agent'] || ''

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'REDIRECT_TO_PRODUCT_URL_V2',
        IP,
        data: {
            IP,
            userAgent,
            productId,
        }
    })

    ProductActions.getUrlProduct(productId)
        .then(url => {
            const redirectTo = 'https://href.li/?' + url

            const html = `
            <html><head><meta http-equiv="refresh" content="0; url=${redirectTo}" /></head><body><p><a href="${redirectTo}">Redirect</a></p></body></html>
            `

            res.send(html)
        })
        .catch(error => {
            const message = error.message || 'Something went wrong'

            res.status(404).send(message)
        })
}

exports.productDetail = (req, res) => {
    const itemId = req.params.id || false
    const scopes = authHelpers.getUserScopes(req)

    if (!itemId) {
        return res.send({
            success: false,
            message: 'Product id must be not empty.'
        })
    }

    const userId = authHelpers.authenticatedUserId(req)
    const IP = getUserIP(req)
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version'
    const userAgent = req.headers['user-agent'] || ''

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'PRODUCT_DETAILS',
        section: 'PRODUCTS',
        IP,
        data: {
            IP,
            userAgent,
            itemId,
        }
    })

    ProductActions.getItemDetail(itemId, userId, scopes)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.trends = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const isTrial = _isTrial(req)

    const defaultArgs = {
        limit: 10,
        page: 1
    }

    const {limit, page} = Object.assign({}, defaultArgs, req.body)
    const limitValidated = limit <= 100 ? limit : 100
    const pageValidated = page > 0 ? page : 1

    return ProductActions.getTrendProducts({limit: limitValidated, page: pageValidated, userId, isTrial})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.checkTrademark = (req, res) => {
    const productId = req.params.id || ''

    return ProductActions.checkTrademark(productId)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getASIN = (req, res) => {
    const productId = req.params.id || ''

    const userId = authHelpers.authenticatedUserId(req)
    const IP = getUserIP(req)
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version'
    const userAgent = req.headers['user-agent'] || ''

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'GET_ASIN',
        IP,
        data: {
            IP,
            userAgent,
            productId,
        }
    })

    return ProductActions.getASIN(productId)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.exportSearchResult = (req, res) => {
    const scopes = authHelpers.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1
    const q = req.body.q || ''
    const payload = sDecode(q)

    const dataDefault = {
        numOfItems: 1,
        page: 1,
        limit: 10,
        query: {},
        rank: {
            from: 1,
            to: ''
        },
        price: {
            from: 0,
            to: 0
        },
        availableText: {
            from: null,
            to: null
        },
        sortBy: {
            field: 'rank'
        },
        type: 'all',
        brandType: 'all',
        category: 'clothing',
        market: 'us'
    }
    const args = Object.assign({}, dataDefault, payload)

    const {rank, market} = args
    const {from, to} = rank

    if (isTrial && to && to > MAX_RANK_TRIAL) {
        return res.send({
            success: false,
            message: `Your account only can access products with rank less than 1M. Please upgrade to a higher plan :)`,
            notify: true,
            upgradePlan: true
        })
    }

    if (!_verifyFilterMarket({scopes, market})) {
        return res.send({
            success: false,
            message: `Your account can not access products in this market. Please upgrade to a higher plan :)`,
            notify: true,
            upgradePlan: true
        })
    }

    const rankValidated = !isTrial ? rank : {
        from: from < MAX_RANK_TRIAL ? from : 0,
        to: to <= MAX_RANK_TRIAL ? to : MAX_RANK_TRIAL
    }

    const argsValidated = Object.assign({}, args, {rank: rankValidated, market})

    const filePath = 'items.csv'

    ProductActions.exportProducts(argsValidated)
        .then(items => {
            res.attachment(filePath)
            res.status(200).send(items)
        })
        .catch(sendError(req, res))
}
