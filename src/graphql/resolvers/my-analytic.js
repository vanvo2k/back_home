const {combineResolvers} = require('graphql-resolvers');
const ResolverHelpers = require('../helpers/ResolverHelpers');
const MyAnalyticActions = require("../../actions/MyAnalyticActions");
const {parseJSON} = require("../../helpers/CommonHelpers");

const _getListMyAnalytics = (root, args, context) => {
    const {user} = context;
    const {id} = user;
    const {page, limit} = args;

    return MyAnalyticActions.getListItems({
        userId: id,
        page,
        limit
    });
};

const _createMyAnalytic = (root, query, context) => {
    const {user} = context;
    const {id} = user;
    const {title, args, analyticId} = query;

    const objectArgs = parseJSON(args);

    return MyAnalyticActions.createMyAnalytic({
        analyticId,
        userId: id,
        args: objectArgs,
        title: title
    });
};

const _deleteMyAnalytic = (root, query, context) => {
    const {user} = context;
    const userId = user.id;
    const {id} = query;

    return MyAnalyticActions.deleteMyAnalytic({
        userId: userId,
        ID: id,
    });
};

module.exports = {
    Query: {
        myAnalytics: combineResolvers(
            ResolverHelpers.isAuthenticated,
            _getListMyAnalytics
        )
    },
    Mutation: {
        createMyAnalytic: combineResolvers(
            ResolverHelpers.isAuthenticated,
            _createMyAnalytic
        ),
        deleteMyAnalytic: combineResolvers(
            ResolverHelpers.isAuthenticated,
            _deleteMyAnalytic
        )
    }
};