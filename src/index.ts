import 'module-alias/register';

import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();

import eventsApp from '@/routes/events';
import usersApp from '@/routes/users';
import devApp from '@/routes/dev';

import { api, bree as breeConfig, socket } from '@/config';
import bree from '@/scheduler';
import * as DB from '@/services/db';

DB.setup();

import socketServer, { sendReminders } from '@/socket';
import { checkBreeToken } from '@/services/auth';

if (api.DEV) app.use('/dev', devApp);
app.use('/events', eventsApp);
app.use('/users', usersApp);

const MAIN_RPM = 10;

app.use(
  rateLimit({
    max: MAIN_RPM,
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests',
  })
);

app.post('/jobs/remind', checkBreeToken, async (req: any, res) => {
  try {
    console.info('Remind:', req.dates);
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

app.listen(api.PORT, () => {
  console.info(`Server listening on port ${api.PORT}...`);
});

socketServer.listen(socket.PORT, () => {
  console.info(`Socket listening on port ${socket.PORT}...`);
});

console.info('DEV API is', api.DEV ? 'active' : 'NOT available');
console.info('Bree job is', breeConfig.START ? 'active' : 'NOT available');

if (breeConfig.START) {
  bree.start();
}
