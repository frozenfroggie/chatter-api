const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const ss = require('socket.io-stream');
const path = require('path');
const AssistantV2 = require('ibm-watson/assistant/v2');

const assistant = new AssistantV2({
  iam_apikey: process.env.IAM_APIKEY,
  url: 'https://gateway-fra.watsonplatform.net/assistant/api/',
  version: '2019-02-28'
});
let sessionId;

require('./config/config');
const Message = require('./models/message');
const Conversation = require('./models/conversation');
const generateMessage = require('./utils/generateMessage');
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');
const uploadToS3 = require('./utils/uploadToS3');

app.use(compression());
app.use(helmet());
// app.use(morgan('tiny'));
const whitelist = ['https://chatter.cf', 'http://localhost:8080', 'http://localhost:8081'];
const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true, exposedHeaders: ['Authorization'] } // reflect (enable) the requested origin in the CORS response
  } else {
    corsOptions = { origin: false, exposedHeaders: ['Authorization'] } // disable CORS for this request
  }
  callback(null, corsOptions) // callback expects two parameters: error and options
}
app.use(cors(corsOptionsDelegate));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB_URI, {useNewUrlParser: true});

app.get('/', (req,res) => {
  res.json({message: 'connected'});
});

// app.get('/api/session', (req, res) => {
//   console.log(process.env.ASSISTANT_ID)
//   assistant.createSession({
//     assistant_id: process.env.ASSISTANT_ID,
//   }, (error, response) => {
//     if (error) {
//       console.log(error);
//       return res.status(error.code || 500).send(error);
//     }
//     return res.send(response);
//   });
// });

app.use('/user', userRoutes);
app.use('/chat', chatRoutes);

io.on('connection', socket => {
  console.log('connected!')
  ss(socket).on('file', function(stream, data, callback) {
    console.log('data', data)
    var filename = path.basename(data.name);
    stream.pipe(fs.createWriteStream(filename));
  });

  // Process the response.
  function processResponse(response, {conversationId, authorId}) {
    // If an intent was detected, log it out to the console.
    if (response.output.intents.length > 0) {
      console.log('Detected intent: #' + response.output.intents[0].intent);
    }
    // Display the output from assistant, if any. Supports only a single
    // text response.
    if (response.output.generic) {
      response.output.generic.length > 0 && response.output.generic.forEach(output => {
        // console.log('rec', recipent)
        console.log('aut', authorId)
        let message = {
          author: {
            _id: '5cebee370ce06d0004cfa086',
            username: 'Chatter Bot'
          },
          recipent: {
            _id: authorId
          },
          conversationId
        };
        if (output.response_type === 'text') {
          message.messageText = output.text;
        } else if (output.response_type === 'option') {
          message.options = output.options;
        } else if (output.response_type === 'image') {
          message.source = output.source;
        }
        socket.emit('newMessage', message);
      })
    }
  }

  // Send message to assistant.
  function sendMessageToAssistant(messageInput) {
    assistant
      .message({
        assistant_id: process.env.ASSISTANT_ID,
        session_id: sessionId,
        input: messageInput
      })
      .then(res => {
        processResponse(res, messageInput);
      })
      .catch(err => {
        console.log(err); // something went wrong
      });
  }


  socket.on('videoChatCall', (conversationId) => {
    // console.log('videoChatCall', conversationId)
    socket.broadcast.to(conversationId).emit('videoChatCall');
  });
  socket.on('videoChatAnswer', (conversationId) => {
    socket.broadcast.to(conversationId).emit('videoChatAnswer');
  });
  socket.on('videoChatDecline', (conversationId) => {
    socket.broadcast.to(conversationId).emit('videoChatDecline');
  });
  // socket.on('localStreamReady', (conversationId) => {
  //   socket.broadcast.to(conversationId).emit('localStreamReady');
  // });
  socket.on('videoChatSessionDescription', ({sessionDescription, conversationId}) => {
    socket.broadcast.to(conversationId).emit('videoChatSessionDescription', sessionDescription);
  });
  socket.on('videoChatCandidate', ({payload, conversationId}) => {
    socket.broadcast.to(conversationId).emit('videoChatCandidate', payload);
  });
  socket.on('videoChatHangup', (conversationId) => {
    console.log('videoChatHangup', conversationId)
    socket.broadcast.to(conversationId).emit('videoChatHangup');
  });

  socket.on('enterConversation', (data) => {
    socket.join(data.data.conversationId);
    io.of('/').in(data.data.conversationId).clients((error, clients) => {
      if (error) throw error;
      console.log(data)
      io.to(data.data.conversationId).emit('enterConversation', {[data.data.conversationId]: clients.length});
      console.log(`User ${data.data.userId} enter conversation ${data.data.conversationId}`);
      console.log(data.data.bot)
      if(data.data.bot) {
        assistant
          .createSession({
            assistant_id: process.env.ASSISTANT_ID,
          })
          .then(res => {
            sessionId = res.session_id;
            console.log('sessionId', sessionId);
            console.log('userId', data.data.userId);
            sendMessageToAssistant({
              authorId: data.data.userId,
              conversationId: data.data.conversationId,
              message_type: 'text',
              text: '' // start conversation with empty message
            });
          })
          .catch(err => {
            console.log(err); // something went wrong
          });
      }
    });
  });

  socket.on('typingNotification', (data) => {
    console.log(data.data)
    socket.broadcast.to(data.data).emit('typingNotification');
  });

  socket.on('sendMessage', ({ author, recipent, conversationId, messageText }, callback) => {
    if (recipent._id === '5cebee370ce06d0004cfa086') {
      const message = new Message({
        author: author._id,
        recipent: recipent._id,
        conversationId,
        messageText
      });
      sendMessageToAssistant({
        authorId: author._id,
        conversationId: conversationId,
        message_type: 'text',
        text: messageText
      });
      console.log('callback????')
      callback(message);
    } else {
      const message = new Message({
        author: author._id,
        recipent: recipent._id,
        conversationId,
        messageText
      });
      message.save().then(() => {
        const message = {
          author,
          recipent,
          conversationId,
          messageText
        }
        socket.broadcast.to(message.conversationId).emit('newMessage', message);
        callback(message);
      }).catch(err => {
        console.log(err);
      });
    }
  });

  socket.on('leaveConversation', (conversationId) => {
   console.log('User was disconnected', conversationId.data);
   socket.broadcast.to(conversationId.data).emit('leaveConversation', conversationId.data);
   socket.leave(conversationId.data);
   // We're done, so we close the session.
   sessionId && assistant
    .deleteSession({
      assistant_id: process.env.ASSISTANT_ID,
      session_id: sessionId,
    })
    .catch(err => {
      console.log(err); // something went wrong
    });
 });

});

const port = process.env.PORT || 5000;
http.listen(port, () => {
  console.log(`Listening on ${port}`);
});

module.exports = app;
