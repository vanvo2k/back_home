const jwt = require('jsonwebtoken');
const appConfig = require('../app.config');

const generateToken = (args) => {
    const key = appConfig.get('/secretKey');

    return jwt.sign(args, key, {
        expiresIn: "30 days"
    });
};

const _validateDurationUnit = (unit) => {
    if (!unit) {
        return 'M';
    }

    const maps = {
        'D': ['day', 'days', 'd'],
        'W': ['week', 'weeks', 'w'],
        'M': ['month', 'months', 'm'],
        'Y': ['year', 'years', 'y']
    };

    for (let key in maps) {
        const values = maps[key];

        for (let i = 0; i < values.length; i++) {
            const text = values[i];

            if (text.toLowerCase() === unit.toLowerCase()) {
                return key;
            }
        }
    }

    return 'M';
};

exports.getEmailReceiver = () => {
    const PayPalConfig = appConfig.get('/PayPal');
    return PayPalConfig['receiver'];
};

exports.getLinkSubscription = ({billId, planName, price, currency, durationUnit = 'M', durationAmount = 1}) => {
    const PayPalConfig = appConfig.get('/PayPal');
    const business = PayPalConfig['receiver'];
    const {return_, cancel_return, notify_url} = PayPalConfig;
    const appClient = appConfig.get('/webClient');
    const baseAPI = appConfig.get('/baseUrl');
    const token = generateToken({billId});
    const unitValidated = durationUnit ? _validateDurationUnit(durationUnit) : 'M';
    const amountValidated = durationAmount ? durationAmount : 1;

    return PayPalConfig['endpoint']
        + `?cmd=_xclick-subscriptions`
        + `&p3=${amountValidated}`
        + `&t3=${unitValidated}`
        + `&src=1`
        + `&no_note=1`
        + `&no_shipping=1`
        + `&callback_timeout=3`
        + `&callback_version=1.0.0`
        + `&charset=utf-8`
        + `&item_name=${planName}`
        + `&item_number=${billId}`
        + `&return=${appClient}${return_}`
        + `&cancel_return=${appClient}${cancel_return}`
        + `&notify_url=${baseAPI}${notify_url}`
        + `&business=${business}`
        + `&a3=${price}`
        + `&custom=${token}`
        + `&currency_code=${currency}`;
};