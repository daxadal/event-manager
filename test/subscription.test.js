/* eslint-disable no-underscore-dangle */
/* global describe it before after */

const assert = require('assert');

const API = require('./api')();
const Socket = require('./socket');

// const sleep = (millis) => new Promise((resolve) => setTimeout(resolve, millis));

const tokens = {};
let events = [];
let socket;

describe('Subscription & Reminders', () => {
  before(async () => {
    const responseA = await API.Users.signup({
      name: 'userA',
      email: 'userA@example.com',
      password: 'pass',
    });
    const responseB = await API.Users.signup({
      name: 'userB',
      email: 'userB@example.com',
      password: 'pass',
    });
    const responseC = await API.Users.signup({
      name: 'userC',
      email: 'userC@example.com',
      password: 'pass',
    });

    tokens.A = responseA.data.token;
    tokens.B = responseB.data.token;
    tokens.C = responseC.data.token;

    const date = new Date();
    date.getDate(date.getDate() + 1);

    API.setToken(tokens.C);

    await API.Events.create({
      headline: 'New event 1',
      startDate: date,
      location: { name: 'Somewhere' },
      state: 'public',
    });
    await API.Events.create({
      headline: 'New event 2',
      startDate: date,
      location: { name: 'Somewhere' },
      state: 'public',
    });
    await API.Events.create({
      headline: 'New event 3',
      startDate: date,
      location: { name: 'Somewhere' },
      state: 'public',
    });

    const response = await API.Events.getAll();
    events = response.data;

    API.setToken(tokens.A);

    socket = Socket.new();
    socket.emit('sign-in', tokens.A);

    console.info('events', events);
    console.info('tokens', tokens);

    assert.notStrictEqual(events.length, 0);
  });
  it('OK - Subscribe without comment', async () => {
    const response = await API.Events.subscribe(events[0]._id);
    console.info(response.data);
    assert.strictEqual(response.status, 200);
  });

  it('OK - Subscribe with comment', async () => {
    const response = await API.Events.subscribe(events[1]._id, {
      comment: "OMG, I can't wait!!",
    });
    console.info(response.data);
    assert.strictEqual(response.status, 200);
  });
  it('Remind', (done) => {
    API.remind();
    socket.on('reminder', () => {
      socket.disconnect();
      done();
    });
  });
  after(() => {
    socket.disconnect();
  });
});
