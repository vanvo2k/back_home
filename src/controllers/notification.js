const NotificationActions = require('../actions/NotificationActions')
const {catchError} = require("../helpers/ResponseHelopers")
const authHelper = require("tamz-middleware/helpers/auth")

exports.countUnread = (req, res) => {
    const userId = req['authenticatedUserId']

    return NotificationActions.getCountUnread(userId)
        .then(count => {
            res.send({
                count: count,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.getList = (req, res) => {
    const userId = req['authenticatedUserId']

    return NotificationActions.getList(userId)
        .then(notifications => {
            res.send({
                data: notifications,
                success: true
            })
        })
        .catch(catchError(req, res))
}

exports.read = (req, res) => {
    const notificationId = req.params.id || false
    const userId = req['authenticatedUserId']

    return NotificationActions.read({userId, notificationId})
        .then(result => {
            return res.send({
                success: true,
                data: result
            })
        })
        .catch(catchError(req, res))
}

exports.readAll = (req, res) => {
    const userId = req['authenticatedUserId']

    return NotificationActions.readAll(userId)
        .then(result => {
            return res.send({
                success: true,
                data: result
            })
        })
        .catch(catchError(req, res))
}

exports.getNotificationBar = (req, res) => {
    const scopes = authHelper.getUserScopes(req)
    const isTrial = scopes.indexOf('trial') !== -1

    if (!isTrial) {
        return res.send({
            success: true,
            data: {
                message: ''
            }
        })
    }

    return res.send({
        success: true,
        data: {
            message: 'Sign up for a Pro account plan to see full features.',
            link: '/pricing',
            buttonText: 'Upgrade now!'
        }
    })
}
