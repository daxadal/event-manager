const { sendReminder } = require('./socket');

const DB = require('./utils/db')();

async function sendReminders() {
  const events = await DB.Event.find();
  const subscriptions = await DB.Subscription.find().in(
    'eventId',
    events.map((event) => event.id)
  );
  const users = await DB.User.find().in(
    '_id',
    subscriptions.map((sub) => sub.subscriberId)
  );
  const reminders = subscriptions.map((sub) => ({
    event: events.find((event) => event.id == sub.eventId),
    user: users.find((user) => user.id == sub.subscriberId),
  }));

  reminders.forEach(({ event, user }) => {
    sendReminder(user.socketId);
  });
}

module.exports = { sendReminders };
