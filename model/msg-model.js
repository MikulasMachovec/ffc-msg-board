const mongoose = require('mongoose');
const { Schema } = mongoose;

const repliesSchema = new Schema({
    text: {type: String, required: true},
    delete_password: {type: String, required: true},
    created_on: {type: Date},
    reported: {type: Boolean}
})

const messageSchema = new Schema(
    {
        board             :   {type: String, required: true},
        text              :   {type: String, required: true},
        created_on        :   {type: Date},
        bumped_on         :   {type: Date},
        reported          :   {type: Boolean },
        delete_password   :   {type: String, required: true},
        replies           :   [repliesSchema],
    },
    { versionKey: false }
);

const message_db = mongoose.model('Message', messageSchema);

module.exports = message_db;