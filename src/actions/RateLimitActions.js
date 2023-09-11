const UserBlackListServices = require('tamz-middleware/services/UserBlackListServices')
const BlackListedServices = require('tamz-middleware/services/BlackListedServices')
const BlockedEventActions = require("./BlockedEventActions")
const LoggerServices = require("../services/LoggerServices");

const createClient = require('../libs/createElasticSearch')
const appConfig = require('../app.config')
const loggingConfig = appConfig.get('/elasticLogging')
const Moment = require('moment')

const _client = createClient(loggingConfig)

const indexing = {
    index: 'spyamz_logging',
    type: 'events'
}

const _getTotalToday = (field, value) => {
    return _client.search({
        index: indexing.index,
        type: indexing.type,
        body: {
            size: 0,
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                [field]: {
                                    value
                                }
                            }
                        },
                        {
                            range: {
                                created: {
                                    gt: Moment().subtract(1, "day").format('DD/MM/YYYY'),
                                    format: "dd/MM/yyyy"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }).then(response => {
        const {hits} = response

        if (!hits || !hits.total) {
            return Promise.resolve(0)
        }

        return hits.total
    })
}

exports.limitSearch = ({isTrial, userId, IP, userAgent, accessToken, postData}) => {
    console.log('run rate limit')

    return Promise.all([
        _getTotalToday('owner.keyword', userId),
        _getTotalToday('IP.keyword', IP)
    ]).then(([totalPerUser, totalPerIP]) => {
        console.log('USER_RATE_LIMIT', userId, totalPerUser)
        console.log('USER_RATE_LIMIT', IP, totalPerIP)

        const MAX_REQUESTS_PER_DAY = isTrial ? 200 : 2000
        const MAX_REQUESTS_PER_DAY_BY_IP = isTrial ? 1000 : 10000

        if (totalPerUser > MAX_REQUESTS_PER_DAY || totalPerIP > MAX_REQUESTS_PER_DAY_BY_IP) {
            //IPBlackListServices.addToBackList(IP)
            BlackListedServices.addToBackList(accessToken)

            const message = 'Allowed rate limit breached'

            BlockedEventActions.log({
                userId,
                IP,
                userAgent,
                code: 'rate_limit',
                message,
                meta: {postData, totalPerUser, totalPerIP}
            })

            const tomorrow = Moment().add(1, 'day')
            const startTomorrow = Moment(tomorrow.format('DDMMYYYY'), 'DDMMYYYY')
            const remainTimeToday = startTomorrow.diff(Moment())

            UserBlackListServices.addToBackList(userId, parseInt(remainTimeToday / 1000, 10))
        }
    })
}

const _getTotalTodayEvent = (userId, event) => {
    return _client.search({
        index: indexing.index,
        type: indexing.type,
        body: {
            size: 0,
            query: {
                bool: {
                    must: [
                        {
                            term: {
                                'owner.keyword': userId
                            }
                        },
                        {
                            term: {
                                'event.keyword': event
                            }
                        },
                        {
                            range: {
                                created: {
                                    gt: Moment().subtract(1, "day").format('DD/MM/YYYY'),
                                    format: "dd/MM/yyyy"
                                }
                            }
                        }
                    ]
                }
            }
        }
    }).then(response => {
        const {hits} = response

        if (!hits || !hits.total) {
            return Promise.resolve(0)
        }

        return hits.total
    })
}

exports.limitAPICall = ({event, isTrial, userId, IP, userAgent, accessToken, postData}) => {
    LoggerServices.force().log('RUN_RATE_LIMIT', `userId ${userId} | event ${event}`)

    return _getTotalTodayEvent(userId, event).then((total) => {
        LoggerServices.force().log('USER_RATE_LIMIT', `userId: ${userId} | event: ${event} | total: ${total}`)

        let MAX_REQUESTS_PER_DAY = isTrial ? 100 : 2000
        if (event === 'REDIRECT_TO_PRODUCT_URL_V2')
            MAX_REQUESTS_PER_DAY = isTrial ? 100 : 4000
        if (event === 'SEARCH_PRODUCTS')
            MAX_REQUESTS_PER_DAY = isTrial ? 50 : 1000

        if (total > MAX_REQUESTS_PER_DAY) {
            //IPBlackListServices.addToBackList(IP)
            BlackListedServices.addToBackList(accessToken)

            const message = 'Allowed rate limit breached'

            BlockedEventActions.log({
                userId,
                IP,
                userAgent,
                code: 'rate_limit',
                message,
                meta: {postData, total, event}
            })

            const tomorrow = Moment().add(1, 'day')
            const startTomorrow = Moment(tomorrow.format('DDMMYYYY'), 'DDMMYYYY')
            const remainTimeToday = startTomorrow.diff(Moment())

            UserBlackListServices.addToBackList(userId, parseInt(remainTimeToday / 1000, 10))
        }
    })
}