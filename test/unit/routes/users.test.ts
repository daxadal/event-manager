import request from 'supertest';
import crypto from 'crypto';
import { mocked } from 'ts-jest/utils';

import app from '@/app';
import { pass as passConfig } from '@/config';
import { closeConnection, createConnection, User } from '@/services/db';
import * as auth from '@/services/auth';

import { clearDatabase } from 'test/mocks/db';

jest.mock('@/services/auth');

const mockedAuth = mocked(auth, true);

const hash = (pass: string) =>
  crypto.createHmac('sha256', passConfig.SECRET).update(pass).digest('hex');

describe('Authentication', () => {
  beforeAll(createConnection);

  beforeEach(jest.clearAllMocks);

  afterEach(clearDatabase);

  afterAll(closeConnection);

  describe('Sign up - Register', () => {
    beforeAll(() => mockedAuth.createToken.mockReturnValue('token'));

    afterAll(() => mockedAuth.createToken.mockReset());

    it('Returns 400 on empty body', async () => {
      // given
      const body = {};

      // when
      const response = await request(app).post('/users/sign-up').send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toMatch(/is required/);
    });

    it('Returns 400 if the provided email is invalid', async () => {
      // given
      const body = {
        name: 'John Doe',
        email: 'notAValidEmail',
        password: 'password',
      };

      // when
      const response = await request(app).post('/users/sign-up').send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toMatch(/email.*must be a valid email/);
    });

    it('Returns 400 if the email is already in use', async () => {
      // given
      const body = {
        name: 'John Doe',
        email: 'john@doe.com',
        password: 'password',
      };
      await new User({
        name: 'John Doe',
        email: 'john@doe.com',
        password: hash('password'),
      }).save();

      // when
      const response = await request(app).post('/users/sign-up').send(body);

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual('Email already in use');
    });

    it('Returns 200 and a token on success', async () => {
      // given
      const body = {
        name: 'John Doe',
        email: 'john@doe.com',
        password: 'password',
      };

      // when
      const response = await request(app).post('/users/sign-up').send(body);

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('token');
      expect(response.body.message).toEqual('Signed up successfully');
    });
  });

  describe('Sign in - Login', () => {
    beforeEach(() =>
      new User({
        name: 'John Doe',
        email: 'john@doe.com',
        password: hash('password'),
      }).save()
    );

    it('Returns 400 if no auth is provided', async () => {
      // given

      // when
      const response = await request(app).post('/users/sign-in').send();

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual(
        'Credentials must be provided as Basic Auth (email:password)'
      );
    });

    it('Returns 400 if auth is empty', async () => {
      // given
      const email = undefined;
      const password = undefined;

      // when
      const response = await request(app)
        .post('/users/sign-in')
        .auth(email, password)
        .send();

      // then
      expect(response.status).toEqual(400);
      expect(response.body).toBeDefined();
      expect(response.body.error).toEqual(
        expect.stringContaining('must be a valid email')
      );
    });

    it('Returns 200 and a token on success', async () => {
      // given
      const email = 'john@doe.com';
      const password = 'password';

      // when
      const response = await request(app)
        .post('/users/sign-in')
        .auth(email, password)
        .send();

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual('Signed in successfully');
      expect(response.body).toHaveProperty('token');
    });
  });

  describe('Sign out - Logout', () => {
    beforeAll(() => {
      mockedAuth.decodeToken.mockImplementation(async (req: any, res, next) => {
        req.token = 'token';
        req.user = await User.findOne({});
        next();
      });
      mockedAuth.verifyToken.mockImplementation((req, res, next) => next());
    });

    beforeEach(() =>
      new User({
        name: 'John Doe',
        email: 'john@doe.com',
        password: hash('password'),
      }).save()
    );

    afterAll(() => {
      mockedAuth.decodeToken.mockReset();
      mockedAuth.verifyToken.mockReset();
    });

    it('Returns 200 on success', async () => {
      // given

      // when
      const response = await request(app)
        .post('/users/sign-out')
        .send();

      // then
      expect(response.status).toEqual(200);
      expect(response.body).toBeDefined();
      expect(response.body.message).toEqual('Signed out successfully');
    });
  });
});
