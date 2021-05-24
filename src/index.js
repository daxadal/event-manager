require('dotenv').config();

const express = require('express');
const auth = require('basic-auth');
const Joi = require('joi');

const DB = require('./db')();
const { createToken, verifyToken } = require('./auth')(DB);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register / LOGIN

app.post('/sign-up', async (req, res) => {
  try {
    const inputSchema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    });

    const newUser = await inputSchema.validateAsync(req.body).catch((error) => {
      throw error.message;
    });

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

app.post('/sign-in', async (req, res) => {
  try {
    const credentials = auth(req);
    const user = await DB.User.findOne({
      email: credentials.name,
      password: credentials.pass,
    });

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

app.post('/sign-out', verifyToken, async (req, res) => {
  req.user.sessionToken = undefined;
  await req.user.save();
  res.status(200).send({ user: req.user });
});

// EVENTS

app.post('/event', async (req, res) => {
  try {
    const inputSchema = Joi.object({
      headline: Joi.string().min(10).max(100).required(),
      description: Joi.string().max(500),
      startDate: Joi.date().required(),
      location: Joi.string().min(10).max(100).required(),
      state: Joi.valid('draft', 'public', 'private').default('draft'),
    });

    const event = await inputSchema
      .validateAsync(req.body)
      .catch((error) => error.message);

    console.log('Event:', event);

    const eventDB = await new DB.Event(event).save();
    res.status(200).send(eventDB);
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

app.get('/event/:id(\\w+)', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Params:', req.params);

    const event = await DB.Event.findById(id).exec();

    console.info('Event retieved:', event);
    if (event) res.status(200).send(event);
    else res.status(400).send({ error: 'Event not found' });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

app.put('/event/:id(\\w+)', async (req, res) => {
  try {
    const inputSchema = Joi.object({
      headline: Joi.string().min(10).max(100).required(),
      description: Joi.string().max(500),
      startDate: Joi.date().required(),
      location: Joi.string().min(10).max(100).required(),
      state: Joi.valid('draft', 'public', 'private').default('draft'),
    });

    const newEvent = await inputSchema.validateAsync(req.body);

    let event = await DB.Event.findById(req.params.id).exec();

    event.headline = newEvent.headline;
    event.description = newEvent.description;
    event.startDate = newEvent.startDate;
    event.location = newEvent.location;
    event.state = newEvent.state;

    event = await event.save();

    console.log('Event updated:', event);

    console.info(event);
    if (event) res.status(200).send(event);
    else res.status(400).send({ error: 'Event not found' });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

app.delete('/event/:id(\\w+)', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Params:', req.params);

    const recipe = await DB.Event.findByIdAndDelete(id).exec();
    if (recipe) res.status(200).send(recipe);
    else res.status(400).send({ error: 'Recipe not found' });
  } catch (error) {
    console.error(error);
    res.status(400).send({ error });
  }
});

// FINAL

app.use((req, res) => {
  res.status(404).send({ error: 'Endpoint not found' });
});

app.listen(3000, () => {
  console.info('Server listening on port 3000...');
});
