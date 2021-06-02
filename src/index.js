const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();

const eventsApp = require('./events');
const usersApp = require('./users');
const devApp = require('./dev');

const config = require('../config');
const bree = require('./scheduler');
const DB = require('./utils/db')();

const { default: socketServer, sendReminders } = require('./socket');
const { checkBreeToken } = require('./utils/auth');

if (config.api.DEV) app.use('/dev', devApp);
app.use('/events', eventsApp);
app.use('/users', usersApp);

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

app.use((req, res) => {
  res.status(404).send({ error: 'Endpoint not found' });
});

app.listen(config.api.PORT, () => {
  console.info(`Server listening on port ${config.api.PORT}...`);
});

socketServer.listen(config.socket.PORT, () => {
  console.info(`Socket listening on port ${config.socket.PORT}...`);
});

console.info('DEV API is', config.api.DEV ? 'active' : 'NOT available');
console.info('Bree job is', config.bree.START ? 'active' : 'NOT available');

if (config.bree.START) {
  bree.start();
}
