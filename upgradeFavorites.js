const Item = require('./src/models/Item');
const User = require('./src/models/User');
const Favorite = require('./src/models/Favorite');
const FCategory = require('./src/models/F-Category');
const FavoriteProductsActions = require('./src/actions/FavoriteProductsActions');
const Promise = require('bluebird');

console.log('Run now.....');


const _update = (user) => {
    const userId = user._id;

    return FavoriteProductsActions.getDefaultCategory(userId)
        .then(category => {
            return Favorite.update({
                owner: userId,
                category: {
                    $exists: false
                }
            }, {
                $set: {
                    category: category.get('_id')
                }
            }, {
                multi: true
            }).then(updated => {
                console.log(updated);

                return Promise.resolve(updated);
            });
        });
};

const _fetch = (count) => {
    console.log('Fetching...');

    User.find({})
        .then(users => {
            return Promise.map(users, user => {
                return _update(user);
            }, {concurrency: 1});
        })
        .then(() => {
            console.log('done');
        });
};

_fetch();