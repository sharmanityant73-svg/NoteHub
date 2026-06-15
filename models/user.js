const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,        // no two users with same username
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,        // no two users with same email
        trim: true
    },
    password: {
        type: String,
        required: true       // will be stored as hash
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);