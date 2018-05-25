const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

io.on('connection', function (socket) {
  console.log('new user connected');
});

const port = 3004;
http.listen(port, () => {
  console.log(`Listening on ${port}`);
});
