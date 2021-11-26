/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');

const config = require('../config');

function DB() {
  mongoose.set('useCreateIndex', true);
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

  const eventSchema = new mongoose.Schema({
    headline: String,
    description: String,
    startDate: Date,
    location: { name: String, lat: Number, lon: Number },
    state: String,
    creatorId: mongoose.Types.ObjectId,
  });

  eventSchema.index({ creatorId: 1, state: 1 });
  eventSchema.index({ state: 1 });
  eventSchema.index({ startDate: -1 });

  const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    hashedPassword: String,
    sessionToken: String,
    socketId: String,
  });
  userSchema.index({ email: 1 });
  userSchema.index({ sessionToken: 1 });

  const subscriptionSchema = new mongoose.Schema({
    eventId: mongoose.Types.ObjectId,
    subscriberId: mongoose.Types.ObjectId,
    subscriptionDate: Date,
    comment: String,
  });
  subscriptionSchema.index({ subscriberId: 1 });
  subscriptionSchema.index({ eventId: 1 });

  const format = (object) => {
    const formatted = JSON.parse(JSON.stringify(object));
    formatted.id = formatted._id;
    delete formatted._id;
    delete formatted.__v;
    return formatted;
  };

  return {
    Event: mongoose.model('Event', eventSchema),
    Subscription: mongoose.model('Subscription', subscriptionSchema),
    User: mongoose.model('User', userSchema),
    format,
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
