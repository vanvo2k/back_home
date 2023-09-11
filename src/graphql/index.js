const {makeExecutableSchema} = require('graphql-tools');
const {graphqlExpress, graphiqlExpress} = require('apollo-server-express');
const OauthActions = require("../actions/OauthActions");
const schemas = require('./schemas');
const queries = require('./queries');
const mutations = require('./mutations');
const subscriptions = require('./subscriptions');
const resolvers = require('./resolvers');

const rootDefs = () => [`
  schema {
    query: Query,
    mutation: Mutation
    subscription: Subscription
  }
  
  type Query
  
  type Mutation {
    hi: String
  }
  
  type Subscription {
    bye: String
  }
`];

const typeDefs = [].concat([], rootDefs, schemas, queries, mutations, subscriptions);
const schema = makeExecutableSchema({
    typeDefs,
    resolvers
});

const maybeAuthorized = (req, res) => {
    const token = req.body.token || req.query.token || req.headers['authorization'] || req.headers['x-authorization'];

    return OauthActions.isAuthorized(token)
        .then(result => {
            return Promise.resolve(result);
        }, error => {
            return Promise.resolve(false);
        });
};

module.exports = {
    graphql: graphqlExpress((req, res) => {
        return maybeAuthorized(req, res)
            .then(user => {
                return Promise.resolve({
                    schema,
                    context: {
                        user
                    }
                });
            });
    }),
    graphiql: graphiqlExpress({endpointURL: '/graphql'})
};