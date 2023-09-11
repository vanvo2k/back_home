const request = require('request-promise-native');
const BlackListedServices = require('tamz-middleware/services/BlackListedServices');
const SlackNotification = require('./SlackNotification');
const createConnectionRedis = require('../libs/createRedis');
const appConfig = require('../app.config');
const redisConfig = appConfig.get('/redisSession');
const client = createConnectionRedis(redisConfig);
const User = require('../models/User');

const expires = 3600;

exports.goodRequest = (userId, score) => {
    const key = 'gre:' + userId;

    console.log('goodRequest', userId, score);

    return client.llenAsync(key)
        .then(total => {
            if (!total || total < 1) {
                return 0;
            }

            return client.lpopAsync(key);
        });
};

exports.badRequest = (userId, accessToken) => {
    const key = 'gre:' + userId;

    return client.llenAsync(key)
        .then(total => {
            if (total && total > 50) {
                client.delAsync(key);

                User.findById(userId)
                    .then(user => {
                        if (user) {
                            const email = user.get('email');
                            const IP = user.get('IP');
                            const location = user.get('location');

                            SlackNotification.sendMessage(`[block access token] userId: ${userId}, email: ${email}, IP: ${IP}, Location: ${JSON.stringify(location)}`);
                        } else {
                            SlackNotification.sendMessage(`[block access token] userId: ${userId}`);
                        }
                    });

                return BlackListedServices.addToBackList(accessToken);
            }

            return client.lpushAsync(key, '')
                .then(totalNow => {
                    if (!total) {
                        client.expireAsync(key, expires);
                    }

                    return totalNow;
                });
        });
};

exports.verify = (IP, token) => {
    return request({
        uri: 'https://www.google.com/recaptcha/api/siteverify',
        method: 'POST',
        form: {
            secret: '6Lc3vV4UAAAAAKDyy3drlqGfAcEzS4-LqAZJnuQ4',
            response: token,
            remoteip: IP,
        },
        json: true
    }).then(response => {
        const {success, score} = response;

        if (success) {
            return score;
        }

        return 2;
    }).catch(error => {
        console.log(error);

        throw error;
    });
};