import express from 'express';
import rateLimit from 'express-rate-limit';

import { api } from '@/config';
import { sendReminders } from '@/socket';

import * as DB from '@/services/db';
import { checkBreeToken } from '@/services/auth';

import eventsApp from '@/routes/events';
import usersApp from '@/routes/users';
import devApp from '@/routes/dev';

const MAIN_RPM = 10;

const app = express();

app.use(
  rateLimit({
    max: MAIN_RPM,
    windowMs: 60 * 1000,
    message: 'Too many requests',
  })
);

if (api.DEV) app.use('/dev', devApp);
app.use('/events', eventsApp);
app.use('/users', usersApp);

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

export default app;
