const moment = require('moment');

exports.oneMonthLater = () => {
    const oneMonthLater = moment().add(1, 'months');

    return oneMonthLater.valueOf();
};

exports.getDaysLater = (days = 0) => {
    const parseDays = parseInt(days, 10);
    const daysLater = moment().add(parseDays, 'days');

    return daysLater.valueOf();
};

exports.getTimeLater = (amount = 1, unit = 'month') => {
    const later = moment().add(amount, unit);

    return later.valueOf();
};