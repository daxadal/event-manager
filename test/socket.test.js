/* global describe it */

const assert = require('assert');

const API = require('./api')();
const Socket = require('./socket');

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

describe('Socket', () => {
  describe('Connection', () => {
    it('PING all', async () => {
      const sockets = [];
      for (let i = 0; i < 8; i += 1) sockets.push(Socket.new());

      console.info(
        'Sockets connected: ',
        sockets.filter((s) => s.connected).length
      );
      await sleep(1000);
      console.info(
        'Sockets connected: ',
        sockets.filter((s) => s.connected).length
      );
      await API.ping();

      sockets.map((socket) => socket.disconnect());
    });
  });

  describe('Registration', () => {
    it('New user - new socket', async () => {
      const response = await API.Users.signup({
        name: 'socket',
        email: 'socket@example.com',
        password: 'pass',
      });
      const { token } = response.data;

      const socket = Socket.new();
      socket.emit('sign-in', token);

      socket.on('sign-in-ok', () => {
        socket.disconnect();
      });
      socket.on('sign-in-error', () => {
        socket.disconnect();
        assert.fail('Socket sign in error');
      });
    });
  });
});
