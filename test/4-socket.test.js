/* global describe xdescribe it before beforeEach after afterEach */

// const assert = require('assert');

const API = require('./api')();
const Socket = require('./socket');
const config = require('../config');

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
      await API.ping();
      await Promise.all(promises);
    });
  });

  describe('Sign in & sign out', () => {
    let socket;
    let token;
    before(async () => {
      const response = await API.Users.signup({
        name: 'socket',
        email: 'socket@example.com',
        password: 'pass',
      });
      token = response.data.token;
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
      socket.emit('sign-in', token);

      socket.on('sign-in-ok', () => {
        done();
      });
      socket.on('sign-in-error', () => {
        done(new Error('Sign in error'));
      });
    });
    it('FAIL - Token not valid on sign out', (done) => {
      socket.emit('sign-out', 'token.not.valid');

      socket.on('sign-out-ok', () => {
        done(new Error('Signed out successfully'));
      });
      socket.on('sign-out-error', () => {
        done();
      });
    });
    it('OK - Valid sign out', (done) => {
      socket.emit('sign-in', token);
      socket.emit('sign-out', token);

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
    const sockets = { A: Socket.new(), B: Socket.new(), C: Socket.new() };
    const tokens = {};
    let events;

    before(async () => {
      const responseO = await API.Users.signup({
        name: 'socketO',
        email: 'socketO@example.com',
        password: 'pass',
      });
      const responseA = await API.Users.signup({
        name: 'socketA',
        email: 'socketA@example.com',
        password: 'pass',
      });
      const responseB = await API.Users.signup({
        name: 'socketB',
        email: 'socketB@example.com',
        password: 'pass',
      });
      const responseC = await API.Users.signup({
        name: 'socketC',
        email: 'socketC@example.com',
        password: 'pass',
      });

      tokens.O = responseO.data.token;
      tokens.A = responseA.data.token;
      tokens.B = responseB.data.token;
      tokens.C = responseC.data.token;

      const date = new Date();
      date.setMinutes(date.getMinutes() + config.bree.MINUTES_AHEAD);

      API.setToken(tokens.O);

      const promises = [...Array(4).keys()].map((i) =>
        API.Events.create({
          headline: `New event ${i}`,
          startDate: date,
          location: { name: 'Somewhere' },
          state: 'private',
        })
      );
      const responses = await Promise.all(promises);
      events = responses.map((response) => response.data.event);

      sockets.A.emit('sign-in', tokens.A);
      sockets.B.emit('sign-in', tokens.B);
      sockets.C.emit('sign-in', tokens.C);

      API.setToken(tokens.A);
      await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[1].id);
      // await API.Events.subscribe(events[2].id);
      // await API.Events.subscribe(events[3].id);

      API.setToken(tokens.B);
      await API.Events.subscribe(events[0].id);
      // await API.Events.subscribe(events[1].id);

      API.setToken(tokens.C);
      // await API.Events.subscribe(events[0].id);
      await API.Events.subscribe(events[2].id);
    });

    it('Remind', async () => {
      await API.remind();
      const promises = [sockets.A, sockets.B, sockets.C].map(
        (socket) =>
          new Promise((resolve, reject) => {
            socket.on('reminder', resolve);
            sleep(1000).then(reject);
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
