const Transporter = require('./services/TransportServices').transporter;
const {NEW_USER_REGISTER} = require('./constants/Events');
const NewUserActions = require('./actions/NewUserActions');

/**
 * Subscribe event creating a new user.
 */
Transporter.subscribe(NEW_USER_REGISTER, {queue: 'app-background'}, ({userId, email}) => {
    NewUserActions.createDefaultQueries(userId);
    NewUserActions.createDefaultFavoriteCategory(userId);
});
