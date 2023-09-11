const {catchError, sendSuccess} = require("../helpers/ResponseHelopers")
const authHelpers = require("tamz-middleware/helpers/auth")
const FavoriteProductsActions = require('../actions/FavoriteProductsActions')

exports.toggleFavorites = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const defaultArgs = {
        productId: '',
        categoryId: '',
    }

    const {productId, categoryId} = Object.assign({}, defaultArgs, req.body)

    FavoriteProductsActions.toggleFavorites({userId, productId, categoryId})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}
