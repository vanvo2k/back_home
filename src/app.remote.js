const Transporter = require('./services/TransportServices').transporter;
const ProductActions = require('./actions/ProductActions');

const prefix = process.env.NODE_ENV === 'staging' ? 'spyamz_dev' : 'spyamz';

Transporter.subscribe(`${prefix}.SEARCH_PRODUCTS`, {queue: 'app-services'}, (request, reply) => {
    const start = Date.now();

    ProductActions.search(request)
        .then(result => {
            console.log('SEARCH_REMOTE', Date.now() - start);

            Transporter.publish(reply, result);
        })
        .catch(error => {
            Transporter.publish(reply, {error});
        });
});