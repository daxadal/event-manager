/* global describe it before */

const assert = require('assert');

const API = require('../src/services/api')();

describe('Authentication', () => {
  describe('Sign up - Register', () => {
    it('FAIL - No body', async () => {
      const response = await API.Users.signup();
      assert.strictEqual(response.status, 400);
    });

    it('FAIL - Bad email', async () => {
      const response = await API.Users.signup({
        name: 'user1',
        email: 'user1@',
        password: 'pass',
      });
      assert.strictEqual(response.status, 400);
    });

    it('OK - Valid registration', async () => {
      const response = await API.Users.signup({
        name: 'user2',
        email: 'user2@example.com',
        password: 'pass',
      });
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.token);
    });

    it('FAIL - Duplicated registration', async () => {
      const response = await API.Users.signup({
        name: 'user2dup',
        email: 'user2@example.com',
        password: 'password',
      });
      assert.strictEqual(response.status, 400);
    });
  });

  describe('Sign in - Login', () => {
    before(() =>
      API.Users.signup({
        name: 'user4',
        email: 'user4@example.com',
        password: 'pass',
      })
    );
    it('FAIL - No auth', async () => {
      const response = await API.Users.signin();
      assert.strictEqual(response.status, 400);
    });
    it('OK - Valid login', async () => {
      const response = await API.Users.signin('user4@example.com', 'pass');
      assert.strictEqual(response.status, 200);
      assert.ok(response.data.token);
    });
  });
  describe('Sign out - Logout', () => {
    it('FAIL - No token', async () => {
      API.setToken();
      const response = await API.Users.signout();
      assert.strictEqual(response.status, 401);
    });
    it('OK - Valid logout', async () => {
      const { data } = await API.Users.signin('user4@example.com', 'pass');
      API.setToken(data.token);
      const response = await API.Users.signout();
      assert.strictEqual(response.status, 200);
    });
  });
});
