const User = require('../models/User')
const appConfig = require('../app.config')
const appUrl = appConfig.get('/baseUrl')

exports.getLinkShare = (userId) => {
    return User.findById(userId)
        .then(user => {
            if (!user) {
                return Promise.reject(new Error('User not found!'))
            }

            return user.getReferralId()
        })
        .then(referralId => {
            const link = `${appUrl}/r/${referralId}`

            return Promise.resolve({link, referralId})
        })
}
