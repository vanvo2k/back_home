const NATS = require('nats');

module.exports = (args) => {
    const client = NATS.connect(args);

    client.on('connect', () => {
        console.log('NATS connected.');
    });

    client.on('disconnect', () => {
        console.log('NATS disconnected.');
    });

    client.on('close', () => {
        console.log('NATS closed.');
    });

    client.on('error', (err) => {
        console.error('NATS error', err);
    });

    return client;
};