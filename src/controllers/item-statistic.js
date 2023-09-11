const Moment = require('moment')
const ItemStatisticActions = require('../actions/ItemStatisticActions')
const {catchError, sendSuccess} = require("../helpers/ResponseHelopers")
const authHelpers = require('tamz-middleware/helpers/auth')
const LoggingServices = require("../services/LoggingServices")
const {getUserIP} = require("../helpers/CommonHelpers")
const {MAX_RANK_TRIAL} = require("../constants/Common")

const _isTrial = (req) => {
    const scopes = authHelpers.getUserScopes(req)
    return scopes.indexOf('trial') !== -1
}

exports.getItemsBestSellerRank = (req, res) => {
    const isTrial = _isTrial(req)
    const maxRank = isTrial ? MAX_RANK_TRIAL : null

    ItemStatisticActions.getItemsBestSellerRank({maxRank})
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getItemsRandom = (req, res) => {
    const isTrial = _isTrial(req)
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version'
    const userId = authHelpers.authenticatedUserId(req)
    const IP = getUserIP(req)
    const userAgent = req.headers['user-agent'] || ''

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'RANDOM_PRODUCTS',
        IP,
        data: {
            IP,
            userAgent,
        }
    })

    ItemStatisticActions.getItemsRandom(isTrial)
        .then(sendSuccess(req, res))
        .catch(catchError(req, res))
}

exports.getItemsTopRising = (req, res) => {
    const scopes = authHelpers.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1
    const minRank = 1
    const minTrending = isTrial ? 1 : 50

    ItemStatisticActions.getItemsTopRising({minRank, minTrending})
        .then(result => {
            res.send({
                data: result,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.getHasRank = (req, res) => {
    const defaultDate = Moment().subtract(30, 'day')

    const argsDefault = {
        from: defaultDate.format('DD-MM-YYYY')
    }

    const args = Object.assign({}, argsDefault, req.query)
    const {from} = args

    const momentDate = Moment(from, 'DD-MM-YYYY')
    const fromDate = momentDate.isValid() ? momentDate.valueOf() : defaultDate.valueOf()

    ItemStatisticActions.getHasRank(fromDate)
        .then(result => {
            res.send({
                data: result,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.getOverview = (req, res) => {
    const defaultDate = Moment().subtract(30, 'day')

    const argsDefault = {
        from: defaultDate.format('DD-MM-YYYY')
    }

    const args = Object.assign({}, argsDefault, req.query)
    const {from} = args

    const momentDate = Moment(from, 'DD-MM-YYYY')
    const fromDate = momentDate.isValid() ? momentDate.valueOf() : defaultDate.valueOf()

    ItemStatisticActions.getOverview(fromDate)
        .then(result => {
            res.send({
                data: result,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.getStatisticByDate = (req, res) => {
    const defaultDate = Moment().subtract(30, 'day')

    const argsDefault = {
        date: defaultDate.format('DD-MM-YYYY')
    }

    const args = Object.assign({}, argsDefault, req.query)
    const {date} = args

    const momentDate = Moment(date, 'DD-MM-YYYY')
    const dateString = momentDate.isValid() ? date : defaultDate.format('DD-MM-YYYY')

    ItemStatisticActions.getStatisticByDate(dateString)
        .then(result => {
            res.send({
                data: result,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.getRangeRankStatistic = (req, res) => {
    ItemStatisticActions.getRangeRank()
        .then(result => {
            res.send({
                data: result,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.getItemTypesStatistic = (req, res) => {
    ItemStatisticActions.getTypes()
        .then(result => {
            res.send({
                data: result,
                success: true
            })
        })
        .catch(catchError(req, res))
}
