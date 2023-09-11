const AnnouncementActions = require('../actions/AnnouncementActions');
const {sendSuccess, sendError} = require('../helpers/ResponseHelopers');
const authHelpers = require('tamz-middleware/helpers/auth')

exports.getAnnouncement = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req);
    const scopes = authHelpers.getUserScopes(req);

    return AnnouncementActions.getAnnouncementV2({userId, scopes})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.markRead = (req, res) => {
    const userId = authHelpers.authenticatedUserId(req);
    const announcementId = req.params.id || ''

    return AnnouncementActions.markRead({userId, announcementId})
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.createAnnouncement = (req, res) => {
    const defaultArgs = {send_to: ['all_users']}
    const args = Object.assign({}, defaultArgs, req.body)

    return AnnouncementActions.createAnnouncement(args)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}

exports.countUnread = (req, res) => {
    const scopes = authHelpers.getUserScopes(req)
    const userId = authHelpers.authenticatedUserId(req)

    return AnnouncementActions.countUnread(userId, scopes)
        .then(sendSuccess(req, res))
        .catch(sendError(req, res))
}