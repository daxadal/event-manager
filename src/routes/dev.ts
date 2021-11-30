import express from 'express';

const app = express.Router();

import { sendReminders, pingAll } from '../socket';
import { getMinuteInterval } from '@/services/utils';
import bree from '../scheduler';
import * as DB from '@/services/db';

app.post('/ping', async (req, res) => {
  try {
    await pingAll();
    res.status(200).send({ message: 'All sockets pinged' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

app.post('/remind', async (req, res) => {
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

app.post('/remind-bree', async (req, res) => {
  bree.run('remind');
  res.status(200).send({ message: 'Reminders sent' });
});

app.post('/remind-all-bree', async (req, res) => {
  bree.run('remind-all');
  res.status(200).send({ message: 'Reminders sent' });
});

app.post('/remind-all', async (req, res) => {
  try {
    const events = await DB.Event.find();
    sendReminders(events);
    res.status(200).send({ message: 'Reminders sent' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

export default app;
