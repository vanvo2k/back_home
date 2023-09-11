const Mongoose = require('mongoose');
const {Schema} = Mongoose;

const conn = require('../app.database')

const AnnouncementSchema = new Schema({
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now()
    },
    start_time: {
        type: Date,
        required: true,
        index: true
    },
    end_time: {
        type: Date,
        required: true,
        index: true
    },
    send_to: {
        type: Array,
        default: ['all_users'],
        index: true
    },
    read_by: {
        type: Array,
        index: true
    }
});

module.exports = conn.model('Announcement', AnnouncementSchema)