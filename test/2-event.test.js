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
    it('FAIL - Bad location', async () => {
      const response = await API.Events.create({
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere', lat: 40 },
      });
      assert.strictEqual(response.status, 400);
    });
    it('FAIL - No headline', async () => {
      const response = await API.Events.create({
        startDate: Date.now(),
        location: { name: 'Somewhere' },
      });
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
    it('OK - Complete event', async () => {
      const response = await API.Events.create({
        headline:
          '1Ot3HAS2r LSxtVk2kC DSgBJicUl l7JsXbHul XzHbL2yR3 AXNKwWTTG wsx7UXz8i O9yryfVBV 669mCkjsH p6gijqSQG ',
        description:
          'BBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq IVEqhZbK1 QTOW9wPLd cvWkEDvTL Wg4v67A8E T4A71VIYj vYhU2TF8g FKdjU9fGO FxkM8djYP 3Jqz6iROj 1UJXjvIid pESX4XP1F hv66f7OAj 97TcC1XyG MlS86AoUi aipsTaZBV eh1rIukyT DeWavtMY8 A90ICXjOT EO3yQ2LAW 7zFT5A2LB d3wQhIl2X zxZw2FiwL XG0jp484e I40jYQBVq jAoH1Ixii GZdN1Okva scwwQCxqE J7i1HixhA Mws9icxXw jZbWMHKGO SLCFX2IFX E8v30FU04 I9ZVhavaP 4ZZnrzhUq vz1J2e2c3 eKXiU4qdr KcB9CF9Nf rNbG9zfDd RgvolUcZe SS2iTdEAp',
        startDate: '2021-08-01T00:00:00.000Z',
        location: {
          name: '1Ot3HAS2r LSxtVk2kC DSgBJicUl l7JsXbHul XzHbL2yR3 AXNKwWTTG wsx7UXz8i O9yryfVBV 669mCkjsH p6gijqSQG ',
          lat: 40.168453126,
          lon: -5.1561561231,
        },
        state: 'private',
      });
      assert.strictEqual(response.status, 200);
    });
    it('FAIL - Just one public event', async () => {
      const response1 = await API.Events.create({
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere' },
        state: 'public',
      });
      const response2 = await API.Events.create({
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere' },
        state: 'public',
      });
      assert.strictEqual(response1.status, 200);
      assert.strictEqual(response2.status, 400);
    });
  });

  describe('Get all events', () => {
    const lengths = {};
    it('OK - Get all events (no token)', async () => {
      API.setToken();
      const response = await API.Events.getAll();
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.events);
      assert.ok(response.data.events.length > 0);

      lengths.noToken = response.data.events.length;
    });
    it('OK - Get all events (other user)', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.getAll();
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.events);
      assert.ok(response.data.events.length > 0);
      assert.ok(response.data.events.length > lengths.noToken);

      lengths.tokenB = response.data.events.length;
    });
    it('OK - Get all events (creator)', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.getAll();
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.events);
      assert.ok(response.data.events.length > 0);
      assert.ok(response.data.events.length > lengths.tokenB);

      lengths.tokenA = response.data.events.length;
    });
  });
  describe('Get one event', () => {
    const eventIds = {};

    before(async () => {
      API.setToken(tokens.A);
      const response = await API.Events.getAll();

      eventIds.draft = response.data.events.find((e) => e.state === 'draft').id;
      eventIds.private = response.data.events.find(
        (e) => e.state === 'private'
      ).id;
      eventIds.public = response.data.events.find(
        (e) => e.state === 'public'
      ).id;
    });
    it('FAIL - Get non-existant event', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.get('123456789b7e91080da94660');
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('OK - Get event (draft as creator)', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.get(eventIds.draft);
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.event);
    });
    it('FAIL - Get event (draft as non-creator)', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.get(eventIds.draft);
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('OK - Get event (private as non-creator)', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.get(eventIds.private);
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.event);
    });
    it('FAIL - Get event (private as unregistered)', async () => {
      API.setToken();
      const response = await API.Events.get(eventIds.private);
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('OK - Get event (public as unregistered)', async () => {
      API.setToken();
      const response = await API.Events.get(eventIds.public);
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.event);
    });
  });
  describe('Update event', () => {
    const eventIds = {};

    before(async () => {
      API.setToken(tokens.A);
      const response = await API.Events.getAll();

      eventIds.draft = response.data.events.find((e) => e.state === 'draft').id;
      eventIds.private = response.data.events.find(
        (e) => e.state === 'private'
      ).id;
      eventIds.public = response.data.events.find(
        (e) => e.state === 'public'
      ).id;
    });
    it('FAIL - Update non-existant event', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.update('123456789b7e91080da94660', {});
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('FAIL - Bad location', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.update(eventIds.draft, {
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere', lat: 40 },
      });
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.ok(/location/.test(response.data.error));
    });
    it('OK - Update event, no body', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.update(eventIds.draft, {});
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.event);
    });
    it('OK - Update event, full body', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.update(eventIds.private, {
        headline:
          '1Ot3HAS2r LSxtVk2kC DSgBJicUl l7JsXbHul XzHbL2yR3 AXNKwWTTG wsx7UXz8i O9yryfVBV 669mCkjsH p6gijqSQG ',
        description:
          'BBDzxzQQ1Z Sk7htzCHH yYoxbBXjg D6xQVB9Pl W5NjeVjvl WUWUH6q3s d9nLlX6Dd u7aQ8XOKH LTtWw0JHb PDQMhmmeq IVEqhZbK1 QTOW9wPLd cvWkEDvTL Wg4v67A8E T4A71VIYj vYhU2TF8g FKdjU9fGO FxkM8djYP 3Jqz6iROj 1UJXjvIid pESX4XP1F hv66f7OAj 97TcC1XyG MlS86AoUi aipsTaZBV eh1rIukyT DeWavtMY8 A90ICXjOT EO3yQ2LAW 7zFT5A2LB d3wQhIl2X zxZw2FiwL XG0jp484e I40jYQBVq jAoH1Ixii GZdN1Okva scwwQCxqE J7i1HixhA Mws9icxXw jZbWMHKGO SLCFX2IFX E8v30FU04 I9ZVhavaP 4ZZnrzhUq vz1J2e2c3 eKXiU4qdr KcB9CF9Nf rNbG9zfDd RgvolUcZe SS2iTdEAp',
        startDate: '2021-08-01T00:00:00.000Z',
        location: {
          name: '1Ot3HAS2r LSxtVk2kC DSgBJicUl l7JsXbHul XzHbL2yR3 AXNKwWTTG wsx7UXz8i O9yryfVBV 669mCkjsH p6gijqSQG ',
          lat: 40.168453126,
          lon: -5.1561561231,
        },
        state: 'draft',
      });
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.event);
    });
    it('FAIL - Update non-visible event (as non-creator)', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.update(eventIds.draft, {});
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('FAIL - Update visible event (as non-creator)', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.update(eventIds.public, {});
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(
        response.data.error,
        'Events can only be edited by their creator'
      );
    });
    it('FAIL - Update event (as unregistered)', async () => {
      API.setToken();
      const response = await API.Events.update(eventIds.public, {});
      assert.strictEqual(response.status, 401);
    });
  });
  describe('Delete event', () => {
    const eventIds = {};
    before(async () => {
      API.setToken(tokens.A);

      const responsePrivate = await API.Events.create({
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere' },
        state: 'private',
      });
      const responseDraft = await API.Events.create({
        headline: 'New event',
        startDate: Date.now(),
        location: { name: 'Somewhere' },
        state: 'draft',
      });
      eventIds.draft = responseDraft.data.event.id;
      eventIds.private = responsePrivate.data.event.id;
    });
    it('FAIL - Delete non-existant event', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.destroy('123456789b7e91080da94660');
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('FAIL - Delete non-visible event', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.destroy(eventIds.draft);
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(response.data.error, 'Event not found');
    });
    it('FAIL - Delete non-owned event', async () => {
      API.setToken(tokens.B);
      const response = await API.Events.destroy(eventIds.private);
      assert.strictEqual(response.status, 400);
      assert.ok(response.data.error);
      assert.strictEqual(
        response.data.error,
        'Events can only be deleted by their creator'
      );
    });
    it('OK - Delete non-existant event', async () => {
      API.setToken(tokens.A);
      const response = await API.Events.destroy(eventIds.private);
      assert.strictEqual(response.status, 200);
    });
  });
});
