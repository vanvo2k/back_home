const merge = require('lodash/merge');
const {combineResolvers} = require('graphql-resolvers');
const ResolverHelpers = require('../helpers/ResolverHelpers');

const protectedField = () => 'Protected field value';

const rootResolvers = {
    Query: {
        hello: combineResolvers(
            ResolverHelpers.isAuthenticated,
            protectedField
        )
    }
};

const customScalarResolvers = require('./customScalars');
const favoriteResolvers = require('./favorite');
const myAnalyticResolvers = require('./my-analytic');

module.exports = merge(
    rootResolvers,
    favoriteResolvers,
    customScalarResolvers,
    myAnalyticResolvers
);