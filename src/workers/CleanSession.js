const Session = require('../models/Session');

const limit = 20;

module.exports = () => {
    console.log(`[CLEAN_SESSION][${new Date()}] Starting....`);

    return Session
        .find({
            expired: {
                $lt: Date.now()
            }
        })
        .limit(limit)
        .sort({
            created: 1
        })
        .then(sessions => {
            sessions.forEach(session => {
                session.remove();
            });
        });
};

