const LoggerServices = require("../services/LoggerServices");

exports.sendSuccess = (req, res) => result => {
    return res.send({
        success: true,
        data: result
    });
};

exports.sendError = (req, res) => error => {
    LoggerServices.error('RESPONSE_ERROR', error);

    const message = typeof error === 'string' ? error : error.message || '';
    const code = error.code || false;

    const result = {
        success: false,
        message
    };

    if (code) {
        result.code = code;
    }

    res.send(result);
};

exports.catchError = (req, res) => error => {
    LoggerServices.error('RESPONSE_ERROR', error);

    const message = typeof error === 'string' ? error : error.message || '';

    res.status(500).send({
        success: false,
        message
    });
};