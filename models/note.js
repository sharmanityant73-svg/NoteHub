const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    tags: [String],
    summary: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true       // every note must belong to a user
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Note', noteSchema);