const mongoose = require('mongoose');

const DOMAIN = process.env.DOMAIN || 'localhost';
const PORT = process.env.PORT || '27017';
const DB_NAME = process.env.DB_NAME || 'WhisbiEventManager';

console.info('Preparing to drop database...');

mongoose.connect(`mongodb://${DOMAIN}:${PORT}/${DB_NAME}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.dropDatabase().then(
  () => {
    console.info('Database dropped');
    mongoose.connection.close();
  },
  (error) => {
    console.error('Error dropping database:', error);
    mongoose.connection.close();
  }
);
