const mongoose = require('mongoose');

const config = require('../../config');

function DB() {
  mongoose.connect(
    `${config.db.DOMAIN}:${config.db.PORT}/${config.db.DB_NAME}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  );

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', () => {
    console.info('DB connected');
  });

  const Event = mongoose.model(
    'Event',
    new mongoose.Schema({
      headline: String,
      description: String,
      startDate: Date,
      location: { name: String, lat: Number, lon: Number },
      state: String,
      creatorId: mongoose.Types.ObjectId,
    })
  );

  const User = mongoose.model(
    'User',
    new mongoose.Schema({
      name: String,
      email: String,
      hashedPassword: String,
      sessionToken: String,
      socketId: String,
    })
  );

  const Subscription = mongoose.model(
    'Subscription',
    new mongoose.Schema({
      eventId: mongoose.Types.ObjectId,
      subscriberId: mongoose.Types.ObjectId,
      subscriptionDate: Date,
      comment: String,
    })
  );

  return {
    Event,
    Subscription,
    User,
  };
}

let instance = DB();

module.exports = function Singleton() {
  if (!instance) {
    instance = new DB();
    delete instance.constructor;
  }
  return instance;
};
