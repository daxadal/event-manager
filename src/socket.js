const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('Server: Connection made to server: ', socket.id);

  socket.on('disconnect', () => {
    console.log('Server: user disconnected');
  });

  socket.on('PONG', () => {
    console.log('Server PONG', socket.id);
  });

  socket.emit('PING', socket.id);
});

async function sendReminder(socketIds) {
  const sockets = await io.in(socketIds).fetchSockets();
  sockets.map((socket) => socket.emit('reminder', socket.id));
}

async function pingAll() {
  io.emit('PING');
}

module.exports = { default: httpServer, sendReminder, pingAll };
