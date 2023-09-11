const MongoosePaginate = require('mongoose-paginate');
const conn = require('../app.database');
const Mongoose = require('mongoose');
const {Schema} = Mongoose;

const SpyggsItem = new Schema({
    ASIN: {
        type: String,
        required: true,
        index: true
    },
    link: {
        type: String
    },
    name: {
        type: String
    },
    alive: {
        type: Boolean,
        default: true,
    },
    link_status: Number,
    brand: String,
    thumbnail: String,
    rank: {
        type: Number
    },
    rankDifference: {
        type: Number
    },
    computed: {
        type: Object,
        default: {}
    },
    trendy: {
        type: Number
    },
    trending: {
        type: Number
    },
    minPrice: {
        type: Number
    },
    maxPrice: {
        type: Number
    },
    prices: [{
        timestamp: Date,
        minPrice: Number,
        maxPrice: Number,
        _id: false,
    }],
    ranks: [{
        timestamp: Date,
        rank: Number,
        _id: false
    }],
    created: {
        type: Date,
        default: Date.now
    },
    last_updated_at: {
        type: Date
    }
});

SpyggsItem.plugin(MongoosePaginate);

module.exports = conn.model('Spyggs_Item', SpyggsItem);