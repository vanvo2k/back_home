const SearchHistoryActions = require('../actions/SearchHistoryActions');
const {sendError, sendSuccess} = require('../helpers/ResponseHelopers');
const authHelpers = require('tamz-middleware/helpers/auth');

exports.getListHistories = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    const defaultArgs = {
        page: 1,
        limit: 100
    }

    const {page, limit} = Object.assign({}, defaultArgs, req.body)

    SearchHistoryActions.getListHistories({page, limit, userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getTotalQueries = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    SearchHistoryActions.getTotalQueries({userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.getRecentSearches = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req)

    SearchHistoryActions.getRecentSearches({userId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}