const {scheduleJob} = require('node-schedule');
const {EVERY_TWELVE_HOURS} = require('./constants/Crontab');
const ValidateToken = require('./workers/ValidateToken');

exports.register = () => {
    console.log('Register cron jobs.');

    scheduleJob(EVERY_TWELVE_HOURS, ValidateToken);
};