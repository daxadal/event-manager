/* global describe it before beforeEach afterEach */

// const assert = require('assert');

const API = require('./api')();
const Socket = require('./socket');
const config = require('../config');

const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

describe('Sockets', () => {
  describe('Connection', () => {
    it('PING all', async function ping() {
      if (!config.api.DEV) {
        this.skip();
      } else {
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
      }
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

  describe('Subscribe', () => {
    let socket;
    let token;
    before(async () => {
      const response = await API.Users.signup({
        name: 'socket2',
        email: 'socket2@example.com',
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
  /* 
  it('Remind', (done) => {
    if (config.api.DEV) {
      API.remind();
      socket.on('reminder', () => {
        socket.disconnect();
        done();
      });
    } else {
      done(new Pending('This test requires DEV API to be active'));
    }
  }); */
});
