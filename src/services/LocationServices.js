const request = require('request-promise-native');
const {getRandomInt} = require('../helpers/CommonHelpers');
const geoip = require('geoip-lite');

const tokens = ['032eee1f361b33', 'f3595d340ca7c2', 'b277ee9c755718', '956e62f5f75f43', '0f591a1dbf9e74'];

const _IPInfo = (IP) => {
    const randomIndex = getRandomInt(0, tokens.length - 1);
    const token = tokens[randomIndex];

    return request({
        url: `https://ipinfo.io/${IP}`,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(response => {
        try {
            const obj = JSON.parse(response);

            if (!obj || !obj['ip']) {
                return Promise.resolve('NO IP');
            }

            return Promise.resolve(obj);
        } catch (error) {
            throw error;
        }
    });
};


exports.getLocationByIP = (IP) => {
    return _IPInfo(IP)
        .catch(error => {
            const location = geoip.lookup(IP);

            if (location && location.country) {
                return Promise.resolve(location);
            }

            return Promise.reject(error);
        });
};