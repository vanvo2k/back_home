const Base64 = require('js-base64').Base64;

exports.base64Encode = (input) => {
    const buf = Buffer.from(input, 'utf8');

    return buf.toString('base64');
};

exports.base64Decode = (input) => {
    // const buf = Buffer.from(input, 'base64');
    return Base64.decode(input)
    // return buf.toString('utf8');
};

exports.parseJSON = (args) => {
    if (typeof  args !== 'string') {
        return args;
    }

    try {
        return JSON.parse(args);
    } catch (e) {
        return args;
    }
};

exports.getUserIP = (req) => {
    const IP = req.ip;
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
        if (forwarded.indexOf(',') === -1) {
            return forwarded;
        }

        const ips = forwarded.split(',');
        return ips ? ips[0] : IP;
    }

    return req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress ||
        IP;
};

exports.getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.throwErrorWithCode = (message, code) => {
    const error = new Error(message);
    error.code = code;

    throw error;
};

exports.arrayToObject = (arr, keyField) => {
    return arr.reduce((obj, item) => {
        obj[item[keyField]] = item;

        return obj;
    }, {});
};