exports.deprecatedAPI = (res) => {
    return res.send({
        success: false,
        message: 'You are using old version app. Please refresh your browser and try again.',
        notify: true,
        refresh: true,
    })
}
