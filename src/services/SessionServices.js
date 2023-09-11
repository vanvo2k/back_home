const Session = require('../models/Session');
const moment = require('moment');
const NATS = require('nats');
const randToken = require('rand-token');
const SessionLoggerServices = require('./SessionLoggerServices');
const {transporter, PREFIX} = require('../services/TransportServices');

exports.createNewSession = ({userId, IP, uuid}) => {
    const args = {userId, IP, uuid};

    return new Promise((resolve, reject) => {
        transporter.requestOne(`${PREFIX}.CREATE_A_NEW_SESSION`, args, {}, 10000, (response) => {
            if (response instanceof NATS.NatsError && response.code === NATS.REQ_TIMEOUT) {
                return reject(new Error('Request timed out.'));
            }

            const {success, data, message} = response;
            if (!success) {
                return reject(new Error(message));
            }

            return resolve(data);
        });
    });
};

const _revokeSession = (sessionId) => {
    console.log('REVOKE_SESSION', sessionId);

    return Session.findById(sessionId)
        .then(session => {
            if (!session) {
                throw new Error('Session not found!');
            }

            const status = session.get('status');

            if (status === 'revoked') {
                throw new Error('Session was revoked!');
            }

            return Promise.resolve(session);
        })
        .then(session => {
            return session.update({
                $set: {
                    status: 'revoked',
                    message: 'FRAUDULENT',
                    updated: Date.now()
                }
            });
        })
        .then(() => {
            return Session.findById(sessionId);
        });
};

exports.isRevoked = ({refreshToken, userId, IP, uuid}) => {
    console.log('Check UUID', uuid, IP, userId);

    return Session.findOne({
        refreshToken,
        owner: userId,
    }).then(session => {
        if (!session) {
            return Promise.resolve(true);
        }

        const status = session.get('status');

        if (status === 'revoked') {
            return Promise.resolve(true);
        }

        const sessionId = session._id;
        const oldUUID = session.get('uuid');
        const originIP = session.get('IP');
        const IPs = Array.isArray(session.get('IPs')) ? session.get('IPs') : [];
        const UUIDs = Array.isArray(session.get('uuids')) ? session.get('uuids') : [];

        //Save IP
        if (IPs.indexOf(IP) === -1) {
            session.update({
                $push: {
                    IPs: IP
                },
                $set: {
                    updated: Date.now()
                }
            }).then(updated => {
                console.log(updated);
            });

            IPs.push(IP);
        }

        //Save uuid
        if (UUIDs.indexOf(uuid) === -1 && uuid) {
            session.update({
                $push: {
                    uuids: uuid
                },
                $set: {
                    updated: Date.now()
                }
            }).then(updated => {
                console.log(updated);
            });

            UUIDs.push(uuid);
        }

        // if (oldUUID && uuid && uuid !== oldUUID && UUIDs.length > 2 && IPs.length > 2 && originIP !== IP) {
        //     console.error('FRAUDULENT_USER', userId, session._id);
        //
        //     SessionLoggerServices.addNewFraudUser(userId, IPs);
        //     _revokeSession(sessionId);
        // }

        if (!oldUUID && uuid) {
            session.update({
                $set: {
                    uuid,
                    updated: Date.now()
                },

            }).then(updated => {
                console.log(updated);
            });
        }

        const expired = session.get('expired');
        const momentExpired = moment(expired);

        if (momentExpired.isBefore(moment())) {
            return Promise.resolve(true);
        }

        // if (UUIDs.length > 1) {
        //     SessionLoggerServices.addNewFraudUser(userId, IPs);
        //     _revokeSession(sessionId);
        // } else if (IPs.length > 1) {
        //     SessionLoggerServices.addNewFraudUser(userId, IPs);
        //     _revokeSession(sessionId);
        // }

        return Promise.resolve(false);
    });
};

exports.newSession = ({userId, IP, uuid}) => {
    const session = new Session({
        owner: userId,
        refreshToken: randToken.uid(256),
        IP,
        uuid,
        expired: moment().add(30, 'day')
    });

    return session.save().then(t => {
        return Promise.resolve(t.get('refreshToken'));
    });
};

exports.removeSession = ({userId, refreshToken}) => {
    return Session.remove({
        owner: userId,
        refreshToken: refreshToken
    });
};

exports.revokeAllTokens = ({userId}) => {
    //@todo add to blacklist

    return Session.update(
        {
            owner: userId,
            status: 'active'
        },
        {
            $set: {
                status: 'revoked',
                message: 'another login',
                updated: Date.now()
            }
        }
    ).then(updated => {
        return Promise.resolve(updated);
    }).catch(error => {//Always resolved.
        return Promise.resolve(true);
    });
};

