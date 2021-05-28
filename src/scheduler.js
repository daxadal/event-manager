const Graceful = require('@ladjs/graceful');
const Cabin = require('cabin');
const Bree = require('bree');

const config = require('../config');

const bree = new Bree({
  logger: new Cabin(),

  jobs: [
    {
      name: 'reminder',
      interval: config.bree.INTERVAL,
    },
  ],
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
const graceful = new Graceful({ brees: [bree] });
graceful.listen();

module.exports = bree;
