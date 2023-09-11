const Notification = require('../models/Notification')

exports.getCountUnread = (userId) => {
    return Notification.count({
        sent_to: userId,
        seen: false
    })
}

exports.getList = (userId) => {
    return Notification.find({
        sent_to: userId
    })
}

exports.read = ({userId, notificationId}) => {
    return Notification
        .updateMany({
            _id: notificationId,
            sent_to: userId
        })
        .then(result => {
            console.log(result)

            return Promise.resolve(result)
        })
}

exports.readAll = (userId) => {
    return Notification.updateMany(
        {
            sent_to: userId
        },
        {
            $set: {
                seen: true
            }
        }
    )
}
