const express = require('express');
// const basicAuth = require('express-basic-auth');
const Joi = require('joi');

const DB = require('./db')();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
