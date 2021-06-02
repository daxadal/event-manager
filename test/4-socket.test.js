/* global describe xdescribe it before beforeEach after afterEach */

const assert = require('assert');

const API = require('../src/utils/api')();
const Socket = require('./socket');
const config = require('../config');
const { generateTokens, generateEvents } = require('./utils');

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

const mdescribe = config.api.DEV ? describe : xdescribe;

describe('Sockets', () => {
  mdescribe('Connection (DEV API required)', () => {
    it('PING all', async () => {
      const sockets = Array(8).map(() => Socket.new());

      const promises = sockets.map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on('PING', () => {
              socket.disconnect();
              resolve();
            });
            sleep(1000).then(() => {
              reject();
            });
          })
      );
      await API.Dev.ping();
      await Promise.all(promises);
    });
  });

  describe('Sign in & sign out', () => {
    let socket;
    before(async () => {
      await API.Users.signup({
        name: 'socket',
        email: 'socket@example.com',
        password: 'pass',
      });
    });
    beforeEach(() => {
      socket = Socket.new();
    });

    it('FAIL - Token not valid on sign in', (done) => {
      socket.emit('sign-in', 'token.not.valid');

      socket.on('sign-in-ok', () => {
        done(new Error('Signed in successfully'));
      });
      socket.on('sign-in-error', () => {
        done();
      });
    });
    it('OK - Valid sign in', (done) => {
      API.Users.signin('socket@example.com', 'pass').then((response) =>
        socket.emit('sign-in', response.data.token)
      );

      socket.on('sign-in-ok', () => {
        done();
      });
      socket.on('sign-in-error', () => {
        done(new Error('Sign in error'));
      });
    });
    it('FAIL - Token not valid on sign out', (done) => {
      API.Users.signin('socket@example.com', 'pass')
        .then((response) => socket.emit('sign-in', response.data.token))
        .then(() => sleep(200))
        .then(() => socket.emit('sign-out', 'token.not.valid'));

      socket.on('sign-out-ok', () => {
        done(new Error('Signed out successfully'));
      });
      socket.on('sign-out-error', () => {
        done();
      });
    });
    it('OK - Valid sign out', (done) => {
      API.Users.signin('socket@example.com', 'pass').then((response) => {
        socket.emit('sign-in', response.data.token);
        sleep(200).then(() => socket.emit('sign-out', response.data.token));
      });

      socket.on('sign-out-ok', () => {
        done();
      });
      socket.on('sign-out-error', () => {
        done(new Error('Sign out error'));
      });
    });

    afterEach(() => {
      socket.disconnect();
    });
  });

  mdescribe('Reminder (DEV API required)', () => {
    let sockets;
    let tokens;
    let events;

    before(async () => {
      sockets = { A: Socket.new(), B: Socket.new(), C: Socket.new() };

      tokens = await generateTokens('socket', ['O', 'A', 'B', 'C']);

      const date = new Date();
      date.setMinutes(date.getMinutes() + config.bree.MINUTES_AHEAD);

      events = await generateEvents({
        length: 4,
        startDate: date,
        state: 'private',
        token: tokens.O,
      });

      sockets.A.emit('sign-in', tokens.A);
      sockets.B.emit('sign-in', tokens.B);
      sockets.C.emit('sign-in', tokens.C);

      API.setToken(tokens.A);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[1].id);
      await API.Events.subscribe(events[2].id);
      await API.Events.subscribe(events[3].id);

      API.setToken(tokens.B);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[1].id);

      API.setToken(tokens.C);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[2].id);
    });
    it('Remind (direct call)', async () => {
      const response = await API.Dev.remind();
      assert.strictEqual(response.status, 200);
      const promises = [sockets.A, sockets.B, sockets.C].map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on('reminder', resolve);
            sleep(2000).then(reject);
          })
      );
      await Promise.all(promises);
    });

    it('Remind (using bree)', async () => {
      const response = await API.Dev.remindBree();
      assert.strictEqual(response.status, 200);
      const promises = [sockets.A, sockets.B, sockets.C].map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on('reminder', resolve);
            sleep(2000).then(reject);
          })
      );

      await Promise.all(promises);
    });

    after(() => {
      sockets.A.disconnect();
      sockets.B.disconnect();
      sockets.C.disconnect();
    });
  });
});
