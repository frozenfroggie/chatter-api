const User = require('../models/user');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

exports.getConversations = (req, res) => {
  console.log('/chat', req.user._id)
  Conversation.find({ participants: req.user._id })
    .populate('participants', 'username')
    .then(conversations => {
      console.log(conversations)
      const conversationsSnippets = [];
      conversations.forEach((conversation, idx) => {

        Message.find({ conversationId: conversation._id })
          .sort({createdAt: -1})
          .limit(1)
          .populate({
            path: "author",
            select: "username"
          }).populate({
            path: "recipent",
            select: "username"
          }).then( message => {
            if(message[0]) {
              console.log('msg', message)
              console.log('msg[0]', message[0])
              const conversationSnippet = {
                _id: conversation._id,
                participants: conversation.participants,
                snippet: {
                  author: message[0].author,
                  recipent: message[0].recipent,
                  messageText: message[0].messageText,
                  createdAt: message[0].createdAt
                }
              }
              conversationsSnippets.push(conversationSnippet);
              console.log('buuu', conversationsSnippets)
            }
          });
        });
        console.log('conversationsSnippets', conversationsSnippets)
        setTimeout(() => {
          if(conversationsSnippets.length > 0) {
            res.status(200).json({conversations: conversationsSnippets});
          } else {
            res.status(200).json({conversations});
          }
        }, 1000)
  });
}

exports.getMessages = (req, res) => {
  Message.find({ conversationId: req.params.conversationId })
    .sort({createdAt: 1})
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
