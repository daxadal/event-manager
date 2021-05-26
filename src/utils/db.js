const mongoose = require('mongoose');

function DB() {
  const DOMAIN = process.env.DOMAIN || 'localhost';
  const PORT = process.env.PORT || '27017';
  const DB_NAME = process.env.DB_NAME || 'WhisbiEventManager';

  mongoose.connect(`mongodb://${DOMAIN}:${PORT}/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

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
      location: String,
      state: String,
      creatorId: mongoose.Types.ObjectId,
    })
  );

  const User = mongoose.model(
    'User',
    new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      sessionToken: String,
    })
  );

  const Subscription = mongoose.model(
    'Subscription',
    new mongoose.Schema({
      eventId: mongoose.Types.ObjectId,
      subscriberId: mongoose.Types.ObjectId,
      name: String,
      email: String,
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
