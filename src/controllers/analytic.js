const ProductAnalyticActions = require('../actions/ProductAnalyticActions')
const {sendError, sendSuccess} = require('../helpers/ResponseHelopers')

exports.keyword = (req, res) => {
    const defaultArgs = {
        keyword: '',
        searchType: '',
        market: 'us'
    }

    const {keyword, searchType, market} = Object.assign({}, defaultArgs, req.body)

    ProductAnalyticActions.getStatsByKeyword(keyword, searchType, market)
        .then(sendSuccess(req, res))
        .catch(sendError(res, res))
}

exports.keywordCount = (req, res) => {
    const defaultArgs = {
        keyword: '',
        searchType: '',
        market: 'us'
    }

    const {keyword, searchType, market} = Object.assign({}, defaultArgs, req.body)

    ProductAnalyticActions.getHistogram(keyword, searchType, market)
        .then(sendSuccess(req, res))
        .catch(sendError(res, res))
}