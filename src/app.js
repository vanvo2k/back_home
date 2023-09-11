const express = require('express')
const app = express()
const errorHandler = require('errorhandler')
const bodyParser = require('body-parser')
const logger = require('morgan')
const compression = require('compression')
const cors = require('cors')
const cookieSession = require('cookie-session')
const passport = require('passport')
const Raven = require('raven')
const cookieParser = require('cookie-parser')

const scheduler = require('./app.scheduler')
const appConfig = require('./app.config')

/**
 * Express configuration.
 */
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(compression())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(logger('dev'))
app.use(cookieParser())
app.use(passport.initialize())
app.use(cookieSession({
    name: 'session',
    keys: ['__teeamz_'],
    maxAge: 7 * 24 * 60 * 60 * 1000
}))

/**
 * CORS
 */
const corsHelpers = require('tamz-middleware/helpers/cors')
const corsOptions = corsHelpers.getOptions()
app.use(cors(corsOptions))

/**
 * Config sentry
 */
if (process.env.NODE_ENV === 'production') {
    const dsn = appConfig.get('/sentry/dsn')
    Raven.config(dsn).install()
    app.use(Raven.requestHandler())
}

/**
 * Config routes.
 */
app.use(require('./app.routes'))

/**
 * Passport
 */
app.use(require('./app.passport').router)

/**
 * Error Handler.
 */
app.use(errorHandler())

/**
 * Schedules.
 */
scheduler.register()

/**
 * Remote services.
 */
require('./app.remote')

/**
 * Background tasks.
 */
require('./app.background')

/**
 * HTTPS Server
 */
if (process.env.NODE_ENV !== 'production') {
    const fs = require('fs')
    const spdy = require('spdy')
    const portHTTPS = appConfig.get('/portHTTPS')
    const key = fs.readFileSync(`${__dirname}/keys/server.key`)
    const cert = fs.readFileSync(`${__dirname}/keys/server.crt`)
    const ca = fs.readFileSync(`${__dirname}/keys/server.csr`)

    const spdyServer = spdy.createServer({key, cert, ca}, app)

    spdyServer.listen(portHTTPS, () => {
        console.log(`Listening HTTPS on port ${portHTTPS}`)
    })
}

/**
 * Start Express server.
 */
const server = require('http').createServer(app)
const port = appConfig.get('/port')
server.listen(port, () => {
    console.log(`Listening on port ${port}...`)
})
