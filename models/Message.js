const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'users'},
  messages: [{
    content: String,
    timeStamp: Date,
    userMessage: Boolean,
}],
});

const MessageModel = mongoose.model('Message', MessageSchema);

module.exports = MessageModel;