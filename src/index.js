require('dotenv').config();

const express = require('express');

const config = require('../config');

const eventsApp = require('./events');
const usersApp = require('./users');

const app = express();

app.use('/events', eventsApp);
app.use('/users', usersApp);

app.use((req, res) => {
  res.status(404).send({ error: 'Endpoint not found' });
});

app.listen(config.api.PORT, () => {
  console.info(`Server listening on port ${config.api.PORT}...`);
});
