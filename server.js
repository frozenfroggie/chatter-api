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
var whitelist = ['http://localhost:8080', 'https://chatter-server.herokuapp.com'];
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
  socket.on('enterConversation', (conversationId) => {
    socket.join(conversationId.data);
    console.log(conversationId);
  });

  // socket.emit('newMessage', generateMessage('Admin', 'Welcome to chat app'));

  socket.on('sendMessage', ({ author, recipent, conversationId, messageText }, callback) => {
    // io.sockets.in(conversation).emit('refresh messages', conversation);
    // const message = new Message({
    //   author:
    // });
    const message = new Message({
      author: author._id,
      recipent: recipent._id,
      conversationId,
      messageText
    });
    console.log('message', message)
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

  socket.on('leaveConversation', (conversation) => {
    socket.leave(conversation);
    console.log('left ' + conversation);
  })

  socket.on('disconnect', () => {
   console.log('User was disconnected');
 });

  // socket.on('createMessage', (message, callback) => {
  //   // console.log('Create message', message)
  //   io.emit('newMessage', generateMessage(message.from, message.text));
  //   callback();
  // })

});

const port = process.env.PORT || 5000;
http.listen(port, () => {
  console.log(`Listening on ${port}`);
});

module.exports = app;
