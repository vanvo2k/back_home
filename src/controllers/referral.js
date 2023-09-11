const ReferralActions = require('../actions/ReferralActions')
const {catchError} = require("../helpers/ResponseHelopers")

exports.catchReferral = (req, res) => {
    const {referralId} = req.params

    if (!referralId) {
        return res.redirect('/')
    }

    res.redirect(`/?ref=${referralId}`)
}

exports.getLinkShare = (req, res) => {
    const userId = req['authenticatedUserId']

    ReferralActions.getLinkShare(userId)
        .then(({link, referralId}) => {
            res.send({
                success: true,
                link,
                referralId
            })
        })
        .catch(catchError(req, res))
}
