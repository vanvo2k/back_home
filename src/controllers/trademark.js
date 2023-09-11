const TrademarkActions = require('../actions/TrademarkActions')
const {getUserIP} = require('../helpers/CommonHelpers')
const {catchError, sendSuccess, sendError} = require("../helpers/ResponseHelopers")


exports.markRead = (req, res) => {
    const userId = req['authenticatedUserId']
    const {id} = req.params

    return TrademarkActions.markRead({id, userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getTrademarkDetail = (req, res) => {
    const userId = req['authenticatedUserId']
    const {id} = req.params

    return TrademarkActions.getTrademarkDetail({id, userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getListTrademarks = (req, res) => {
    const userId = req['authenticatedUserId']

    const defaultArgs = {
        page: 1,
        limit: 10,
        sortBy: 'created'
    }

    const {page, limit, sortBy} = Object.assign({}, defaultArgs, req.query)
    return TrademarkActions
        .getListTrademarks({
            userId,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            sortBy
        })
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.limitMaxKeywords = (req, res, next) => {
    const userId = req['authenticatedUserId']

    TrademarkActions.getTotal(userId)
        .then(({total, max}) => {
            if (total < max) {
                return next()
            }

            res.send({
                success: false,
                message: 'You can not add more any keywords.'
            })
        })
        .catch(catchError(req, res))
}

exports.createNewTrademark = (req, res) => {
    const userId = req['authenticatedUserId']
    const IP = getUserIP(req)

    const defaultArgs = {
        text: '',
    }

    const {text} = Object.assign({}, defaultArgs, req.body)

    const words = (text + '').trim().split(' ')
        .filter(word => !!word)

    if (words.length > 50) {
        return sendError(req, res)(new Error('The length of the sentence should not exceed 50 words'))
    }

    return TrademarkActions.createNewTrademark({userId, text, IP})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.deleteTrademark = (req, res) => {
    const userId = req['authenticatedUserId']
    const {id} = req.params

    return TrademarkActions.deleteTrademark({userId, id})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.refreshManual = (req, res) => {
    const userId = req['authenticatedUserId']
    const {id} = req.params

    return TrademarkActions.refreshManual({userId, id})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getTotalWarnings = (req, res) => {
    const userId = req['authenticatedUserId']

    return TrademarkActions.getTotalWarnings({userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getStatistic = (req, res) => {
    const userId = req['authenticatedUserId']
    return TrademarkActions.getStatistic({userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}