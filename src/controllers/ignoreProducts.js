const {catchError, sendSuccess} = require("../helpers/ResponseHelopers")
const authHelpers = require("tamz-middleware/helpers/auth")
const IgnoreProductsActions = require('../actions/IgnoreProductsActions')

exports.toggleIgnores = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const defaultArgs = {
        productId: '',
    }

    const {productId} = Object.assign({}, defaultArgs, req.body)

    IgnoreProductsActions.toggleIgnores({userId, productId})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getProductsFromIgnore = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const defaultArgs = {
        page: 1,
        limit: 100,
        sortBy: 'added_date'
    }

    const {page, limit, sortBy} = Object.assign({}, defaultArgs, req.query)
    const limitValidated = limit <= 100 ? parseInt(limit, 10) : 10

    return IgnoreProductsActions
        .getProductsFromIgnore({
            userId,
            page: parseInt(page, 10),
            limit: limitValidated,
            sortBy
        })
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getTotalItems = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    return IgnoreProductsActions.getTotalItems(userId)
        .then(
            total => {
                res.send({
                    success: true,
                    total
                })
            }
        ).catch(catchError(req, res))
}