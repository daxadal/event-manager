require('dotenv').config();

const express = require('express');

const app = express();
exports.app = app;
app.use(express.json());

const config = require('../config');
const eventsApp = require('./events');
const usersApp = require('./users');
const { default: socketServer, pingAll } = require('./socket');
const { sendReminders } = require('./reminders');

app.use('/events', eventsApp);
app.use('/users', usersApp);

app.post('/ping', (req, res) => {
  pingAll();
  res.status(200).send({ message: 'All sockets pinged' });
});

app.post('/remind', (req, res) => {
  sendReminders();
  res.status(200).send({ message: 'All sockets pinged' });
});

app.use((req, res) => {
  res.status(404).send({ error: 'Endpoint not found' });
});

app.listen(config.api.PORT, () => {
  console.info(`Server listening on port ${config.api.PORT}...`);
});

socketServer.listen(config.socket.PORT, () => {
  console.info(`Socket listening on port ${config.socket.PORT}...`);
});
