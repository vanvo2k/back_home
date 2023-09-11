const Notification = require('../models/Notification');

exports.createNotification = (args) => {
    const data = Object.assign({}, {
        title: '',
        description: '',
        sent_to: null
    }, args);

    return new Notification(data)
        .save(doc => {
            console.log(doc);

            return Promise.resolve(doc.toJSON());
        });
};