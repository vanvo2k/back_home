const express = require('express')
const router = express.Router()
const fuckingScrapers = require('spyamz-fucking-scrapers')

const Oauth = require('tamz-middleware/middleware/Oauth')
const Capability = require('tamz-middleware/middleware/Capability')
const Role = require('tamz-middleware/middleware/Role')
const BlackList = require('tamz-middleware/middleware/BlackList')
const RateLimit = require('tamz-middleware/middleware/RateLimit')

const authHelpers = require('tamz-middleware/helpers/auth')

const appConfig = require('./app.config')

const cheating = require('./controllers/cheating')
const rateLimit = require('./controllers/ratelimit')

/**
 * Register routes.
 */
const oauth = require('./controllers/oauth')
router.all('/ping', (req, res) => res.send('pong'))
router.all('/', (req, res) => res.redirect(appConfig.get('/webClient')))
router.get('/oauth', oauth.oauth)

/**
 * Users.
 */
const user = require('./controllers/user')
router.get('/user/logout', Oauth.isAuthorized, user.logOut)
router.get('/user/profile', Oauth.isAuthorized, user.getProfile)
router.get('/v2/user/profile', Oauth.isAuthorized, user.getProfileV2)
router.post('/user/settings', Oauth.isAuthorized, user.saveSettings)
router.post('/user/meta', Oauth.isAuthorized, user.saveMeta)
router.post('/user/phone-number', Oauth.isAuthorized, user.savePhoneNumber)
router.get('/user/settings', Oauth.isAuthorized, user.getSettings)
router.get('/user/scopes', Oauth.isAuthorized, user.getScopes)
router.all('/user/heartbeat', Oauth.isAuthorized, user.checkRefreshToken, user.getHeartbeat)

/**
 * Products.
 */
const product = require('./controllers/product')
router.post('/products/total', product.totalProducts)
router.post('/products/search',
    Oauth.isAuthorized,
    Capability.currentUserCan('getItems', 'all'),
    fuckingScrapers.fakeData(),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 5
    }),
    cheating.searchProduct, cheating.checkHeartBeat,
    rateLimit.limitAPICall('SEARCH_PRODUCTS'),
    cheating.checkAppVersion,
    product.search
)
router.post('/v2/products/search',
    Oauth.isAuthorized,
    Capability.currentUserCan('getItems', 'all'),
    fuckingScrapers.fakeData(),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60
    }),
    cheating.searchProduct, cheating.checkHeartBeat,
    rateLimit.limitAPICall('SEARCH_PRODUCTS'),
    cheating.checkAppVersion,
    user.checkRefreshToken,
    product.searchV2
)
router.get('/products/:id',
    Oauth.isAuthorized, Capability.currentUserCan('getItems', 'all'),
    fuckingScrapers.fakePostDetails(),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `pdt:user:${userId}`
        }
    }),
    rateLimit.limitAPICall('PRODUCT_DETAILS'),
    cheating.checkAppVersion,
    product.productDetail
)

router.get('/products/:id/trademark',
    Oauth.isAuthorized, Capability.currentUserCan('getItems', 'all'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `ptm:user:${userId}`
        }
    }),
    cheating.checkAppVersion,
    product.checkTrademark
)

router.post('/products/trends',
    Oauth.isAuthorized, Capability.currentUserCan('super-private'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    cheating.checkAppVersion,
    product.trends
)

router.get('/products/:id/link', product.redirectToUrlProduct)
router.get('/products/:id/similar',
    Oauth.isAuthorized,
    Capability.currentUserCan('getItems', 'all'),
    Role.currentUserHasRole('admin'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 10,
        window: 10,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `sp:user:${userId}`
        }
    }),
    cheating.checkAppVersion,
    product.getSimilarProducts
)
router.get('/v2/products/:id/similar',
    Oauth.isAuthorized,
    Capability.currentUserCan('getItems', 'all'),
    Capability.currentUserCan('access-beta', 'admin'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    product.getSimilarProductsV2
)
router.get('/v2/products/:id/redirect',
    Oauth.isAuthorized,
    BlackList.userNotBlocked, BlackList.blockedIP,
    Capability.currentUserCan('getItems', 'all'),
    rateLimit.limitAPICall('REDIRECT_TO_PRODUCT_URL_V2'),
    product.redirectToUrlProductV2,
)

router.get('/products/:id/asin',
    Oauth.isAuthorized,
    BlackList.userNotBlocked, BlackList.blockedIP,
    Capability.currentUserCan('getItems', 'all'),
    rateLimit.limitAPICall('GET_ASIN'),
    product.getASIN
)

router.post('/products/export', Oauth.isAuthorized, Capability.currentUserCan('csv-export', 'all'), product.exportSearchResult)

/**
 * Items statistic.
 */
const itemStatistic = require('./controllers/item-statistic')
router.get('/items/statistic/overview', itemStatistic.getOverview)
router.get('/items/statistic/has-rank', itemStatistic.getHasRank)
router.get('/items/statistic/update', itemStatistic.getStatisticByDate)
router.get('/items/statistic/rank-ranges', itemStatistic.getRangeRankStatistic)
router.get('/items/statistic/types', itemStatistic.getItemTypesStatistic)
router.get('/items/statistic/top-rising', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, Capability.currentUserCan('getItems', 'all'), itemStatistic.getItemsTopRising)
router.get('/items/statistic/random',
    Oauth.isAuthorized,
    BlackList.userNotBlocked, BlackList.blockedIP,
    Capability.currentUserCan('getItems', 'all'),
    RateLimit.limit({
        limit: 10,
        window: 2,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `rp:user:${userId}`
        }
    }),
    cheating.checkAppVersion, cheating.checkHeartBeat,
    itemStatistic.getItemsRandom
)
router.get('/items/statistic/bsr', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, Capability.currentUserCan('getItems', 'all'), itemStatistic.getItemsBestSellerRank)

/**
 * Favorites
 */
const favorite = require('./controllers/favorite')
router.post('/favorites', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.getItems)
router.get('/favorites/total', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.getTotalItems)

router.get('/favorites/categories', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.getListCategories)
router.post('/favorites/categories', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.createCategory)
router.delete('/favorites/categories/:id', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.deleteCategory)
router.patch('/favorites/categories/:id', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.updateCategory)
router.put('/favorites/categories/:id', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.updateCategory)
router.get('/favorites/categories/:id', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.getCategoryDetails)
router.get('/favorites/categories/:id/total', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.getTotalProductsByCategory)
router.get('/favorites/categories/:id/products', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favorite.getProductsByCategory)

/**
 * Product favorite.
 */
const favoriteProducts = require('./controllers/favoriteProducts')
router.post('/favorite-products/toggle', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, favoriteProducts.toggleFavorites)

/**
 * Keywords.
 */
const keyword = require('./controllers/keyword')
router.get('/keywords/v2', Oauth.isAuthorized, keyword.getListKeywords)
router.get('/v2/keywords', Oauth.isAuthorized, BlackList.userNotBlocked, keyword.getListKeywordsV2)
router.get('/keywords/options', Oauth.isAuthorized, keyword.getOptionsAvailable)

/**
 * Paypal
 */
const paypal = require('./controllers/paypal')
router.post('/paypal/ipn', paypal.log, paypal.validateIPN, paypal.validateToken, paypal.validateBilling, paypal.ipn)
router.post('/paypal/testIPN', paypal.log, paypal.testIPN)

/**
 * Referral.
 */
const referral = require('./controllers/referral')
router.get('/referral/link', Oauth.isAuthorized, referral.getLinkShare)
router.get('/r/:referralId', referral.catchReferral)

/**
 * Notifications.
 */
const notification = require('./controllers/notification')
router.get('/notifications', Oauth.isAuthorized, notification.getList)
router.get('/notifications/unread/count', Oauth.isAuthorized, notification.countUnread)
router.get('/notifications/read/:id', Oauth.isAuthorized, notification.read)
router.get('/notifications/readAll', Oauth.isAuthorized, notification.readAll)
router.get('/notifications/bar', Oauth.isAuthorized, notification.getNotificationBar)

/**
 * Settings
 */
const setting = require('./controllers/setting')
router.get('/settings/force-refresh', setting.getForceRefreshApp)
router.get('/settings', Oauth.maybeAuthorized, setting.getSetting)

/**
 * Trademarks.
 */
const trademark = require('./controllers/trademark')
router.get('/trademarks', Oauth.isAuthorized, BlackList.blockedIP, trademark.getListTrademarks)
router.post('/trademarks', Oauth.isAuthorized,
    BlackList.userNotBlocked,
    BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `tm:user:${userId}`
        }
    }),
    trademark.limitMaxKeywords, trademark.createNewTrademark
)

router.post('/trademarks/:id/refresh', Oauth.isAuthorized, BlackList.blockedIP, trademark.refreshManual)
router.post('/trademarks/:id/read', Oauth.isAuthorized, BlackList.blockedIP, trademark.markRead)
router.get('/trademarks/total/warnings', Oauth.isAuthorized, BlackList.blockedIP, trademark.getTotalWarnings)
router.get('/trademarks/statistic', Oauth.isAuthorized, BlackList.blockedIP, trademark.getStatistic)
// router.get('/trademarks/statistic',BlackList.blockedIP, trademark.getStatistic); //ko can token --> test
router.get('/trademarks/:id', Oauth.isAuthorized, BlackList.blockedIP, trademark.getTrademarkDetail)
router.delete('/trademarks/:id', Oauth.isAuthorized,
    BlackList.userNotBlocked,
    BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `tm:user:${userId}`
        }
    }),
    trademark.deleteTrademark
)

/**
 * Events.
 */
const event = require('./controllers/event')
router.get('/events/list', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, Capability.currentUserCan('getItems', 'all'), event.getListEvents)
router.get('/events/all', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, Capability.currentUserCan('getItems', 'all'), event.getAllEvents)
router.post('/events/products', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, Capability.currentUserCan('getItems', 'all'), event.getProducts)

/**
 * Queries.
 */
const query = require('./controllers/query')
router.post('/queries', Oauth.isAuthorized, BlackList.blockedIP, query.createQuery)
router.get('/queries', Oauth.isAuthorized, BlackList.blockedIP, query.getListQueries)
router.delete('/queries/:id', Oauth.isAuthorized, BlackList.blockedIP, query.deleteQuery)

/**
 * Analytics.
 */
const analyticCtrl = require('./controllers/analytic')
router.post('/analytic/keyword', Oauth.isAuthorized, BlackList.blockedIP, BlackList.userNotBlocked, analyticCtrl.keyword)
router.post('/analytic/keyword/count', Oauth.isAuthorized, BlackList.blockedIP, BlackList.userNotBlocked, analyticCtrl.keywordCount)

/**
 * Historical archive.
 */
const archive = require('./controllers/archive');
router.post('/archive/search',
    Oauth.isAuthorized,
    Capability.currentUserCan('getItems', 'all'),
    fuckingScrapers.fakeData(),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60
    }),
    cheating.searchProduct, cheating.checkHeartBeat,
    rateLimit.limitAPICall('SEARCH_PRODUCTS'),
    cheating.checkAppVersion,
    archive.search
);

router.get('/archive/:id',
    Oauth.isAuthorized, Capability.currentUserCan('getItems', 'all'),
    fuckingScrapers.fakePostDetails(),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `pdt:user:${userId}`
        }
    }),
    rateLimit.limitAPICall('PRODUCT_DETAILS'),
    cheating.checkAppVersion,
    archive.getProductDetail
);

/**
 * Search history
 */
const searchHistory = require('./controllers/searchHistory');
router.post('/histories', Oauth.isAuthorized, BlackList.blockedIP, BlackList.userNotBlocked, searchHistory.getListHistories)
router.get('/histories/total', Oauth.isAuthorized, BlackList.blockedIP, BlackList.userNotBlocked, searchHistory.getTotalQueries)
router.get('/histories/recent', Oauth.isAuthorized, BlackList.blockedIP, BlackList.userNotBlocked, searchHistory.getRecentSearches)

/**
 *  Announcements
 */
const announcement = require('./controllers/announcement');
router.get('/announcements', Oauth.isAuthorized, BlackList.blockedIP, announcement.getAnnouncement);
router.get('/announcements/:id/read', Oauth.isAuthorized, BlackList.blockedIP, announcement.markRead);
router.get('/announcements/count-unread', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, announcement.countUnread)

/**
 * Spyggs products
 */
const spyggsProduct = require('./controllers/spyggs-item');
router.post('/v2/ggs-items/search',
    Oauth.isAuthorized,
    Capability.currentUserCan('ggs-user', 'admin'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60
    }),
    cheating.searchProduct, cheating.checkHeartBeat,
    rateLimit.limitAPICall('SEARCH_PRODUCTS'),
    cheating.checkAppVersion,
    user.checkRefreshToken,
    spyggsProduct.searchV2
)
router.get('/ggs-items/:id',
    Oauth.isAuthorized,
    Capability.currentUserCan('ggs-user', 'admin'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    RateLimit.limit({
        limit: 30,
        window: 60,
        getKey: (req, res) => {
            const userId = authHelpers.authenticatedUserId(req)

            return `pdt:user:${userId}`
        }
    }),
    rateLimit.limitAPICall('PRODUCT_DETAILS'),
    cheating.checkAppVersion,
    spyggsProduct.productDetail
)
router.post('/ggs-items/total', spyggsProduct.totalProducts)
router.get('/v2/ggs-items/:id/similar',
    Oauth.isAuthorized,
    Capability.currentUserCan('ggs-user', 'admin'),
    BlackList.userNotBlocked, BlackList.blockedIP,
    spyggsProduct.getSimilarProductsV2
)

/**
 * Spyggs saved queries
 */
const spyggsQuery = require('../src/controllers/spyggs-query')
router.post('/ggs-queries', Oauth.isAuthorized, BlackList.blockedIP, spyggsQuery.createSpyggsQuery)
router.get('/ggs-queries', Oauth.isAuthorized, BlackList.blockedIP, spyggsQuery.getListSpyggsQueries)
router.delete('/ggs-queries/:id', Oauth.isAuthorized, BlackList.blockedIP, spyggsQuery.deleteSpyggsQuery)

router.post('/user/affiliate', Oauth.isAuthorized, BlackList.blockedIP, BlackList.userNotBlocked, user.updateAffiliate)
/**
 * Exports.
 */

/**
 * Ignore items
 */
const ignoreProducts = require('./controllers/ignoreProducts')
router.post('/ignore-products/toggle', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, ignoreProducts.toggleIgnores)
router.get('/ignores/products', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, ignoreProducts.getProductsFromIgnore)
router.get('/ignores/total', Oauth.isAuthorized, BlackList.userNotBlocked, BlackList.blockedIP, ignoreProducts.getTotalItems)

module.exports = router
