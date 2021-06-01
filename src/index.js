const express = require('express');

const app = express();

const config = require('../config');
const eventsApp = require('./events');
const usersApp = require('./users');
const { default: socketServer, sendReminders, pingAll } = require('./socket');
const bree = require('./scheduler');
const DB = require('./utils/db')();

app.use(express.json());

app.use('/events', eventsApp);
app.use('/users', usersApp);

console.info('DEV API is', config.api.DEV ? 'active' : 'NOT available');

if (config.api.DEV) {
  app.post('/ping', (req, res) => {
    pingAll();
    res.status(200).send({ message: 'All sockets pinged' });
  });

  app.post('/remind', async (req, res) => {
    const origin = (req.body && req.body.origin) || 'API';
    console.info('Remind ', req.body, origin);
    const now = new Date();

    const startMinute = new Date(now);
    startMinute.setSeconds(0, 0);
    startMinute.setMinutes(
      startMinute.getMinutes() + config.bree.MINUTES_AHEAD
    );

    const endMinute = new Date(now);
    endMinute.setSeconds(0, 0);
    endMinute.setMinutes(
      endMinute.getMinutes() + config.bree.MINUTES_AHEAD + 1
    );

    const events = await DB.Event.find({
      startDate: { $gte: startMinute, $lte: endMinute },
    });
    sendReminders(events, origin);
    res.status(200).send({ message: 'Reminders sent' });
  });

  app.post('/remind-bree', async (req, res) => {
    bree.run('remind');
    res.status(200).send({ message: 'Reminders sent' });
  });

  app.post('/remind-all-bree', async (req, res) => {
    bree.run('remind-all');
    res.status(200).send({ message: 'Reminders sent' });
  });

  app.post('/remind-all', async (req, res) => {
    const origin = (req.body && req.body.origin) || 'API';
    console.info('Remind ', req.body, origin);
    const events = await DB.Event.find();
    sendReminders(events, origin);
    res.status(200).send({ message: 'Reminders sent' });
  });
}

app.use((req, res) => {
  res.status(404).send({ error: 'Endpoint not found' });
});

app.listen(config.api.PORT, () => {
  console.info(`Server listening on port ${config.api.PORT}...`);
});

socketServer.listen(config.socket.PORT, () => {
  console.info(`Socket listening on port ${config.socket.PORT}...`);
});

console.info('Bree job is', config.bree.START ? 'active' : 'NOT available');

if (config.bree.START) {
  bree.start();
}
