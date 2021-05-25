const mongoose = require('mongoose');

const DOMAIN = process.env.DOMAIN || 'localhost';
const PORT = process.env.PORT || '27017';
const DB_NAME = process.env.DB_NAME || 'WhisbiEventManager';

module.exports = function DB(
  { domain = DOMAIN, port = PORT, dbName = DB_NAME } = {
    domain: DOMAIN,
    port: PORT,
    dbName: DB_NAME,
  }
) {
  mongoose.connect(`mongodb://${domain}:${port}/${dbName}`, {
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
      creator: mongoose.Types.ObjectId,
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

  return {
    Event,
    User,
  };
};
