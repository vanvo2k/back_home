// const ElasticBuilderServices = require('./src/services/ElasticBuilderServices')

// ElasticBuilderServices.getQuerySearchTerm({
//     term: 'first day of school',
//     searchType: 'match_phrase'
// }).then(must => {
//     console.log(JSON.stringify(must))
// })

// connect to the database and load models
const database = require('./src/app.database');

// use user model get getProfile
const User = require('./src/models/User');

// User.findOne({_id: "59df3fbad5b1e47fe64afcd0"}).then(user => {
//     console.log('user', user);
// })
// get the user profile
User.getProfileById('59df3fbad5b1e47fe64afcd0').then(profile => {
    console.log('profile', profile);
})