const Setting = require('../models/Setting')
const difference = require('lodash/difference')
const compareVersions = require("compare-versions")

exports.getForceRefreshApp = (version) => {
    const currentVersion = '1.2.5'
    const userVersion = (version + '').replace('.first-visit', '')

    if (!userVersion || typeof userVersion !== 'string') {
        console.error('[OLD_VERSION]', version)

        return Promise.resolve({
            version: currentVersion,
            refresh: true
        })
    }

    try {
        const refresh = compareVersions(currentVersion, userVersion) > 0

        return Promise.resolve({
            version: currentVersion,
            refresh
        })
    } catch (error) {
        console.error(error)
        console.log(userVersion)

        return Promise.reject(error)
    }
}

exports.getSetting = ({key, userScopes}) => {
    const currentUserScopes = userScopes || []

    return Setting.findOne({
        key,
    }).then(setting => {
        if (!setting) {
            return Promise.reject('Setting not found.')
        }

        const {permissions} = setting

        if (!permissions || !permissions.length) {
            return Promise.resolve(setting)
        }

        if (permissions.indexOf('public') !== -1) {
            return Promise.resolve(setting)
        }

        const diff = difference(permissions, currentUserScopes)
        if (diff.length < permissions.length) {
            return Promise.resolve(setting)
        }

        return Promise.reject('Permission denied.')
    })
}
