const { io } = require('socket.io-client');

const config = require('../config');

module.exports.new = () => {
  const socket = io(`${config.socket.DOMAIN}:${config.socket.PORT}`);

  socket.on('connect', () => {
    console.log('Client: Connection made to server: ', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Client: disconnected');
  });

  socket.on('PING', () => {
    console.log('Client PING', socket.id);
    socket.emit('PONG', socket.id);
  });

  socket.on('reminder', (...params) => {
    console.log('Client reminder', ...params);
  });

  socket.on('sign-in-ok', () => {
    console.log('Client sign-in-ok');
  });

  socket.on('sign-in-error', () => {
    console.error('Client sign-in-error');
  });

  socket.on('sign-out-ok', () => {
    console.log('Client sign-out-ok');
  });

  socket.on('sign-out-error', () => {
    console.error('Client sign-out-error');
  });

  return socket;
};
