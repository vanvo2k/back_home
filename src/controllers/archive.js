const ArchiveActions = require("../actions/ArchiveActions");
const {sendError, sendSuccess} = require("../helpers/ResponseHelopers");
const authHelpers = require("tamz-middleware/helpers/auth");
const {getUserIP} = require("../helpers/CommonHelpers");
const sDecode = require("../helpers/sDecode");
const {MAX_RANK_TRIAL} = require("../constants/Common");
const LoggingServices = require('../services/LoggingServices');
const {SEARCH_HISTORY_PRODUCTS} = require('../constants/Events');
const {PREFIX, transporter} = require('../services/TransportServices');

const _isTrial = (req) => {
    const scopes = authHelpers.getUserScopes(req);
    return scopes.indexOf('trial') !== -1;
}

exports.search = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req);
    const isTrial = _isTrial(req)
    const IP = getUserIP(req);
    const userAgent = req.headers['user-agent'] || '';

    const q = req.body.q || '';
    const payload = sDecode(q);
    const dataDefault = {
        page: 1,
        limit: 10,
        query: {},
        user: userId,
        rank: {
            from: 1,
            to: '',
        },
        price: {
            from: 0,
            to: 0
        },
        availableText: {
            from: null,
            to: null
        },
        dateText: '',
        sortBy: {
            field: 'rank'
        },
        type: 'all',
        brandType: 'all',
        category: 'clothing',
        market: 'us'
    }
    const args = Object.assign({}, dataDefault, payload);

    const {rank, market} = args;
    const {from, to} = rank;

    if (isTrial && to && to > MAX_RANK_TRIAL) {
        return res.send({
            success: false,
            message: `Your account only can access products with rank less than 1M. Please upgrade to a higher plan :)`,
            notify: true,
            upgradePlan: true
        })
    }

    const rankValidated = !isTrial ? rank : {
        from: from < MAX_RANK_TRIAL ? from : 0,
        to: to <= MAX_RANK_TRIAL ? to : MAX_RANK_TRIAL
    }

    const argsValidated = Object.assign({}, args, {rank: rankValidated, market})
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version';

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'SEARCH_PRODUCTS',
        section: 'HISTORICAL_ARCHIVE',
        IP,
        data: {
            IP,
            userAgent,
            query: argsValidated
        }
    })

    ArchiveActions.search(argsValidated)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
};

exports.getProductDetail = (req, res) => {
    const itemId = req.params.id || false;

    if (!itemId) {
        return res.send({
            success: false,
            message: 'Product id must not be empty.'
        })
    }

    const userId = authHelpers.authenticatedUserId(req);
    const IP = getUserIP(req);
    const version = req.body['app-version'] || req.query['app-version'] || req.headers['x-app-version'] || 'old-version';
    const userAgent = req.headers['user-agent'] || '';

    const {dateText} = req.query

    LoggingServices.info({
        request: req,
        app: version,
        owner: userId,
        event: 'PRODUCT_DETAILS',
        section: 'HISTORICAL_ARCHIVE',
        IP,
        data: {
            IP,
            userAgent
        }
    })

    ArchiveActions.getProductDetail(itemId, dateText)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}