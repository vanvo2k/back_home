const {catchError, sendSuccess} = require("../helpers/ResponseHelopers")
const FavoriteActions = require('../actions/FavoriteActions')
const authHelpers = require("tamz-middleware/helpers/auth")

exports.getTotalItems = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    return FavoriteActions.getTotalItems(userId)
        .then(
            total => {
                res.send({
                    success: true,
                    total
                })
            }
        ).catch(catchError(req, res))
}

exports.getItems = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    const defaultArgs = {
        page: 1,
        limit: 10
    }

    const args = Object.assign({}, defaultArgs, req.body)
    const {page, limit} = args

    return FavoriteActions.getItems({
        userId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }).then(result => {
        res.send(result)
    }).catch(catchError(req, res))
}

exports.getListCategories = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    const defaultArgs = {
        productId: '',
        term: ''
    }

    const {productId, term} = Object.assign({}, defaultArgs, req.query)

    return FavoriteActions.getListCategories({userId, productId, term})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.createCategory = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const defaultArgs = {title: '', productId: ''}
    const args = Object.assign({}, defaultArgs, req.body)
    const {title, productId} = args

    if (!title) {
        return res.send({
            success: false,
            message: 'Please type some text.'
        })
    }

    return FavoriteActions.createCategory({userId, title, productId})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.deleteCategory = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const {id} = req.params

    return FavoriteActions.deleteCategory({userId, categoryId: id})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getCategoryDetails = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const {id} = req.params

    return FavoriteActions.getCategoryDetails({userId, categoryId: id})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.updateCategory = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const defaultArgs = {title: '', description: ''}
    const {title, description} = Object.assign({}, defaultArgs, req.body)
    const {id} = req.params

    return FavoriteActions.updateCategory({userId, categoryId: id, title, description})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getProductsByCategory = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const defaultArgs = {
        page: 1,
        limit: 100,
        sortBy: 'added_date'
    }

    const categoryId = req.params['id']
    const {page, limit, sortBy} = Object.assign({}, defaultArgs, req.query)
    const limitValidated = limit <= 100 ? parseInt(limit, 10) : 10

    return FavoriteActions
        .getProductsByCategory({
            userId,
            categoryId,
            page: parseInt(page, 10),
            limit: limitValidated,
            sortBy
        })
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getTotalProductsByCategory = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)
    const categoryId = req.params['id']


    FavoriteActions.getTotalProductsByCategory({userId, categoryId})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}
