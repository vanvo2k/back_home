const moment = require('moment')
const {sendError, sendSuccess} = require("../helpers/ResponseHelopers")
const KeywordActions = require('../actions/KeywordActions')
const DeprecatedActions = require('../actions/DeprecatedActions')

exports.getOptionsAvailable = (req, res) => {
    KeywordActions.getOptions()
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getListKeywordsV2 = (req, res) => {
    const today = moment().format('DD-MM-YYYY')

    const defaultQueries = {
        date: today,
        rank: 100000,
        count: 1,
        page: 1,
        limit: 10,
        term: ''
    }

    const {date, rank, page, limit, term} = Object.assign({}, defaultQueries, req.query)

    let dateValidated = today
    const dateMoment = moment(date, 'DD-MM-YYYY')
    if (dateMoment.isValid()) {
        dateValidated = dateMoment.format('DD-MM-YYYY')
    }

    KeywordActions
        .getListKeywordsV2({
            term,
            date: dateValidated,
            maxRank: rank,
            page: parseInt(page, 10),
            limit: parseInt(limit, 10)
        })
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getListKeywords = (req, res) => {
    DeprecatedActions.deprecatedAPI(req)
}
