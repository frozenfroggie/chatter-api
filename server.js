const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const Message = require('./models/message');
const Conversation = require('./models/conversation');

require('./config/config');
const generateMessage = require('./utils/generateMessage');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');

app.use(helmet());
app.use(morgan('tiny'));
var whitelist = ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082', 'https://chatter.cf', 'https://chatter-server.herokuapp.com'];
var corsOptions = {
  origin: (origin, cb) => {
    whitelist.indexOf(origin) !== -1 ? cb(null, true) : cb(new Error('Not allowed by CORS'));
  },
  exposedHeaders: ['Authorization']
}
app.use(cors(corsOptions));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

app.get('/', (req,res) => {
  res.json({message: 'connected'});
});

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);

io.on('connection', socket => {
  console.log('new user connected');
  // On conversation entry, join broadcast channel
  socket.on('enterConversation', (data) => {
    console.log('enter!!!')
    socket.join(data.data.conversationId);
    io.of('/').in(data.data.conversationId).clients((error, clients) => {
      if (error) throw error;
      io.to(data.data.conversationId).emit('enterConversation', {[data.data.conversationId]: clients.length});
    });
    console.log('User enter conversation', data.data.conversationId);
  });

  socket.on('typingNotification', (data) => {
    console.log(data.data)
    socket.broadcast.to(data.data).emit('typingNotification');
  });

  socket.on('sendMessage', ({ author, recipent, conversationId, messageText }, callback) => {
    const message = new Message({
      author: author._id,
      recipent: recipent._id,
      conversationId,
      messageText
    });
    console.log('SEND MESSAGE', message)
    message.save().then(() => {
      const message = {
        author,
        recipent,
        conversationId,
        messageText
      }
      console.log('message2', message)
      socket.broadcast.to(message.conversationId).emit('newMessage', message);
      callback(message);
    }).catch(err => {
      console.log(err);
    });
  });

  socket.on('leaveConversation', (conversationId) => {
   console.log('User was disconnected', conversationId.data);
   socket.broadcast.to(conversationId.data).emit('leaveConversation', conversationId.data);
   socket.leave(conversationId.data);
 });

});

const port = process.env.PORT || 5000;
http.listen(port, () => {
  console.log(`Listening on ${port}`);
});

module.exports = app;
