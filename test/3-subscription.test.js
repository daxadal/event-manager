/* global describe it before */

const assert = require('assert');

const API = require('./api')();

const tokens = {};
let events = [];

describe('Subscriptions', () => {
  before(async () => {
    const responseA = await API.Users.signup({
      name: 'subA',
      email: 'subA@example.com',
      password: 'pass',
    });
    const responseB = await API.Users.signup({
      name: 'subB',
      email: 'subB@example.com',
      password: 'pass',
    });
    const responseC = await API.Users.signup({
      name: 'subC',
      email: 'subC@example.com',
      password: 'pass',
    });

    tokens.A = responseA.data.token;
    tokens.B = responseB.data.token;
    tokens.C = responseC.data.token;

    const date = new Date();
    date.getDate(date.getDate() + 1);

    API.setToken(tokens.A);

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
  });
  it('FAIL - Unauthorized', async () => {
    API.setToken();
    const response = await API.Events.subscribe(events[0].id);
    assert.strictEqual(response.status, 401);
  });
  it('FAIL - Subscribe own event', async () => {
    API.setToken(tokens.A);
    const response = await API.Events.subscribe(events[0].id);
    assert.strictEqual(response.status, 400);
    assert.strictEqual(
      response.data.error,
      "You can't subscribe to your own events"
    );
  });
  it('FAIL - Subscribe with invalid comment', async () => {
    API.setToken(tokens.C);
    const response = await API.Events.subscribe(events[1].id, {
      comment:
        'BBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq IVEqhZbK1 QTOW9wPLd cvWkEDvTL Wg4v67A8EBBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq IVEqhZbK1 QTOW9wPLd cvWkEDvTL Wg4v67A8E T4A71VIYj vYhU2TF8g FKdjU9fGO FxkM8djYP 3Jqz6iROj 1UJXjvIid pESX4XP1F hv66f7OAj 97TcC1XyG MlS86AoUi aipsTaZBV eh1rIukyT DeWavtMY8 A90ICXjOT EO3yQ2LAW 7zFT5A2LB d3wQhIl2X zxZw2FiwL XG0jp484e I40jYQBVq jAoH1Ixii GZdN1Okva scwwQCxqE J7i1HixhA Mws9icxXw jZbWMHKGO SLCFX2IFX E8v30FU04 I9ZVhavaP 4ZZnrzhUq vz1J2e2c3 eKXiU4qdr KcB9CF9Nf rNbG9zfDd RgvolUcZe SS2iTdEAp ',
    });
    assert.strictEqual(response.status, 400);
    assert.ok(/comment/.test(response.data.error));
  });
  it('OK - Subscribe without comment', async () => {
    API.setToken(tokens.C);
    const response = await API.Events.subscribe(events[0].id);
    assert.strictEqual(response.status, 200);
  });

  it('OK - Subscribe with comment', async () => {
    API.setToken(tokens.C);
    const response = await API.Events.subscribe(events[1].id, {
      comment: "OMG, I can't wait!!",
    });
    assert.strictEqual(response.status, 200);
  });
  it('FAIL - Double subscription', async () => {
    API.setToken(tokens.C);
    const response = await API.Events.subscribe(events[1].id, {
      comment: 'Awesome!!',
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(
      response.data.error,
      'You already have subscribed to this event'
    );
  });
  it('OK - Subscribe with long but valid comment', async () => {
    API.setToken(tokens.C);
    const response = await API.Events.subscribe(events[2].id, {
      comment:
        'BBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq',
    });
    assert.strictEqual(response.status, 200);
  });

  it('FAIL - Subscription limit reached', async () => {
    API.setToken(tokens.C);
    const response = await API.Events.subscribe(events[3].id, {
      comment: 'Awesome!!',
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.data.error, 'Subscribed events limit exceeded');
  });
});
