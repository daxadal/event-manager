const config = require('../config');
const { sendReminders } = require('../src/socket');
const DB = require('../src/utils/db')();

async function remindEvents() {
  const now = new Date();

  console.info('Background job executing at', now.toISOString());

  const startMinute = new Date(now);
  startMinute.setSeconds(0, 0);
  startMinute.setMinutes(startMinute.getMinutes() + config.bree.MINUTES_AHEAD);

  const endMinute = new Date(now);
  endMinute.setSeconds(0, 0);
  endMinute.setMinutes(endMinute.getMinutes() + config.bree.MINUTES_AHEAD + 1);

  const events = await DB.Event.find({
    startDate: { $gte: startMinute, $lte: endMinute },
  });
  console.info(
    'Events at: ',
    startMinute.toISOString(),
    ' Found:',
    events.length
  );

  if (events.length > 0) sendReminders(events);
  process.exit(0);
}

remindEvents();
