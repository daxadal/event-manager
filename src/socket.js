const http = require('http');
const { Server } = require('socket.io');

const DB = require('./utils/db')();

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

  socket.on('sign-in', async (sessionToken) => {
    const user = await DB.User.findOne({
      sessionToken,
    });
    if (user) {
      user.socketId = socket.id;
      await user.save();
      console.log('Server: sign-in', socket.id, user);
      socket.emit('sign-in-ok');
    } else {
      console.log('Server: failed to sign-in', {
        socketId: socket.id,
        sessionToken,
      });
      socket.emit('sign-in-error');
    }
  });
  socket.on('sign-out', async (sessionToken) => {
    const user = await DB.User.findOne({
      sessionToken,
    });
    if (user && user.socketId === socket.id) {
      user.socketId = null;
      console.log('Server: sign-out', user);
      socket.emit('sign-out-ok');
    } else {
      console.log('Server: failed to sign-out', {
        socketId: socket.id,
        sessionToken,
      });
      socket.emit('sign-out-error');
    }
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
