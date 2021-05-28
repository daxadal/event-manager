/* global describe it before */

const assert = require('assert');

const API = require('./api')();

const tokens = {};

describe('Events', () => {
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
  });
  describe('Create Event', () => {
    before(() => {
      API.setToken(tokens.A);
    });
    it('FAIL - No body', async () => {
      const response = await API.Events.create();
      assert.strictEqual(response.status, 400);
    });

    it('OK - Basic event', async () => {
      const response = await API.Events.create({
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere' },
      });
      assert.strictEqual(response.status, 200);
    });
  });
});
