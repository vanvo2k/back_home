const createConnectionRedis = require('../libs/createRedis');
const appConfig = require('../app.config');
const redisConfig = appConfig.get('/redisSession');
const client = createConnectionRedis(redisConfig);

exports.addNewFraudUser = (userId, IPs) => {
    const totalIP = IPs && Array.isArray(IPs) ? Math.max(1, IPs.length) : 1;
    const score = (1000 / totalIP).toFixed(2);

    return client.zaddAsync('fraudulentUsers', score, userId);
};
