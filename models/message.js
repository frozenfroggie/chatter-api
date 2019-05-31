const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new mongoose.Schema({
  author: {type: Schema.Types.ObjectId, ref: 'User'},
  recipent: {type: Schema.Types.ObjectId, ref: 'User'},
  conversationId: {type: Schema.Types.ObjectId, ref: 'Conversation'},
  messageText: {
    type: String
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;
