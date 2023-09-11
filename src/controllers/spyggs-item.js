const SpyggsItemActions = require('../actions/SpyggsItemActions')
const {sendError, sendSuccess} = require("../helpers/ResponseHelopers")
const authHelpers = require("tamz-middleware/helpers/auth")
const sDecode = require("../helpers/sDecode")

exports.searchV2 = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

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
        minPrice: {
            from: 0,
            to: 0
        },
        maxPrice: {
          from: 0,
          to: 0
        },
        sortBy: {
            field: 'rank'
        },
        market: 'us'
    }
    const args = Object.assign({}, dataDefault, payload)

    SpyggsItemActions.search(args)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.productDetail = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const itemId = req.params.id || false
    const scopes = authHelpers.getUserScopes(req)

    if (!itemId) {
        return res.send({
            success: false,
            message: 'Product id must be not empty.'
        })
    }

    SpyggsItemActions.getItemDetail(itemId, userId, scopes)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.totalProducts = (req, res) => {
    SpyggsItemActions.getTotalProducts()
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getSimilarProductsV2 = (req, res) => {
    const productId = req.params.id || false
    const userId = authHelpers.authenticatedUserId(req)

    const defaultArgs = {
        page: 1
    }

    const {page} = Object.assign({}, defaultArgs, req.query)

    SpyggsItemActions.getSimilarProductV2({userId, productId, page: parseInt(page, 10)})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}