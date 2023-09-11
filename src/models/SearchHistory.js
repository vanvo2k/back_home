const {Schema} = require('mongoose')
const conn = require('../app.database')

const searchHistorySchema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true,
        index: true
    },

    keyword: {
        type: String,
        trim: true,
        require: true
    },

    type: {
        type: String,
        trim: true,
        default: ''
    },

    created: {
        type: Date,
        index: true,
        default: Date.now,
    }
})

module.exports = conn.model('SearchHistory', searchHistorySchema);