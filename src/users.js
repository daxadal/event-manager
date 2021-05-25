const express = require('express');
const auth = require('basic-auth');
const Joi = require('joi');

const DB = require('./utils/db')();
const { createToken, verifyToken } = require('./utils/auth');

// Register / LOGIN
const usersApp = express.Router();

usersApp.use(express.json());

usersApp.post('/sign-up', async (req, res) => {
  try {
    const inputSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const newUser = await inputSchema.validateAsync(req.body).catch((error) => {
      throw error.message;
    });

    const oldUser = await DB.User.findOne({
      email: newUser.email,
    });
    console.info('Old User:', oldUser);

    if (oldUser) {
      res.status(400).send({ error: 'Email already in use' });
      return;
    }

    const user = await new DB.User(newUser).save();
    console.info('User:', user);

    const token = createToken(user);

    user.sessionToken = token;
    user.save();

    console.info('User:', user);
    res.status(200).send({ token, user });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

usersApp.post('/sign-in', async (req, res) => {
  try {
    const credentials = auth(req);
    const user = await DB.User.findOne({
      email: credentials.name,
      password: credentials.pass,
    });

    if (!user) {
      res.status(400).send({ error: 'Invalid credentials' });
      return;
    }

    const token = createToken(user);

    user.sessionToken = token;
    user.save();

    console.info('Auth:', credentials, '\nUser:', user);
    res.status(200).send({ credentials, user, token });
    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

usersApp.post('/sign-out', verifyToken, async (req, res) => {
  req.user.sessionToken = undefined;
  await req.user.save();
  res.status(200).send({ user: req.user });
});

module.exports = usersApp;
