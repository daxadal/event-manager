const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();

const config = require('../config');
const eventsApp = require('./events');
const usersApp = require('./users');
const { default: socketServer, sendReminders, pingAll } = require('./socket');
const bree = require('./scheduler');
const { getMinuteInterval } = require('./utils/utils');
const { checkBreeToken } = require('./utils/auth');
const DB = require('./utils/db')();

app.use('/events', eventsApp);
app.use('/users', usersApp);

app.use(express.json({ limit: config.dos.MAIN_SIZE }));
app.use(
  rateLimit({
    max: config.dos.MAIN_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests',
  })
);

app.post('/jobs/remind', checkBreeToken, async (req, res) => {
  try {
    const { start, end } = req.dates;

    const events = await DB.Event.find({
      startDate: { $gte: start, $lte: end },
    });
    await sendReminders(events);
    res.status(200).send({ message: 'Reminders sent' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

console.info('DEV API is', config.api.DEV ? 'active' : 'NOT available');

if (config.api.DEV) {
  app.post('/dev/ping', async (req, res) => {
    try {
      await pingAll();
      res.status(200).send({ message: 'All sockets pinged' });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Internal server error' });
    }
  });

  app.post('/dev/remind', async (req, res) => {
    try {
      const { start, end } = getMinuteInterval();

      const events = await DB.Event.find({
        startDate: { $gte: start, $lte: end },
      });
      sendReminders(events);
      res.status(200).send({ message: 'Reminders sent' });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Internal server error' });
    }
  });

  app.post('/dev/remind-bree', async (req, res) => {
    bree.run('remind');
    res.status(200).send({ message: 'Reminders sent' });
  });

  app.post('/dev/remind-all-bree', async (req, res) => {
    bree.run('remind-all');
    res.status(200).send({ message: 'Reminders sent' });
  });

  app.post('/dev/remind-all', async (req, res) => {
    try {
      const events = await DB.Event.find();
      sendReminders(events);
      res.status(200).send({ message: 'Reminders sent' });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: 'Internal server error' });
    }
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
