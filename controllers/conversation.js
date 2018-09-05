const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const createConversationSnippet = require('../utils/createConversationSnippet');

exports.getConversationsSnippets = async (req, res) => {
  const conversationsSnippets = [];
  const conversations = await Conversation.find({participants: req.user._id});
  !conversations && res.status(500).json({conversations: null});
  for(let i = 0; i < conversations.length; i++) {
    const conversation = conversations[i];
    const message = await Message.find({conversationId: conversation._id})
                                  .sort({createdAt: -1})
                                  .limit(1)
                                  .populate({path: "author", select: "username"})
                                  .populate({path: "recipent", select: "username"});
    !message && res.status(500).json({conversations: null});
    const conversationSnippet = createConversationSnippet(conversation, message);
    conversationsSnippets.push(conversationSnippet);
  }
  if (conversationsSnippets[0]) {
    res.status(200).json({conversations: conversationsSnippets});
  } else {
    res.status(200).json({conversations: conversations});
  }
}

exports.getMessages = (req, res) => {
  const skipMessagesNumber = Number(req.query.skip)
  Message.find({ conversationId: req.query.conversation })
    .sort({createdAt: -1})
    .skip(skipMessagesNumber)
    .limit(10)
    .populate('author')
    .then(messages => {
      res.status(200).json({ messages });
    })
}

exports.newMessage = (req,res) => {
  const message = new Message({
    conversationId: req.params.conversationId,
    body: req.body.composedMessage,
    author: req.user._id
  });
  message.save().then(() => {
    res.status(200).json({ message: 'Reply successfully sent!' });
  });
}
