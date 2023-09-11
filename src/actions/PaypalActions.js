const appConfig = require("../app.config")
const jwt = require("jsonwebtoken")
const request = require('request-promise')
const Bill = require('../models/Bill')

const ipnEndpoint = appConfig.get('/PayPal/ipn_endpoint')

console.log(ipnEndpoint)

exports.validateIPN = (data) => {
    return request.post(ipnEndpoint).form(data)
        .then(response => {
            if (response === 'VERIFIED') {
                return Promise.resolve()
            }

            console.log('[VERIFY_PAYPAl_RESPONSE]', response)

            return Promise.reject(new Error('Invalid IPN.'))
        })
}

exports.validateToken = (token) => {
    if (!token) {
        return Promise.reject(new Error('Empty token.'))
    }

    const secretKey = appConfig.get('/secretKey')

    return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return reject(new Error('Invalid JWT.'))
            } else {
                return resolve(decoded)
            }
        })
    })
}

exports.validateBilling = (billId) => {
    return Bill.findById(billId)
        .then((bill) => {
            if (!bill) {
                return Promise.reject(new Error(`Bill not found. [${billId}]`))
            }

            return Promise.resolve(bill)
        })
}

exports.ipn = ({postData, billValidated}) => {
    const {
        txn_id,
        payment_status,
        mc_gross,
        mc_currency,
        receiver_email,
        payer_email,
        payment_date,
        last_name,
        ipn_track_id,
        residence_country
    } = postData

    if (!txn_id) {
        return Promise.resolve('Skip!')
    }

    if (payment_status !== 'Completed') {
        return Promise.resolve('Pending!')
    }

    const {price, currency, _id, extend} = billValidated.toJSON()
    const email = extend.receiver_email

    if (email !== receiver_email) {
        console.error('Receiver email wrong!', _id)

        return Promise.reject('Receiver email wrong!')
    }

    if (parseFloat(mc_gross) !== parseFloat(price)) {
        console.error('Price wrong!', _id)

        return Promise.reject('price wrong!')
    }

    if (currency !== mc_currency) {
        console.error('Currency wrong!', _id)

        return Promise.reject('Currency wrong!')
    }

    const billStatus = billValidated.get('status')
    if (billStatus === 'completed') {
        return Bill.duplicateBill(billValidated)
            .then(bill => {
                return bill.completed({
                    extend: {
                        txn_id,
                        payment_date,
                        ipn_track_id,
                        payer_name: last_name,
                        payer_email,
                        payer_country: residence_country,
                    },
                    method: 'paypal'
                })
            })
            .then(bill => {
                return Promise.resolve('OK')
            })
    }

    return billValidated
        .completed({
            extend: {
                txn_id,
                payment_date,
                ipn_track_id,
                payer_name: last_name,
                payer_email,
                payer_country: residence_country,
            },
            method: 'paypal'
        })
        .then(bill => {
            return Promise.resolve('OK')
        })
}

exports.testIPN = ({postData, billId}) => {
    const {
        txn_id,
        payment_date,
        ipn_track_id,
        last_name,
        payer_email,
        residence_country
    } = postData

    return Bill.findById(billId)
        .then(bill => {
            if (!bill) {
                return Promise.reject(new Error('Bill not found!'))
            }

            return Promise.resolve(bill)
        })
        .then(bill => {
            return bill.completed({
                extend: {
                    txn_id,
                    payment_date,
                    ipn_track_id,
                    payer_name: last_name,
                    payer_email,
                    payer_country: residence_country,
                }
            })
        })
        .then((bill) => {
            return Promise.resolve('ok')
        })
}
