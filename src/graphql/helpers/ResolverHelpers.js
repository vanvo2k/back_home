const {skip, combineResolvers} = require('graphql-resolvers');

const _isAuthenticated = (root, args, {user}) => user ? skip : new Error('Not authenticated');

const _userHasRole = role => (root, args, {user}) => {
    const {roles} = user;

    if (!roles || !roles.length || roles.indexOf(role) === -1) {
        return new Error('You do not have permission to access this resource.');
    }

    return skip;
};

const _userCan = (capability, alternatively = null) => (root, args, {user}) => {
    const {scopes} = user;

    if (!scopes || !scopes.length) {
        return new Error('You do not have permission to access this resource.');
    }

    if (alternatively && scopes.indexOf(alternatively) !== -1) {
        return skip;
    }

    if (scopes.indexOf(capability) === -1) {
        return new Error('You do not have permission to access this resource.');
    }

    return skip;
};

exports.isAuthenticated = _isAuthenticated;

exports.userHasRole = role => {
    return combineResolvers(
        _isAuthenticated,
        _userHasRole(role)
    );
};

exports.userCan = (capability, alternatively = null) => {
    return combineResolvers(
        _isAuthenticated,
        _userCan(capability, alternatively)
    );
};