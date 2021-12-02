const mongoose = require('mongoose');

const config = require('@/config');

console.info('Preparing to drop database...');

mongoose.connect(`${config.db.DOMAIN}:${config.db.PORT}/${config.db.DB_NAME}`, {
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
