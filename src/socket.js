const http = require('http');
const { Server } = require('socket.io');

const DB = require('./utils/db')();

const httpServer = http.createServer();
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('Server: Connection made to server: ', socket.id);

  socket.on('disconnect', () => {
    console.log('Server: user disconnected');
  });

  socket.on('PONG', () => {
    console.log('Server PONG', socket.id);
  });

  socket.on('sign-in', async (sessionToken) => {
    const user = await DB.User.findOne({
      sessionToken,
    });
    if (user) {
      user.socketId = socket.id;
      await user.save();
      console.log('Server: sign-in', socket.id, user.name, user.id);
      socket.emit('sign-in-ok');
    } else {
      console.log('Server: failed to sign-in', {
        socketId: socket.id,
        sessionToken,
      });
      socket.emit('sign-in-error');
    }
  });
  socket.on('sign-out', async (sessionToken) => {
    const user = await DB.User.findOne({
      sessionToken,
    });
    if (user && user.socketId === socket.id) {
      user.socketId = null;
      console.log('Server: sign-out', socket.id, user.name, user.id);
      socket.emit('sign-out-ok');
    } else {
      console.log('Server: failed to sign-out', {
        socketId: socket.id,
        sessionToken,
      });
      socket.emit('sign-out-error');
    }
  });

  // socket.emit('PING', socket.id);
});

function format(event, user, sub) {
  return {
    message: `Hi ${
      user.name
    }! You have an event at ${event.startDate.toLocaleString()}: "${
      event.headline
    }"`,
    event: DB.format(event),
    subscription: {
      subscriptionDate: sub.subscriptionDate,
      comment: sub.comment,
    },
  };
}

async function sendReminders(events) {
  const all = await io.fetchSockets();
  console.info(
    'All sockets:',
    all.map((s) => s.id)
  );
  const subscriptions = await DB.Subscription.find().in(
    'eventId',
    events.map((event) => event.id)
  );
  console.info( 'subscriptions.length', subscriptions.length);
  const users = await DB.User.find().in(
    '_id',
    subscriptions.map((sub) => sub.subscriberId)
  );
  subscriptions.forEach(async (sub) => {
    const event = events.find((e) => e.id === String(sub.eventId));
    const user = users.find((u) => u.id === String(sub.subscriberId));
    const sockets = await io.in(user.socketId).fetchSockets();
    sockets.map((socket) => socket.emit('reminder', format(event, user, sub)));
  });
}

async function pingAll() {
  io.emit('PING');
}

module.exports = { default: httpServer, sendReminders, pingAll };
