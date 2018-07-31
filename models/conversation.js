const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new mongoose.Schema({
  participants: [{type: Schema.Types.ObjectId, ref: 'User'}],
  snippet: {
    type: String,
    default: null
  }
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
