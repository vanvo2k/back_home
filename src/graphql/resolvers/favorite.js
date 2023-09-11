const {combineResolvers} = require('graphql-resolvers');
const ResolverHelpers = require('../helpers/ResolverHelpers');
const FavoriteActions = require("../../actions/FavoriteActions");

const _getListFavorites = (root, args, context) => {
    const {user} = context;
    const {id} = user;
    const {page, limit} = args;

    return FavoriteActions.getItems({
        userId: id,
        page,
        limit
    }).then(results => {
        return Promise.resolve(results);
    });
};

module.exports = {
    Query: {
        favorites: combineResolvers(
            ResolverHelpers.isAuthenticated,
            _getListFavorites
        )
    }
};