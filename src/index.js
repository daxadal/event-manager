require('dotenv').config();

const express = require('express');

const eventsApp = require('./events');
const usersApp = require('./users');

const app = express();

app.use('/events', eventsApp);
app.use('/users', usersApp);

app.use((req, res) => {
  res.status(404).send({ error: 'Endpoint not found' });
});

app.listen(3000, () => {
  console.info('Server listening on port 3000...');
});
