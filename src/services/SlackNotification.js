const request = require('request-promise-native');

const url = 'https://hooks.slack.com/services/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';

exports.sendMessage = (message) => {
    const payload = JSON.stringify({
        text: message
    });

    return request({
        url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: payload
    });
};