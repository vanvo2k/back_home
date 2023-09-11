const BlockedEvent = require("../models/BlockedEvent")
const SlackNotification = require("../services/SlackNotification")

exports.log = ({userId, IP, userAgent, code = 'fraud', message = '', meta = {}}) => {
    const event = new BlockedEvent({
        owner: userId,
        IP,
        code,
        userAgent,
        message,
        meta
    })

    const notifyMessage = `A new blocked event: ${code} with message: "${message}" of user: ${userId} with IP:${IP}.\nMeta: ${JSON.stringify(meta)}`
    SlackNotification.sendMessage(notifyMessage)

    return event.save()
}
