const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const createConversationSnippet = require('../utils/createConversationSnippet');


exports.getConversationId = async (req, res) => {
  const friendId = req.params.friendId;
  console.log("ID:", friendId)
  const conversation = await Conversation.findOne({participants: {"$all": [req.user._id, friendId]}});
  console.log('CONVER FRIEND', conversation._id);
  if(!conversation._id) {
    return res.status(500);
  }
  res.send({conversationId: conversation._id})
}

exports.getConversationsSnippets = async (req, res) => {
  const conversationsSnippets = [];
  console.log('USER', req.user)
  const conversations = await Conversation.find({participants: req.user._id});
  console.log('conv', conversations)
  !conversations && res.status(500).json({conversations: null});
  console.log('len', conversations.length)
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
    console.log(conversationsSnippets.length)
    res.status(200).json({conversations: conversationsSnippets});
  } else {
    console.log(conversations.length)
    res.status(200).json({conversations: conversations});
  }
}

exports.getMessages = (req, res) => {
  const skipMessagesNumber = Number(req.query.skip)
  Message.find({ conversationId: req.query.conversation })
    .sort({createdAt: -1})
    .skip(skipMessagesNumber)
    .limit(20)
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
