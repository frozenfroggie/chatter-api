const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

require('./config/config');
const generateMessage = require('./utils/generateMessage');
const userRoutes = require('./routes/user');

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

app.use('/user', userRoutes);

io.on('connection', socket => {
  // console.log('new user connected');

  socket.emit('newMessage', generateMessage('Admin', 'Welcome to chat app'));

  socket.broadcast.emit('newMessage', generateMessage('Admin', 'New user joined'));

  socket.on('createMessage', (message, callback) => {
    // console.log('Create message', message)
    io.emit('newMessage', generateMessage(message.from, message.text));
    callback();
  })

  socket.on('diconnect', () => {
    console.log('User was disconnected')
  });

});

const port = process.env.PORT || 3004;
http.listen(port, () => {
  console.log(`Listening on ${port}`);
});

module.exports = app;
