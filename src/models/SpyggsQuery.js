const conn = require('../app.database');
const MongoosePaginate = require('mongoose-paginate');
const Mongoose = require('mongoose');
const {Schema} = Mongoose;

const SpyggsQuery = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true,
        index: true
    },
    title: {
        type: String,
        trim: true,
        default: () => (new Date()).toLocaleDateString()
    },
    description: {
        type: String,
        trim: true,
        default: '',
    },
    args: {
        type: Schema.Types.Mixed,
        default: {}
    },
    updated: {
        type: Date,
        default: Date.now
    },
    created: {
        type: Date,
        default: Date.now
    },
})

SpyggsQuery.plugin(MongoosePaginate);

module.exports = conn.model('Spyggs_Query', SpyggsQuery)
