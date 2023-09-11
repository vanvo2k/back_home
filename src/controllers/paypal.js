const PaypalActions = require('../actions/PaypalActions')
const queryString = require("querystring")

exports.log = (req, res, next) => {
    console.log(`[PAYPAL][${new Date()}]`, JSON.stringify(req.body))

    next()
}

exports.validateIPN = (req, res, next) => {
    const formUrlEncodedBody = queryString.stringify(req.body)
    const verificationBody = `cmd=_notify-validate&${formUrlEncodedBody}`

    console.log('[PAYPAL_IPN]', verificationBody)

    PaypalActions.validateIPN(verificationBody)
        .then(() => {
            next()
        })
        .catch((error) => {
            console.error(error)
            const message = error.message || ''

            console.error('[PAYPAL_IPN]', message)

            res.status(403).send(message)
        })
}

exports.validateToken = (req, res, next) => {
    const {custom, item_number} = req.body

    PaypalActions.validateToken(custom)
        .then(decoded => {
            req['ipnToken'] = decoded
            next()
        })
        .catch(error => {
            console.warn('[PAYPAL_VALIDATE_TOKEN_ERROR]', error.message)

            req['ipnToken'] = {billId: item_number}
            next()
        })
}

exports.validateBilling = (req, res, next) => {
    const custom = req['ipnToken']
    const {billId} = custom

    PaypalActions.validateBilling(billId)
        .then((bill) => {
            req.billValidated = bill
            return next()
        })
        .catch(error => {
            console.error(error)

            return res.status(500).send(error.message || '')
        })
}

exports.ipn = (req, res) => {
    const {billValidated} = req
    const postData = req.body

    PaypalActions.ipn({postData, billValidated})
        .then(message => {
            res.send(message)
        })
        .catch(error => {
            return res.status(500).send(error.message || '')
        })
}

exports.testIPN = (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404)
    }

    const billId = req.body.bill || false
    const postData = req.body

    PaypalActions.testIPN({postData, billId})
        .then(message => {
            res.send(message)
        })
        .catch(error => {
            console.error(error)

            res.status(500).send(error.message || '')
        })
}
